/**
 * Loto Game Server
 * 
 * Main entry point for the game server.
 * Uses Next.js for the frontend and Socket.io for real-time multiplayer.
 */

import { createServer } from 'node:http';
import os from 'node:os';
import next from 'next';
import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from './src/lib/types';
import * as store from './src/server/store';
import {
    handleRoomCreate,
    handleRoomJoin,
    handleRoomLeave,
    handleKickPlayer,
    handleRoomClose,
    handleUpdateProfile,
} from './src/server/handlers/roomHandlers';
import {
    handleGameStart,
    handleCallNumber,
    handleMarkCell,
    handleClaimWin,
    handleClaimFlat,
    handlePause,
    handleResume,
    handleRestart,
} from './src/server/handlers/gameHandlers';

import { removePlayer } from './src/engine/gameEngine';
import { serverLog, socketLog, roomLog } from './src/lib/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// ============================================================================
// UTILITIES
// ============================================================================

function getLocalIp(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIp = getLocalIp();
const serverUrl = `http://${localIp}:${port}`;

serverLog.info(`Network URL: ${serverUrl}`);

// ============================================================================
// NEXT.JS & SOCKET.IO SETUP
// ============================================================================

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Start cleanup interval
store.startCleanupInterval();

app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);

    // Helper to find room code from socket
    function getRoomCode(socket: Socket<ClientToServerEvents, ServerToClientEvents>): string | undefined {
        for (const room of socket.rooms) {
            // Room codes are 3-10 alphanumeric (custom) or 6 chars (generated)
            if (/^[A-Z0-9]{3,10}$/.test(room) && room !== socket.id) {
                return room;
            }
        }
        return undefined;
    }

    // ========================================================================
    // SOCKET EVENT HANDLERS
    // ========================================================================

    io.on('connection', (socket) => {
        socket.emit('server:info', serverUrl);

        const context = { io, socket, serverUrl };

        // Room Events
        socket.on('room:create', (playerName, avatarUrl, settings, token) => {
            handleRoomCreate(context, playerName, avatarUrl, settings, token);
        });

        socket.on('room:join', (roomCode, playerName, avatarUrl, token) => {
            handleRoomJoin(context, roomCode, playerName, avatarUrl, token);
        });

        socket.on('room:leave', () => {
            handleRoomLeave(context, getRoomCode);
        });

        socket.on('room:updateProfile', (name, avatarUrl) => {
            handleUpdateProfile(context, name, avatarUrl);
        });

        socket.on('room:kickPlayer', (targetPlayerId) => {
            handleKickPlayer(context, targetPlayerId, getRoomCode);
        });

        socket.on('room:close', () => {
            handleRoomClose(context, getRoomCode);
        });

        // Game Events
        socket.on('game:start', (options) => {
            handleGameStart(context, getRoomCode, options);
        });

        socket.on('game:callNumber', () => {
            handleCallNumber(context, getRoomCode);
        });

        socket.on('game:markCell', (cardId, row, col) => {
            handleMarkCell(context, cardId, row, col, getRoomCode);
        });

        socket.on('game:claimWin', (cardId) => {
            handleClaimWin(context, cardId, getRoomCode);
        });

        socket.on('game:claimFlat', (flatType) => {
            handleClaimFlat(context, flatType, getRoomCode);
        });

        socket.on('game:pause', () => {
            handlePause(context, getRoomCode);
        });

        socket.on('game:resume', () => {
            handleResume(context, getRoomCode);
        });

        socket.on('game:restart', () => {
            handleRestart(context, getRoomCode);
        });



        // Debug Events
        socket.on('room:addBots', () => {
            import('./src/server/handlers/debugHandlers').then(({ handleAddBots }) => {
                handleAddBots(context, getRoomCode);
            });
        });

        // Disconnect Handler
        socket.on('disconnect', () => {
            handleDisconnect(io, socket.id);
        });
    });

    // ========================================================================
    // SERVER START
    // ========================================================================

    httpServer
        .once('error', (err) => {
            serverLog.error('Server error', err);
            process.exit(1);
        })
        .listen(port, () => {
            serverLog.info(`Ready on http://${hostname}:${port}`);
        });
});

// ============================================================================
// DISCONNECT HANDLER
// ============================================================================

function handleDisconnect(io: Server, socketId: string): void {
    socketLog.info(`Client disconnected: ${socketId}`);

    for (const [code, game] of store.getAllGames().entries()) {
        const player = game.players.find(p => p.id === socketId);
        if (!player) continue;

        const updatedGame = removePlayer(game, socketId);

        if (updatedGame.players.length === 0) {
            store.deleteInterval(code);
            store.deleteGame(code);
            roomLog.info(`${code} deleted (empty after disconnect)`);
        } else {
            // Host migration
            if (game.hostId === socketId && updatedGame.players.length > 0) {
                updatedGame.hostId = updatedGame.players[0].id;
                updatedGame.players[0].isHost = true;
            }
            store.setGame(code, updatedGame);
            io.to(code).emit('game:state', updatedGame);
        }
        break;
    }
}
