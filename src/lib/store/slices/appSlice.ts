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
import { initializeProfile, syncEconomy, updateProfile, syncSeasonProgress, fetchSeasonProgress } from '../../services/supabaseProfile';
import { getSession } from '../../services/supabase';
import { purchasesService } from '../../services/purchases';
import { crashReporting } from '../../services/crashReporting';
import { calculateTier } from './statsSlice';

export const createAppSlice: StateCreator<GameStore, [], [], AppSlice> = (set, get) => ({
    isLoading: true,
    error: null,
    isInitialized: false,
    pendingDeepLink: null,

    setError: (error: string | null) => set({ error }),
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setPendingDeepLink: (link) => set({ pendingDeepLink: link }),

    initialize: async () => {
        set({ isLoading: true, error: null });

        try {
            const current = get();

            try {
                const { userId, profile } = await initializeProfile(
                    current.playerName || 'Player',
                    current.playerAvatar || '🎮',
                );

                // IAP: bind purchases to the Supabase user so they survive
                // reinstall / device switch. Also restores the ad-free
                // entitlement into adsService. Fire-and-forget.
                purchasesService.init(userId).catch(() => {});
                crashReporting.setUser({ id: userId, name: profile.nickname });

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
                    // Restore daily bonus timestamp for cross-device sync.
                    // Only overwrite if server has a more recent claim.
                    lastDailyBonus: profile.lastBonusClaimedAt
                        ? Math.max(
                            current.lastDailyBonus,
                            new Date(profile.lastBonusClaimedAt).getTime()
                          )
                        : current.lastDailyBonus,
                });

                // Restore Battle Pass progress from Supabase (cross-device sync)
                const currentSeason = get();
                if (currentSeason.seasonId) {
                    const seasonData = await fetchSeasonProgress(userId, currentSeason.seasonId);
                    if (seasonData) {
                        // Server wins if it has higher XP (more progress)
                        if (seasonData.season_xp >= currentSeason.seasonXp) {
                            set({
                                seasonXp: seasonData.season_xp,
                                seasonLevel: seasonData.season_level,
                                hasPremium: seasonData.has_premium || currentSeason.hasPremium,
                                claimedFree: seasonData.claimed_free,
                                claimedPremium: seasonData.claimed_premium,
                            });
                        }
                    }
                }
            } catch (e) {
                console.warn('[AppSlice] Supabase sync failed, using local state:', e);
            }

            set({ isLoading: false, isInitialized: true });

            // Bootstrap / roll over the Battle Pass season now that we know
            // the local state is fully rehydrated and server-synced.
            get().checkSeasonRollover();

            // Generate today's daily quests (rolls over stale sets from
            // previous days).
            get().ensureDailyQuests();
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

            // Sync inventory, equip settings and daily bonus timestamp
            await updateProfile(session.user.id, {
                inventory: state.inventory,
                active_theme: state.activeTheme,
                active_skin: state.activeSkin,
                nickname: state.playerName,
                avatar: state.playerAvatar,
                tier: state.tier,
                last_bonus_claimed_at: state.lastDailyBonus > 0
                    ? new Date(state.lastDailyBonus).toISOString()
                    : null,
            });

            // Sync Battle Pass / Season progress
            if (state.seasonId) {
                await syncSeasonProgress(session.user.id, {
                    season_id: state.seasonId,
                    season_xp: state.seasonXp,
                    season_level: state.seasonLevel,
                    has_premium: state.hasPremium,
                    claimed_free: state.claimedFree,
                    claimed_premium: state.claimedPremium,
                });
            }
        } catch (e) {
            // Sync je best-effort — offline/error neblokuje hru
            console.warn('[AppSlice] syncToSupabase failed:', e);
        }
    },
});
