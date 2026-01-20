/**
 * Game Store
 * 
 * Main store that composes all slices following the Open/Closed Principle.
 * Each slice is responsible for its own domain (SRP).
 */

import { create } from 'zustand';
import type { GameStore } from './types';
import {
    createPlayerSlice,
    createEconomySlice,
    createStatsSlice,
    createSettingsSlice,
    createAppSlice,
} from './slices';

/**
 * Main game store - composes all slices
 * 
 * Benefits of this architecture:
 * 1. Single Responsibility: Each slice handles one concern
 * 2. Open/Closed: Add new features via new slices without modifying existing ones
 * 3. Dependency Inversion: Components depend on store interface, not implementation
 * 4. Testability: Each slice can be tested in isolation
 */
export const useGameStore = create<GameStore>()((...args) => ({
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
}));

// ============================================================================
// Selector Hooks (for optimized re-renders)
// ============================================================================

/**
 * Select player profile data
 */
export const usePlayerProfile = () =>
    useGameStore((state) => ({
        playerName: state.playerName,
        playerAvatar: state.playerAvatar,
        setPlayerName: state.setPlayerName,
        setPlayerAvatar: state.setPlayerAvatar,
    }));

/**
 * Select economy data
 */
export const useEconomy = () =>
    useGameStore((state) => ({
        coins: state.coins,
        inventory: state.inventory,
        activeTheme: state.activeTheme,
        activeSkin: state.activeSkin,
        addCoins: state.addCoins,
        purchaseItem: state.purchaseItem,
        equipItem: state.equipItem,
    }));

/**
 * Select player stats
 */
export const usePlayerStats = () =>
    useGameStore((state) => ({
        stats: state.stats,
        tier: state.tier,
        updateStats: state.updateStats,
    }));

/**
 * Select app settings
 */
export const useSettings = () =>
    useGameStore((state) => ({
        isMuted: state.isMuted,
        language: state.language,
        batterySaver: state.batterySaver,
        setMuted: state.setMuted,
        setLanguage: state.setLanguage,
        setBatterySaver: state.setBatterySaver,
    }));

/**
 * Select app state (loading, errors)
 */
export const useAppState = () =>
    useGameStore((state) => ({
        isLoading: state.isLoading,
        error: state.error,
        isInitialized: state.isInitialized,
        initialize: state.initialize,
    }));

// Re-export types for convenience
export type { GameStore, PlayerStats } from './types';
