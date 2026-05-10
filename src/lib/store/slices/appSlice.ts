/**
 * App Slice
 *
 * Handles application lifecycle: loading, errors, initialization.
 * Single Responsibility: App state management only.
 *
 * NOTE: persisted slices (player, economy, stats, settings) are rehydrated
 * automatically by the Zustand `persist` middleware in `../index.ts`. This
 * slice no longer needs to manually load values from AsyncStorage — it only
 * performs an optional server sync (when an auth token is present) and flips
 * the `isInitialized` flag.
 */

import type { StateCreator } from 'zustand';
import type { GameStore, AppSlice } from '../types';
import { storageService, STORAGE_KEYS } from '../../services/storage';
import { ENV } from '../../config/env.config';
import { calculateTier } from './statsSlice';

export const createAppSlice: StateCreator<GameStore, [], [], AppSlice> = (set, get) => ({
    isLoading: true,
    error: null,
    isInitialized: false,

    setError: (error: string | null) => set({ error }),

    setLoading: (loading: boolean) => set({ isLoading: loading }),

    initialize: async () => {
        set({ isLoading: true, error: null });

        try {
            // Persist middleware has already rehydrated local state.
            // Optionally pull a fresh snapshot from the server to overwrite it.
            const token = await storageService.getString(STORAGE_KEYS.PLAYER_TOKEN);

            if (token) {
                try {
                    const response = await fetch(`${ENV.server.url}/profile`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (response.ok) {
                        const serverProfile = await response.json();
                        const current = get();

                        set({
                            playerName: serverProfile.nickname ?? current.playerName,
                            playerAvatar: serverProfile.avatar ?? current.playerAvatar,
                            coins: serverProfile.coins ?? current.coins,
                            inventory: serverProfile.inventory ?? current.inventory,
                            activeTheme: serverProfile.activeTheme ?? current.activeTheme,
                            activeSkin: serverProfile.activeSkin ?? current.activeSkin,
                            stats: {
                                gamesPlayed: serverProfile.gamesPlayed ?? current.stats.gamesPlayed,
                                gamesWon: serverProfile.gamesWon ?? current.stats.gamesWon,
                                totalEarnings: serverProfile.totalEarnings ?? current.stats.totalEarnings,
                                xp: serverProfile.xp ?? current.stats.xp,
                                fastestWinMs: current.stats.fastestWinMs,
                                longestStreak: current.stats.longestStreak,
                                currentStreak: current.stats.currentStreak,
                            },
                            tier:
                                serverProfile.tier?.toString() ??
                                calculateTier(serverProfile.gamesPlayed ?? current.stats.gamesPlayed),
                        });
                    }
                } catch (e) {
                    console.error('[AppSlice] Server sync failed:', e);
                }
            }

            set({
                isLoading: false,
                isInitialized: true,
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to initialize app',
            });
        }
    },
});
