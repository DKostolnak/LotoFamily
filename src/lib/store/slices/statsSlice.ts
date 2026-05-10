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
        const currentStreak = (stats.currentStreak ?? 0) + 1;
        const longestStreak = Math.max(stats.longestStreak ?? 0, currentStreak);

        const newStats = {
            ...stats,
            gamesWon: stats.gamesWon + 1,
            currentStreak,
            longestStreak,
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
});
