import type { GameState } from '@/lib/types';
import type { Server } from 'socket.io';
import { callNextNumber, setWinner, checkForWinners } from '@/engine/gameEngine';

// Room code -> Interval ID
const roomIntervals = new Map<string, NodeJS.Timeout>();

/**
 * Start auto-call interval for a room
 */
export function startAutoCall(
    roomCode: string,
    game: GameState,
    io: Server,
    games: Map<string, GameState>
): void {
    if (!game.settings.autoCallEnabled) return;

    // Clear existing if any
    stopAutoCall(roomCode);

    const interval = setInterval(() => {
        let currentGame = games.get(roomCode);
        if (!currentGame || currentGame.phase !== 'playing') {
            stopAutoCall(roomCode);
            return;
        }

        currentGame = callNextNumber(currentGame);

        // Check winners
        const winResult = checkForWinners(currentGame);
        if (winResult) {
            currentGame = setWinner(currentGame, winResult.winnerId);
            stopAutoCall(roomCode);
        }

        if (currentGame.remainingNumbers.length === 0) {
            stopAutoCall(roomCode);
        }

        games.set(roomCode, currentGame);
        io.to(roomCode).emit('game:state', currentGame);

        if (currentGame.currentNumber) {
            io.to(roomCode).emit('game:numberCalled', currentGame.currentNumber);
        }

        if (winResult) {
            const winner = currentGame.players.find(p => p.id === winResult.winnerId);
            io.to(roomCode).emit('game:winner', winResult.winnerId, winner?.name || 'Unknown');
        }

    }, game.settings.autoCallIntervalMs);

    roomIntervals.set(roomCode, interval);
}

/**
 * Stop auto-call interval for a room
 */
export function stopAutoCall(roomCode: string): void {
    const interval = roomIntervals.get(roomCode);
    if (interval) {
        clearInterval(interval);
        roomIntervals.delete(roomCode);
    }
}

/**
 * Clean up stale games older than specified age
 */
export function cleanupStaleGames(
    games: Map<string, GameState>,
    maxAgeMs: number = 24 * 60 * 60 * 1000
): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [roomCode, game] of games.entries()) {
        if (now - game.createdAt > maxAgeMs) {
            console.log(`Cleaning up stale room: ${roomCode}`);
            stopAutoCall(roomCode);
            games.delete(roomCode);
            cleaned++;
        }
    }

    return cleaned;
}

/**
 * Get interval reference (for testing)
 */
export function getIntervals(): Map<string, NodeJS.Timeout> {
    return roomIntervals;
}
