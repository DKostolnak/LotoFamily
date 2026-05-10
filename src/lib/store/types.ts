/**
 * Store Types
 * 
 * Centralized type definitions for all store slices.
 * Follows Interface Segregation Principle (ISP).
 */

import type { Language } from '../i18n';
import type { SeasonReward } from '../config/season.config';
import type { AnnouncerMode } from '../services/audio';

export type { AnnouncerMode };

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

/**
 * Consumable power-up inventory.
 *
 * Power-ups are *consumable* gameplay boosts (separate from the cosmetic
 * `inventory` array which holds owned themes/skins/avatars). Each entry is
 * a non-negative count.
 *
 * MVP types:
 *  - `peek`       — reveal next 3 numbers
 *  - `luckyMark`  — auto-mark one missed called number on player's card
 *  - `slowTime`   — 2× slower auto-call for 30s
 *
 * The shape is intentionally an object (not a Map) so it survives JSON
 * persistence (Zustand `persist` middleware). New power-up types can be
 * added by extending this interface.
 */
export interface PowerUpInventory {
    peek: number;
    luckyMark: number;
    slowTime: number;
}

export interface EconomyState {
    coins: number;
    inventory: string[];
    lastDailyBonus: number;
    activeTheme: string;
    activeSkin: string;
    /** Consumable power-up counts. NEVER mix with cosmetic `inventory`. */
    powerUps: PowerUpInventory;
}

export interface EconomyActions {
    addCoins: (amount: number) => void;
    removeCoins: (amount: number) => boolean;
    purchaseItem: (itemId: string, cost: number) => boolean;
    checkDailyBonus: () => number;
    equipItem: (category: 'theme' | 'skin', id: string) => void;
    /** Add `count` of given power-up type to inventory (e.g. via shop or rewarded ad). */
    addPowerUp: (type: keyof PowerUpInventory, count: number) => void;
    /**
     * Try to consume one of the given power-up type.
     * @returns true if a unit was consumed (count decremented), false if none available.
     */
    usePowerUp: (type: keyof PowerUpInventory) => boolean;
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
    /**
     * User preference for local notifications (daily bonus reminders, etc.).
     * Independent from the OS-level permission grant. Opt-out model — defaults
     * to true so we can schedule reminders the moment permission is granted.
     */
    notificationsEnabled: boolean;
    /**
     * Voice announcer mode for called numbers. `nicknames` mixes in
     * traditional folk callouts ("two fat ladies" / "топорики").
     */
    announcerMode: AnnouncerMode;
}

export interface SettingsActions {
    setMuted: (muted: boolean) => void;
    setLanguage: (lang: Language) => void;
    setBatterySaver: (enabled: boolean) => void;
    setTutorialCompleted: (done: boolean) => void;
    setNotificationsEnabled: (enabled: boolean) => void;
    setAnnouncerMode: (mode: AnnouncerMode) => void;
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
// Season / Battle Pass Slice Types
// ============================================================================

export interface SeasonState {
    /** Stable id, e.g. 'season_2026_05'. */
    seasonId: string;
    /** ms timestamp the current season started. */
    seasonStartedAt: number;
    /** ms timestamp the current season ends (start + 30 days). */
    seasonEndsAt: number;
    /** Total XP earned in the current season. */
    seasonXp: number;
    /** Cached current level (1..50), derived from seasonXp. */
    seasonLevel: number;
    /** Whether premium track is unlocked (mock IAP). */
    hasPremium: boolean;
    /** Levels (1..50) whose free reward has been claimed. */
    claimedFree: number[];
    /** Levels (1..50) whose premium reward has been claimed. */
    claimedPremium: number[];
}

export interface SeasonActions {
    /** Add XP to the current season; updates cached seasonLevel. */
    addSeasonXp: (amount: number) => void;
    /**
     * Claim a reward at a given level + track. Returns the granted reward,
     * or null if the level is not yet reached, already claimed, or premium
     * is locked. Side effect: applies the reward (coins/inventory) via the
     * economy slice and marks the level as claimed.
     */
    claimReward: (level: number, track: 'free' | 'premium') => SeasonReward | null;
    /** Mock IAP — flips hasPremium=true on success. */
    purchasePremium: () => Promise<boolean>;
    /** Roll over to a new season if past seasonEndsAt + grace period. */
    checkSeasonRollover: () => void;
}

export type SeasonSlice = SeasonState & SeasonActions;

// ============================================================================
// Combined Store Type
// ============================================================================

export type GameStore = PlayerSlice &
    EconomySlice &
    StatsSlice &
    SettingsSlice &
    AppSlice &
    SeasonSlice;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_PLAYER_STATE: PlayerState = {
    playerName: '',
    playerAvatar: '🐻',
};

export const DEFAULT_POWER_UPS: PowerUpInventory = {
    peek: 1,
    luckyMark: 1,
    slowTime: 1,
};

export const DEFAULT_ECONOMY_STATE: EconomyState = {
    coins: 1000,
    inventory: ['theme_classic', 'skin_classic'],
    lastDailyBonus: 0,
    activeTheme: 'theme_classic',
    activeSkin: 'skin_classic',
    powerUps: DEFAULT_POWER_UPS,
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
    notificationsEnabled: true,
    announcerMode: 'numbers',
};

export const DEFAULT_APP_STATE: AppState = {
    isLoading: true,
    error: null,
    isInitialized: false,
};

export const DEFAULT_SEASON_STATE: SeasonState = {
    seasonId: '',
    seasonStartedAt: 0,
    seasonEndsAt: 0,
    seasonXp: 0,
    seasonLevel: 1,
    hasPremium: false,
    claimedFree: [],
    claimedPremium: [],
};
