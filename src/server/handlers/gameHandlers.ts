/**
 * Game Handlers - Socket events for game flow
 * Handles: start, call number, mark cell, claim win/flat, pause/resume/restart
 */

import type { Server, Socket } from 'socket.io';
import type { GameState, ServerToClientEvents, ClientToServerEvents, LotoCard, LotoCardGrid } from '../../lib/types';
import {
    startGame as startGameEngine,
    callNextNumber,
    setWinner,
    checkForWinners,
    pauseGame,
    resumeGame,
    resetGame,
    claimFlat,
} from '../../engine/gameEngine';
import { markCell } from '../../engine/lotoCardGenerator';
import * as store from '../store';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

// ============================================================================
// AUTO-CALL MANAGEMENT
// ============================================================================

export function startAutoCall(roomCode: string, game: GameState, io: TypedServer): void {
    if (!game.settings.autoCallEnabled) return;

    stopAutoCall(roomCode);

    const interval = setInterval(() => {
        let currentGame = store.getGame(roomCode);
        if (!currentGame || currentGame.phase !== 'playing') {
            stopAutoCall(roomCode);
            return;
        }

        currentGame = callNextNumber(currentGame);

        const winResult = checkForWinners(currentGame);
        if (winResult) {
            currentGame = setWinner(currentGame, winResult.winnerId);
            stopAutoCall(roomCode);
        }

        if (currentGame.remainingNumbers.length === 0) {
            stopAutoCall(roomCode);
        }

        store.setGame(roomCode, currentGame);
        io.to(roomCode).emit('game:state', currentGame);

        if (currentGame.currentNumber) {
            io.to(roomCode).emit('game:numberCalled', currentGame.currentNumber);
        }

        if (winResult) {
            const winner = currentGame.players.find(p => p.id === winResult.winnerId);
            io.to(roomCode).emit('game:winner', winResult.winnerId, winner?.name || 'Unknown');
        }
    }, game.settings.autoCallIntervalMs);

    store.setInterval_(roomCode, interval);
}

export function stopAutoCall(roomCode: string): void {
    store.deleteInterval(roomCode);
}

// ============================================================================
// CARD UTILITIES
// ============================================================================

/**
 * Shuffle card positions for Crazy Mode
 */
function shuffleCardPositions(card: LotoCard): LotoCard {
    const allCells = card.grid.flat().map(cell => ({ ...cell }));

    // Fisher-Yates shuffle
    for (let i = allCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
    }

    const newGrid: LotoCardGrid = [
        allCells.slice(0, 9),
        allCells.slice(9, 18),
        allCells.slice(18, 27),
    ] as LotoCardGrid;

    return { ...card, grid: newGrid };
}

// ============================================================================
// GAME FLOW HANDLERS
// ============================================================================

interface GameHandlerContext {
    io: TypedServer;
    socket: TypedSocket;
}

export function handleGameStart(
    { io, socket }: GameHandlerContext,
    getRoomCode: (socket: TypedSocket) => string | undefined
): void {
    const roomCode = getRoomCode(socket);
    if (!roomCode) return;

    let game = store.getGame(roomCode);
    if (!game || game.hostId !== socket.id) return;

    game = startGameEngine(game);
    store.setGame(roomCode, game);
    io.to(roomCode).emit('game:state', game);

    startAutoCall(roomCode, game, io);
    console.log(`[Game] Started: ${roomCode}`);
}

export function handleCallNumber(
    { io, socket }: GameHandlerContext,
    getRoomCode: (socket: TypedSocket) => string | undefined
): void {
    const roomCode = getRoomCode(socket);
    if (!roomCode) return;

    let game = store.getGame(roomCode);
    if (!game || game.hostId !== socket.id) return;

    // Reset auto-call timer on manual call
    if (game.settings.autoCallEnabled) {
        stopAutoCall(roomCode);
        startAutoCall(roomCode, game, io);
    }

    game = callNextNumber(game);

    const winResult = checkForWinners(game);
    if (winResult) {
        game = setWinner(game, winResult.winnerId);
        stopAutoCall(roomCode);
    }

    store.setGame(roomCode, game);
    io.to(roomCode).emit('game:state', game);

    if (game.currentNumber) {
        io.to(roomCode).emit('game:numberCalled', game.currentNumber);
    }

    if (winResult) {
        const winner = game.players.find(p => p.id === winResult.winnerId);
        io.to(roomCode).emit('game:winner', winResult.winnerId, winner?.name || 'Unknown');
    }
}

