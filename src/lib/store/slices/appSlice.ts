/**
 * App Slice
 *
 * Handles application lifecycle: loading, errors, initialization.
 * Single Responsibility: App state management only.
 *
 * Supabase migrácia:
 *   - Starý tok: fetch(`${ENV.server.url}/profile`) cez Bearer token
 *   - Nový tok: initializeProfile() cez Supabase Auth + PostgreSQL
 *
 * Čo sa tu deje pri štarte:
 *   1. Zustand persist middleware rehydruje lokálny stav z AsyncStorage
 *   2. initializeProfile() zaistí Supabase session (anonymnú ak prvýkrát)
 *   3. Stiahne profil z Supabase DB (coins, inventory, stats...)
 *   4. Synchuje do Zustand store — server má prednosť pred lokálnym stavom
 */

import type { StateCreator } from 'zustand';
import type { GameStore, AppSlice } from '../types';
import { initializeProfile } from '../../services/supabaseProfile';
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
            // Persist middleware rehydrated local state already.
            // Now sync with Supabase — server data takes precedence.
            const current = get();

            try {
                const { profile } = await initializeProfile(
                    current.playerName || 'Player',
                    current.playerAvatar || '🎮',
                );

                // Synchuj server dáta do Zustand store
                set({
                    playerName: profile.nickname,
                    playerAvatar: profile.avatar,
                    coins: profile.coins,
                    inventory: profile.inventory,
                    activeTheme: profile.activeTheme,
                    activeSkin: profile.activeSkin,
                    stats: {
                        ...current.stats,
                        gamesPlayed: profile.gamesPlayed,
                        gamesWon: profile.gamesWon,
                        xp: profile.xp,
                    },
                    tier: profile.tier ?? calculateTier(profile.gamesPlayed),
                });
            } catch (e) {
                // Supabase sync zlyhala (offline?) — pokračuj s lokálnym stavom
                console.warn('[AppSlice] Supabase sync failed, using local state:', e);
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
