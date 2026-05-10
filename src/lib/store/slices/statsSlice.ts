/**
 * Stats Slice
 *
 * Handles player statistics and tier calculation.
 * Single Responsibility: Statistics tracking only.
 *
 * Persistence is handled automatically by the Zustand `persist` middleware
 * configured in `../index.ts` — slices only need to call `set(...)`.
 */

import type { StateCreator } from 'zustand';
import type { GameStore, StatsSlice, PlayerStats } from '../types';

/**
 * Calculate tier based on games played
 */
export function calculateTier(gamesPlayed: number): string {
    if (gamesPlayed >= 100) return 'Diamond';
    if (gamesPlayed >= 50) return 'Gold';
    if (gamesPlayed >= 20) return 'Silver';
    return 'Bronze';
}

export const createStatsSlice: StateCreator<GameStore, [], [], StatsSlice> = (set, get) => ({
    stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalEarnings: 0,
        xp: 0,
        currentStreak: 0,
        longestStreak: 0,
        currentWinStreak: 0,
        longestWinStreak: 0,
    },
    tier: 'Bronze',

    updateStats: (newStats: PlayerStats) => {
        const tier = calculateTier(newStats.gamesPlayed);
        set({ stats: newStats, tier });
    },

    incrementGamesPlayed: () => {
        const { stats } = get();
        const newStats = {
            ...stats,
            gamesPlayed: stats.gamesPlayed + 1,
        };
        const tier = calculateTier(newStats.gamesPlayed);
        set({ stats: newStats, tier });
    },

    incrementGamesWon: () => {
        const { stats } = get();
        const currentWinStreak = (stats.currentWinStreak ?? 0) + 1;
        const longestWinStreak = Math.max(stats.longestWinStreak ?? 0, currentWinStreak);

        const newStats = {
            ...stats,
            gamesWon: stats.gamesWon + 1,
            currentWinStreak,
            longestWinStreak,
        };
        set({ stats: newStats });
    },

    addEarnings: (amount: number) => {
        const { stats } = get();
        const newStats = {
            ...stats,
            totalEarnings: stats.totalEarnings + amount,
        };
        set({ stats: newStats });
    },

    /**
     * Daily-streak: continue streak. Increments currentStreak by 1 and bumps
     * longestStreak if the new run beats the previous best.
     */
    incrementStreak: () => {
        const { stats } = get();
        const currentStreak = (stats.currentStreak ?? 0) + 1;
        const longestStreak = Math.max(stats.longestStreak ?? 0, currentStreak);
        set({
            stats: {
                ...stats,
                currentStreak,
                longestStreak,
            },
        });
    },

    /**
     * Daily-streak: streak broken. Resets currentStreak to 1 (today's claim
     * is the first day of the new run). longestStreak is preserved.
     */
    resetStreak: () => {
        const { stats } = get();
        const longestStreak = Math.max(stats.longestStreak ?? 0, 1);
        set({
            stats: {
                ...stats,
                currentStreak: 1,
                longestStreak,
            },
        });
    },
});
