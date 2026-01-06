/**
 * Game Store - In-memory state management
 * Manages game state and auto-call intervals
 */

import type { GameState } from '@/lib/types';

// Game state storage (in-memory)
const games = new Map<string, GameState>();
const intervals = new Map<string, NodeJS.Timeout>();

// ============================================================================
// GAME STATE OPERATIONS
// ============================================================================

export function getGame(roomCode: string): GameState | undefined {
    return games.get(roomCode.toUpperCase());
}

export function setGame(roomCode: string, game: GameState): void {
    games.set(roomCode.toUpperCase(), game);
}

export function deleteGame(roomCode: string): boolean {
    return games.delete(roomCode.toUpperCase());
}

export function hasGame(roomCode: string): boolean {
    return games.has(roomCode.toUpperCase());
}

export function getAllGames(): Map<string, GameState> {
    return games;
}

// ============================================================================
// INTERVAL OPERATIONS
// ============================================================================

export function getInterval(roomCode: string): NodeJS.Timeout | undefined {
    return intervals.get(roomCode);
}

export function setInterval_(roomCode: string, interval: NodeJS.Timeout): void {
    intervals.set(roomCode, interval);
}

export function deleteInterval(roomCode: string): boolean {
    const interval = intervals.get(roomCode);
    if (interval) {
        clearInterval(interval);
        return intervals.delete(roomCode);
    }
    return false;
}

export function hasInterval(roomCode: string): boolean {
    return intervals.has(roomCode);
}

// ============================================================================
// CLEANUP OPERATIONS
// ============================================================================

/**
 * Clean up stale games older than specified age
 * @returns Number of games cleaned up
 */
export function cleanupStaleGames(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [roomCode, game] of games.entries()) {
        if (now - game.createdAt > maxAgeMs) {
            console.log(`[Store] Cleaning up stale room: ${roomCode}`);
            deleteInterval(roomCode);
            games.delete(roomCode);
            cleaned++;
        }
    }

    return cleaned;
}

/**
 * Start automatic cleanup interval
 */
export function startCleanupInterval(intervalMs: number = 60 * 60 * 1000): NodeJS.Timeout {
    return setInterval(() => cleanupStaleGames(), intervalMs);
}
