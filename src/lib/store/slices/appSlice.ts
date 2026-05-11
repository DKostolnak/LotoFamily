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
 *
 * syncToSupabase() voláme po:
 *   - Konci hry (coins + stats)
 *   - Nákupe v shope
 *   - Claimovaní denného bonusu
 */

import type { StateCreator } from 'zustand';
import type { GameStore, AppSlice } from '../types';
import { initializeProfile, syncEconomy, updateProfile } from '../../services/supabaseProfile';
import { getSession } from '../../services/supabase';
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
            const current = get();

            try {
                const { profile } = await initializeProfile(
                    current.playerName || 'Player',
                    current.playerAvatar || '🎮',
                );

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
                console.warn('[AppSlice] Supabase sync failed, using local state:', e);
            }

            set({ isLoading: false, isInitialized: true });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to initialize app',
            });
        }
    },

    /**
     * Synchronizuje aktuálny Zustand stav do Supabase.
     *
     * Kedy volať:
     *   - Po konci hry: await syncToSupabase()
     *   - Po nákupe: await syncToSupabase()
     *   - Po dennom bonuse: await syncToSupabase()
     *
     * Fire-and-forget je OK — lokálny stav je source of truth,
     * Supabase je backup + cross-device sync.
     */
    syncToSupabase: async () => {
        try {
            const { data: { session } } = await getSession();
            if (!session?.user?.id) return;

            const state = get();
            await syncEconomy(
                session.user.id,
                state.coins,
                state.stats.xp,
                state.stats.gamesPlayed,
                state.stats.gamesWon,
            );

            // Sync inventory + equip nastavenia
            await updateProfile(session.user.id, {
                inventory: state.inventory,
                active_theme: state.activeTheme,
                active_skin: state.activeSkin,
                nickname: state.playerName,
                avatar: state.playerAvatar,
                tier: state.tier,
            });
        } catch (e) {
            // Sync je best-effort — offline/error neblokuje hru
            console.warn('[AppSlice] syncToSupabase failed:', e);
        }
    },
});
