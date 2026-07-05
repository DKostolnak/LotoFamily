/**
 * Game Store
 *
 * Main store that composes all slices following the Open/Closed Principle.
 * Each slice is responsible for its own domain (SRP).
 *
 * Persistence: state is automatically persisted to AsyncStorage via the
 * Zustand `persist` middleware. Slice actions only need to call `set(...)` —
 * the middleware writes the (partialized) state to AsyncStorage on change
 * and rehydrates on app start.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from './storeMiddleware';
import { useShallow } from 'zustand/react/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameStore } from './types';
import {
    createPlayerSlice,
    createEconomySlice,
    createStatsSlice,
    createSettingsSlice,
    createAppSlice,
    createSeasonSlice,
    createQuestsSlice,
} from './slices';

/**
 * Main game store - composes all slices, persisted via Zustand middleware.
 *
 * Benefits of this architecture:
 * 1. Single Responsibility: Each slice handles one concern
 * 2. Open/Closed: Add new features via new slices without modifying existing ones
 * 3. Dependency Inversion: Components depend on store interface, not implementation
 * 4. Testability: Each slice can be tested in isolation
 */
export const useGameStore = create<GameStore>()(
    persist(
        (...args) => ({
            // Player identity management
            ...createPlayerSlice(...args),

            // Economy & inventory management
            ...createEconomySlice(...args),

            // Player statistics tracking
            ...createStatsSlice(...args),

            // App settings/preferences
            ...createSettingsSlice(...args),

            // App lifecycle management
            ...createAppSlice(...args),

            // Season / Battle Pass progression
            ...createSeasonSlice(...args),

            // Daily quests / missions (local, offline-first)
            ...createQuestsSlice(...args),
        }),
        {
            name: 'loto-game-storage',
            storage: createJSONStorage(() => AsyncStorage),
            version: 1,
            // Persist domain data only — never transient flags like
            // isLoading / error / isInitialized.
            partialize: (state) => ({
                playerName: state.playerName,
                playerAvatar: state.playerAvatar,
                coins: state.coins,
                inventory: state.inventory,
                lastDailyBonus: state.lastDailyBonus,
                activeTheme: state.activeTheme,
                activeSkin: state.activeSkin,
                powerUps: state.powerUps,
                stats: state.stats,
                tier: state.tier,
                isMuted: state.isMuted,
                language: state.language,
                batterySaver: state.batterySaver,
                tutorialCompleted: state.tutorialCompleted,
                notificationsEnabled: state.notificationsEnabled,
                announcerMode: state.announcerMode,
                // Season / Battle Pass
                seasonId: state.seasonId,
                seasonStartedAt: state.seasonStartedAt,
                seasonEndsAt: state.seasonEndsAt,
                seasonXp: state.seasonXp,
                seasonLevel: state.seasonLevel,
                hasPremium: state.hasPremium,
                claimedFree: state.claimedFree,
                claimedPremium: state.claimedPremium,
                // Daily quests
                questsDate: state.questsDate,
                dailyQuests: state.dailyQuests,
            }),
        }
    )
);

// ============================================================================
// Selector Hooks (for optimized re-renders)
// ============================================================================
//
// All composite selectors return a fresh object every call, so we wrap them
// with `useShallow` to ensure components re-render only when one of the
// selected fields actually changes.

/**
 * Select player profile data
 */
export const usePlayerProfile = () =>
    useGameStore(
        useShallow((state) => ({
            playerName: state.playerName,
            playerAvatar: state.playerAvatar,
            setPlayerName: state.setPlayerName,
            setPlayerAvatar: state.setPlayerAvatar,
        }))
    );

/**
 * Select economy data
 */
export const useEconomy = () =>
    useGameStore(
        useShallow((state) => ({
            coins: state.coins,
            inventory: state.inventory,
            activeTheme: state.activeTheme,
            activeSkin: state.activeSkin,
            addCoins: state.addCoins,
            purchaseItem: state.purchaseItem,
            equipItem: state.equipItem,
        }))
    );

/**
 * Select player stats
 */
export const usePlayerStats = () =>
    useGameStore(
        useShallow((state) => ({
            stats: state.stats,
            tier: state.tier,
            updateStats: state.updateStats,
        }))
    );

/**
 * Select app settings
 */
export const useSettings = () =>
    useGameStore(
        useShallow((state) => ({
            isMuted: state.isMuted,
            language: state.language,
            batterySaver: state.batterySaver,
            tutorialCompleted: state.tutorialCompleted,
            notificationsEnabled: state.notificationsEnabled,
            announcerMode: state.announcerMode,
            setMuted: state.setMuted,
            setLanguage: state.setLanguage,
            setBatterySaver: state.setBatterySaver,
            setTutorialCompleted: state.setTutorialCompleted,
            setNotificationsEnabled: state.setNotificationsEnabled,
            setAnnouncerMode: state.setAnnouncerMode,
        }))
    );

/**
 * Select app state (loading, errors)
 */
export const useAppState = () =>
    useGameStore(
        useShallow((state) => ({
            isLoading: state.isLoading,
            error: state.error,
            isInitialized: state.isInitialized,
            initialize: state.initialize,
        }))
    );

// Re-export types for convenience
export type { GameStore, PlayerStats } from './types';