export function handleMarkCell(
    { io, socket }: GameHandlerContext,
    cardId: string,
    row: number,
    col: number,
    getRoomCode: (socket: TypedSocket) => string | undefined
): void {
    const roomCode = getRoomCode(socket);
    if (!roomCode) return;

    let game = store.getGame(roomCode);
    if (!game) return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player) return;

    const cardIndex = player.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    if (game.phase !== 'playing') {
        socket.emit('game:error', 'Game is not in playing phase');
        return;
    }

    const card = player.cards[cardIndex];
    const cellValue = card.grid[row][col].value;
    const calledNumbers = game.calledNumbers.map(cn => cn.value);
    const isCorrectMark = cellValue !== null && calledNumbers.includes(cellValue);

    let updatedCard = markCell(card, row, col);

    // Energy calculation
    let energyChange = 0;
    if (isCorrectMark) {
        const calledInfo = game.calledNumbers.find(cn => cn.value === cellValue);
        if (calledInfo) {
            const timeDiff = Date.now() - calledInfo.timestamp;
            energyChange = timeDiff < 2000 ? 15 : 5; // Speed bonus
        }
    } else {
        energyChange = -10; // Penalty
    }

    const newEnergy = Math.max(0, Math.min(100, (player.energy || 0) + energyChange));

    // Update player cards
    const updatedPlayers = game.players.map(p => {
        if (p.id === socket.id) {
            let newCards = p.cards.map(c => c.id === cardId ? updatedCard : c);

            // Crazy Mode shuffle
            if (game!.settings.crazyMode && isCorrectMark) {
                newCards = newCards.map(c => shuffleCardPositions(c));
            }

            return { ...p, cards: newCards, energy: newEnergy };
        }
        return p;
    });

    game = { ...game, players: updatedPlayers };
    store.setGame(roomCode, game);
    io.to(roomCode).emit('game:state', game);
}

export function handleClaimWin(
    { io, socket }: GameHandlerContext,
    cardId: string,
    getRoomCode: (socket: TypedSocket) => string | undefined
): void {
    const roomCode = getRoomCode(socket);
    if (!roomCode) return;

    let game = store.getGame(roomCode);
    if (!game || game.phase !== 'playing') return;

    const result = checkForWinners(game);
    if (result && result.winnerId === socket.id && result.winningCardId === cardId) {
        game = setWinner(game, socket.id);
        store.setGame(roomCode, game);
        stopAutoCall(roomCode);

        io.to(roomCode).emit('game:state', game);
        console.log(`[Game] Winner claimed: ${socket.id} in ${roomCode}`);
    }
}

export function handleClaimFlat(
    { io, socket }: GameHandlerContext,
    flatType: number,
    getRoomCode: (socket: TypedSocket) => string | undefined
): void {
    const roomCode = getRoomCode(socket);
    if (!roomCode) return;

    let game = store.getGame(roomCode);
    if (!game) return;

    game = claimFlat(game, socket.id, flatType);
    store.setGame(roomCode, game);
    io.to(roomCode).emit('game:state', game);

    const player = game.players.find(p => p.id === socket.id);
    if (player && player.collectedFlats.includes(flatType)) {
        io.to(roomCode).emit('game:flatClaimed', socket.id, flatType);
    }
}

export function handlePause(
    { io, socket }: GameHandlerContext,
    getRoomCode: (socket: TypedSocket) => string | undefined
): void {
    const roomCode = getRoomCode(socket);
    if (!roomCode) return;

    let game = store.getGame(roomCode);
    if (!game || game.hostId !== socket.id) return;

    stopAutoCall(roomCode);
    game = pauseGame(game);
    store.setGame(roomCode, game);
    io.to(roomCode).emit('game:state', game);
}

export function handleResume(
    { io, socket }: GameHandlerContext,
    getRoomCode: (socket: TypedSocket) => string | undefined
): void {
    const roomCode = getRoomCode(socket);
    if (!roomCode) return;

    let game = store.getGame(roomCode);
    if (!game || game.hostId !== socket.id) return;

    game = resumeGame(game);
    if (game.settings.autoCallEnabled) {
        startAutoCall(roomCode, game, io);
    }
    store.setGame(roomCode, game);
    io.to(roomCode).emit('game:state', game);
}

export function handleRestart(
    { io, socket }: GameHandlerContext,
    getRoomCode: (socket: TypedSocket) => string | undefined
): void {
    const roomCode = getRoomCode(socket);
    if (!roomCode) return;

    let game = store.getGame(roomCode);
    if (!game || game.hostId !== socket.id) return;

    stopAutoCall(roomCode);
    game = resetGame(game);
    store.setGame(roomCode, game);
    io.to(roomCode).emit('game:state', game);
    console.log(`[Game] Restarted: ${roomCode}`);
}
