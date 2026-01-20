/**
 * App Slice
 * 
 * Handles application lifecycle: loading, errors, initialization.
 * Single Responsibility: App state management only.
 */

import type { StateCreator } from 'zustand';
import type { GameStore, AppSlice } from '../types';
import type { Language } from '../../i18n';
import {
    storageService,
    STORAGE_KEYS,
    getPlayerName,
    getPlayerAvatar,
    getCoins,
    getInventory,
    getLastDailyBonus,
    getActiveTheme,
    getActiveSkin,
    getStats,
} from '../../services/storage';
import { ENV } from '../../config/env.config';
import { calculateTier } from './statsSlice';

export const createAppSlice: StateCreator<GameStore, [], [], AppSlice> = (set) => ({
    isLoading: true,
    error: null,
    isInitialized: false,

    setError: (error: string | null) => set({ error }),

    setLoading: (loading: boolean) => set({ isLoading: loading }),

    initialize: async () => {
        set({ isLoading: true, error: null });

        try {
            // Load all data in parallel for performance
            const [
                name,
                avatar,
                coins,
                inventory,
                lastDailyBonus,
                activeTheme,
                activeSkin,
                stats,
                isMuted,
                language,
                batterySaver,
            ] = await Promise.all([
                getPlayerName(),
                getPlayerAvatar(),
                getCoins(),
                getInventory(),
                getLastDailyBonus(),
                getActiveTheme(),
                getActiveSkin(),
                getStats(),
                storageService.get<boolean>(STORAGE_KEYS.AUDIO_MUTED),
                storageService.get<Language>(STORAGE_KEYS.LANGUAGE),
                storageService.get<boolean>(STORAGE_KEYS.BATTERY_SAVER),
            ]);

            // Server Sync (If token exists)
            const token = await storageService.getString(STORAGE_KEYS.PLAYER_TOKEN);
            let serverProfile = null;
            if (token) {
                try {
                    const response = await fetch(`${ENV.server.url}/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        serverProfile = await response.json();
                    }
                } catch (e) {
                    console.error('[AppSlice] Sync failed:', e);
                }
            }

            set({
                // Player
                playerName: serverProfile?.nickname || name || '',
                playerAvatar: serverProfile?.avatar || avatar,

                // Economy
                coins: serverProfile?.coins ?? coins,
                inventory: serverProfile?.inventory || inventory,
                lastDailyBonus,
                activeTheme: serverProfile?.activeTheme || activeTheme,
                activeSkin: serverProfile?.activeSkin || activeSkin,

                // Stats
                stats: serverProfile ? {
                    gamesPlayed: serverProfile.gamesPlayed,
                    gamesWon: serverProfile.gamesWon,
                    totalEarnings: serverProfile.totalEarnings,
                    xp: serverProfile.xp,
                } : stats,
                tier: serverProfile?.tier?.toString() || calculateTier(serverProfile?.gamesPlayed || stats.gamesPlayed),

                // App state
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
