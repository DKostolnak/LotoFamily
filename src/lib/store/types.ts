/**
 * Store Types
 * 
 * Centralized type definitions for all store slices.
 * Follows Interface Segregation Principle (ISP).
 */

import type { Language } from '../i18n';

// ============================================================================
// Player Slice Types
// ============================================================================

export interface PlayerState {
    playerName: string;
    playerAvatar: string;
}

export interface PlayerActions {
    setPlayerName: (name: string) => void;
    setPlayerAvatar: (avatar: string) => void;
}

export type PlayerSlice = PlayerState & PlayerActions;

// ============================================================================
// Economy Slice Types
// ============================================================================

export interface EconomyState {
    coins: number;
    inventory: string[];
    lastDailyBonus: number;
    activeTheme: string;
    activeSkin: string;
}

export interface EconomyActions {
    addCoins: (amount: number) => void;
    removeCoins: (amount: number) => boolean;
    purchaseItem: (itemId: string, cost: number) => boolean;
    checkDailyBonus: () => number;
    equipItem: (category: 'theme' | 'skin', id: string) => void;
}

export type EconomySlice = EconomyState & EconomyActions;

// ============================================================================
// Stats Slice Types
// ============================================================================

export interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    totalEarnings: number;
    xp: number;
    fastestWinMs?: number;
    /** Daily login streak — longest run of consecutive days claimed. */
    longestStreak: number;
    /** Daily login streak — current run of consecutive days claimed. */
    currentStreak: number;
    /** Win streak — current run of consecutive games won. */
    currentWinStreak: number;
    /** Win streak — longest run of consecutive games won. */
    longestWinStreak: number;
}

export interface StatsState {
    stats: PlayerStats;
    tier: string; // Descriptive name (Bronze, Gold, etc.)
}

export interface StatsActions {
    updateStats: (stats: PlayerStats) => void;
    incrementGamesPlayed: () => void;
    incrementGamesWon: () => void;
    addEarnings: (amount: number) => void;
    /** Daily-streak: continue streak (+1) and update longestStreak. */
    incrementStreak: () => void;
    /** Daily-streak: streak broken — reset currentStreak to 1 for today's claim. */
    resetStreak: () => void;
}

export type StatsSlice = StatsState & StatsActions;

// ============================================================================
// Settings Slice Types
// ============================================================================

export interface SettingsState {
    isMuted: boolean;
    language: Language;
    batterySaver: boolean;
    /** Has the first-time-user interactive tutorial been completed/skipped? */
    tutorialCompleted: boolean;
}

export interface SettingsActions {
    setMuted: (muted: boolean) => void;
    setLanguage: (lang: Language) => void;
    setBatterySaver: (enabled: boolean) => void;
    setTutorialCompleted: (done: boolean) => void;
}

export type SettingsSlice = SettingsState & SettingsActions;

// ============================================================================
// App Slice Types (Loading/Error state)
// ============================================================================

export interface AppState {
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;
}

export interface AppActions {
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
    initialize: () => Promise<void>;
}

export type AppSlice = AppState & AppActions;

// ============================================================================
// Combined Store Type
// ============================================================================

export type GameStore = PlayerSlice & EconomySlice & StatsSlice & SettingsSlice & AppSlice;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_PLAYER_STATE: PlayerState = {
    playerName: '',
    playerAvatar: '🐻',
};

export const DEFAULT_ECONOMY_STATE: EconomyState = {
    coins: 1000,
    inventory: ['theme_classic', 'skin_classic'],
    lastDailyBonus: 0,
    activeTheme: 'theme_classic',
    activeSkin: 'skin_classic',
};

export const DEFAULT_STATS_STATE: StatsState = {
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
};

export const DEFAULT_SETTINGS_STATE: SettingsState = {
    isMuted: false,
    language: 'en',
    batterySaver: false,
    tutorialCompleted: false,
};

export const DEFAULT_APP_STATE: AppState = {
    isLoading: true,
    error: null,
    isInitialized: false,
};
