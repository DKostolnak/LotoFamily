'use client';

/**
 * Stats Service
 * 
 * Handles player statistics with localStorage persistence.
 * Tracks: games played, wins, win rate, fastest win, current streak, best streak.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    fastestWinMs: number | null;  // Time from game start to win in ms
    currentStreak: number;
    bestStreak: number;
    lastPlayedAt: number | null;  // Timestamp
}

export interface MatchRecord {
    id: string;
    date: number;              // Timestamp
    durationMs: number;        // Game duration
    playerCount: number;
    winnerId: string;
    winnerName: string;
    isWin: boolean;            // Did current user win
    score: number;             // User's score
    position: number;          // 1st, 2nd, etc.
}

const STATS_KEY = 'loto_player_stats';
const HISTORY_KEY = 'loto_match_history';
const MAX_HISTORY = 50;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_STATS: PlayerStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    fastestWinMs: null,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedAt: null,
};

// ============================================================================
// STORAGE HELPERS
// ============================================================================

function loadFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;

    try {
        const stored = localStorage.getItem(key);
        if (!stored) return defaultValue;
        return JSON.parse(stored) as T;
    } catch {
        return defaultValue;
    }
}

function saveToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        console.warn('Failed to save to localStorage');
    }
}

// ============================================================================
// STATS API
// ============================================================================

/**
 * Gets current player stats
 */
export function getPlayerStats(): PlayerStats {
    return loadFromStorage(STATS_KEY, DEFAULT_STATS);
}

/**
 * Gets match history
 */
export function getMatchHistory(): MatchRecord[] {
    return loadFromStorage(HISTORY_KEY, []);
}

/**
 * Records a completed game
 */
export function recordGameResult(params: {
    isWin: boolean;
    durationMs: number;
    score: number;
    position: number;
    playerCount: number;
    winnerId: string;
    winnerName: string;
}): { stats: PlayerStats; isPersonalBest: boolean } {
    const stats = getPlayerStats();
    const history = getMatchHistory();

    // Update stats
    stats.gamesPlayed += 1;
    stats.lastPlayedAt = Date.now();

    let isPersonalBest = false;

    if (params.isWin) {
        stats.gamesWon += 1;
        stats.currentStreak += 1;

        if (stats.currentStreak > stats.bestStreak) {
            stats.bestStreak = stats.currentStreak;
        }

        // Check for personal best (fastest win)
        if (stats.fastestWinMs === null || params.durationMs < stats.fastestWinMs) {
            stats.fastestWinMs = params.durationMs;
            isPersonalBest = stats.gamesWon > 1; // Not personal best on first win
        }
    } else {
        stats.currentStreak = 0;
    }

    // Add to history
    const record: MatchRecord = {
        id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: Date.now(),
        durationMs: params.durationMs,
        playerCount: params.playerCount,
        winnerId: params.winnerId,
        winnerName: params.winnerName,
        isWin: params.isWin,
        score: params.score,
        position: params.position,
    };

    history.unshift(record);

    // Trim history to max length
    if (history.length > MAX_HISTORY) {
        history.length = MAX_HISTORY;
    }

    // Save
    saveToStorage(STATS_KEY, stats);
    saveToStorage(HISTORY_KEY, history);

    return { stats, isPersonalBest };
}

/**
 * Resets all stats (for debugging/testing)
 */
export function resetStats(): void {
    saveToStorage(STATS_KEY, DEFAULT_STATS);
    saveToStorage(HISTORY_KEY, []);
}

// ============================================================================
// COMPUTED STATS
// ============================================================================

/**
 * Calculates win rate percentage
 */
export function getWinRate(stats: PlayerStats): number {
    if (stats.gamesPlayed === 0) return 0;
    return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
}

/**
 * Formats duration in human-readable form
 */
export function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
        return `${seconds}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Formats date for display
 */
export function formatMatchDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}
