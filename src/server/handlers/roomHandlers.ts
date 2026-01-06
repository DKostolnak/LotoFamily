/**
 * Room Handlers - Socket events for room management
 * Handles: create, join, leave, kick, close, profile update
 */

import type { Server, Socket } from 'socket.io';
import type { GameState, GameSettings, ServerToClientEvents, ClientToServerEvents } from '../../lib/types';
import { createGame, addPlayer, removePlayer } from '../../engine/gameEngine';
import * as store from '../store';
import { roomLog } from '../../lib/logger';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

interface RoomHandlerContext {
    io: TypedServer;
    socket: TypedSocket;
    serverUrl: string;
}

/**
 * Generate a unique room code
 */
function generateUniqueRoomCode(): string {
    let code: string;
    do {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (store.hasGame(code));
    return code;
}

/**
 * Validate custom room code format
 */
function isValidRoomCode(code: string): boolean {
    return /^[A-Z0-9]{3,10}$/.test(code);
}

/**
 * Handle room:create event
 */
export function handleRoomCreate(
    { io, socket, serverUrl }: RoomHandlerContext,
    playerName: string,
    avatarUrl: string,
    settings: Partial<GameSettings>,
    token?: string
): void {
    let roomCode: string;

    // Handle custom room code
    if (settings.customRoomCode && typeof settings.customRoomCode === 'string') {
        const requestedCode = settings.customRoomCode.trim().toUpperCase();

        if (!isValidRoomCode(requestedCode)) {
            socket.emit('game:error', 'Invalid Room Code. Use 3-10 letters/numbers.');
            return;
        }

        if (store.hasGame(requestedCode)) {
            socket.emit('game:error', 'Room Code already taken. Try another.');
            return;
        }

        roomCode = requestedCode;
    } else {
        roomCode = generateUniqueRoomCode();
    }

    const playerId = socket.id;
    const gameSettings: GameSettings = {
        gameMode: settings.gameMode || 'classic',
        maxPlayers: settings.maxPlayers || 4,
        cardsPerPlayer: settings.cardsPerPlayer || 3,
        autoCallEnabled: settings.autoCallEnabled || false,
        autoCallIntervalMs: settings.autoCallIntervalMs || 5000,
        language: settings.language || 'en',
        crazyMode: settings.crazyMode || false,
    };

    const newGame = createGame(playerId, playerName, avatarUrl, gameSettings, token);
    newGame.roomId = roomCode;
    newGame.roomCode = roomCode;
    newGame.serverUrl = serverUrl;

    store.setGame(roomCode, newGame);
    socket.join(roomCode);

    socket.emit('room:created', roomCode);
    socket.emit('game:state', newGame);
    roomLog.info(`Created: ${roomCode} by ${playerName} (${playerId})`);
}

/**
 * Handle room:join event
 */
export function handleRoomJoin(
    { io, socket, serverUrl }: RoomHandlerContext,
    roomCode: string,
    playerName: string,
    avatarUrl: string,
    token?: string
): void {
    const upperRoomCode = roomCode.toUpperCase();
    const game = store.getGame(upperRoomCode);

    if (!game) {
        socket.emit('game:error', 'Room not found');
        return;
    }

    // Check for reconnection
    const existingPlayerIndex = game.players.findIndex(p => p.token && p.token === token);

    if (existingPlayerIndex !== -1) {
        handleReconnection(io, socket, game, existingPlayerIndex, upperRoomCode, serverUrl);
        return;
    }

    if (game.phase !== 'lobby') {
        socket.emit('game:error', 'Game has already started');
        return;
    }

    const updatedGame = addPlayer(game, socket.id, playerName, avatarUrl, token);
    if (!updatedGame) {
        socket.emit('game:error', 'Could not join room (full or error)');
        return;
    }

    store.setGame(upperRoomCode, updatedGame);
    socket.join(upperRoomCode);

    io.to(upperRoomCode).emit('game:state', updatedGame);
    roomLog.info(`Player joined: ${playerName} (${socket.id}) to ${upperRoomCode}`);
}

/**
 * Handle player reconnection
 */
function handleReconnection(
    io: TypedServer,
    socket: TypedSocket,
    game: GameState,
    playerIndex: number,
    roomCode: string,
    serverUrl: string
): void {
    const oldPlayerId = game.players[playerIndex].id;

    // Update player ID to new socket ID
    game.players[playerIndex].id = socket.id;
    game.players[playerIndex].isConnected = true;

    // Update references to player ID
    if (game.hostId === oldPlayerId) game.hostId = socket.id;
    if (game.winnerId === oldPlayerId) game.winnerId = socket.id;
    if (game.flatWinners.flat1 === oldPlayerId) game.flatWinners.flat1 = socket.id;
    if (game.flatWinners.flat2 === oldPlayerId) game.flatWinners.flat2 = socket.id;

    game.serverUrl = serverUrl;
    store.setGame(roomCode, game);
    socket.join(roomCode);

    io.to(roomCode).emit('game:state', game);
    roomLog.info(`Player reconnected to ${roomCode}`);
}

/**
 * Handle room:leave event
 */
export function handleRoomLeave(
    { io, socket }: RoomHandlerContext,
    getRoomCode: (socket: TypedSocket) => string | undefined
): void {
    const roomCode = getRoomCode(socket);
    if (!roomCode) return;

    const game = store.getGame(roomCode);
    if (!game) return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player) return;

    const updatedGame = removePlayer(game, socket.id);
    socket.leave(roomCode);

    if (updatedGame.players.length === 0) {
        store.deleteInterval(roomCode);
        store.deleteGame(roomCode);
        roomLog.info(`${roomCode} deleted (empty)`);
    } else {
        // Host migration
        if (game.hostId === socket.id && updatedGame.players.length > 0) {
            updatedGame.hostId = updatedGame.players[0].id;
            updatedGame.players[0].isHost = true;
        }
        store.setGame(roomCode, updatedGame);
        io.to(roomCode).emit('game:state', updatedGame);
    }
}

/**
 * Handle room:kickPlayer event
 */
export function handleKickPlayer(
    { io, socket }: RoomHandlerContext,
    targetPlayerId: string,
    getRoomCode: (socket: TypedSocket) => string | undefined
): void {
    const roomCode = getRoomCode(socket);
    if (!roomCode) return;

    const game = store.getGame(roomCode);
    if (!game) return;

    // Verify host
    if (game.hostId !== socket.id) {
        roomLog.warn(`Non-host ${socket.id} tried to kick ${targetPlayerId}`);
        return;
    }

    const targetPlayer = game.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return;

    roomLog.info(`Host kicking player ${targetPlayerId} from ${roomCode}`);

    io.to(targetPlayerId).emit('room:kicked');

    const updatedGame = removePlayer(game, targetPlayerId);
    store.setGame(roomCode, updatedGame);

    const targetSocket = io.sockets.sockets.get(targetPlayerId);
    if (targetSocket) {
        targetSocket.leave(roomCode);
    }

    io.to(roomCode).emit('game:state', updatedGame);
    io.to(roomCode).emit('game:playerLeft', targetPlayerId);
}

/**
 * Handle room:close event
 */
export function handleRoomClose(
    { io, socket }: RoomHandlerContext,
    getRoomCode: (socket: TypedSocket) => string | undefined
): void {
    const roomCode = getRoomCode(socket);
    if (!roomCode) return;

    const game = store.getGame(roomCode);
    if (!game) return;

    // Verify host
    if (game.hostId !== socket.id) {
        roomLog.warn(`Non-host ${socket.id} tried to close room ${roomCode}`);
        return;
    }

    roomLog.info(`Host closing room ${roomCode}`);

    io.to(roomCode).emit('room:closed');

    const socketsInRoom = io.sockets.adapter.rooms.get(roomCode);
    if (socketsInRoom) {
        for (const socketId of socketsInRoom) {
            const s = io.sockets.sockets.get(socketId);
            if (s) s.leave(roomCode);
        }
    }

    store.deleteInterval(roomCode);
    store.deleteGame(roomCode);
}

/**
 * Handle room:updateProfile event
 */
export function handleUpdateProfile(
    { io, socket }: RoomHandlerContext,
    name: string,
    avatarUrl: string
): void {
    for (const [code, game] of store.getAllGames().entries()) {
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
            game.players[playerIndex].name = name;
            game.players[playerIndex].avatarUrl = avatarUrl;

            store.setGame(code, game);
            io.to(code).emit('game:state', game);
            roomLog.info(`Player ${socket.id} updated profile: ${name}`);
            break;
        }
    }
}
