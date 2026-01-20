/**
 * Game Configuration
 * 
 * Centralized game rules and constants.
 * Single source of truth for game mechanics.
 */

// ============================================================================
// CARD DIMENSIONS (European Loto 90)
// ============================================================================

export const CARD_CONFIG = {
    /** Number of rows per card */
    ROWS: 3,
    /** Number of columns per card */
    COLUMNS: 9,
    /** Numbers per row (rest are blanks) */
    NUMBERS_PER_ROW: 5,
    /** Maximum number in the game */
    MAX_NUMBER: 90,
    /** Default cards dealt to each player */
    DEFAULT_CARDS_PER_PLAYER: 3,
} as const;

// ============================================================================
// SCORING
// ============================================================================

export const SCORING = {
    /** Points for winning the game (full card) */
    WIN: 1000,
    /** Points for first flat (one row) */
    FLAT_1: 100,
    /** Points for second flat (two rows) */
    FLAT_2: 200,
    /** Bonus for being first to claim flat 1 */
    FLAT_1_FIRST_BONUS: 150,
    /** Bonus for being first to claim flat 2 */
    FLAT_2_FIRST_BONUS: 300,
} as const;

// ============================================================================
// ECONOMY
// ============================================================================

export const ECONOMY = {
    /** Starting coins for new players */
    INITIAL_COINS: 1000,
    /** Daily login bonus amount */
    DAILY_BONUS_AMOUNT: 50,
    /** Interval between daily bonuses (24 hours in ms) */
    DAILY_BONUS_INTERVAL_MS: 24 * 60 * 60 * 1000,
    /** Default items in player inventory */
    DEFAULT_INVENTORY: ['theme_classic', 'skin_classic'] as string[],
} as const;

// ============================================================================
// TIMING
// ============================================================================

export const TIMING = {
    /** Auto-call intervals by speed setting */
    AUTO_CALL: {
        slow: 8000,
        normal: 5000,
        fast: 3000,
    } as const,
    /** Mistake animation duration */
    MISTAKE_ANIMATION_MS: 800,
    /** Time window for marking recently called numbers */
    SAFE_WINDOW_CALLS: 2,
    /** Room expiration time */
    ROOM_MAX_AGE_MS: 24 * 60 * 60 * 1000,
    /** Cleanup interval for expired rooms */
    CLEANUP_INTERVAL_MS: 60 * 60 * 1000,
    /** Daily bonus cooldown */
    DAILY_BONUS_COOLDOWN_MS: 24 * 60 * 60 * 1000,
} as const;

// ============================================================================
// ROOM
// ============================================================================

export const ROOM_CONFIG = {
    /** Characters used in room codes (no ambiguous chars like 0/O, 1/I) */
    CODE_CHARS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    /** Length of room codes */
    CODE_LENGTH: 6,
    /** Maximum players per room */
    MAX_PLAYERS: 10,
    /** Minimum name length */
    MIN_NAME_LENGTH: 2,
    /** Maximum name length */
    MAX_NAME_LENGTH: 18,
} as const;

// ============================================================================
// NETWORK
// ============================================================================

export const NETWORK = {
    /** Default server URL (overridden by env) */
    DEFAULT_SERVER_URL: 'http://localhost:3000',
    /** Socket reconnection attempts */
    MAX_RECONNECT_ATTEMPTS: 5,
    /** Base reconnection delay */
    RECONNECT_DELAY_MS: 1000,
    /** Connection timeout */
    CONNECTION_TIMEOUT_MS: 10000,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AutoCallSpeed = keyof typeof TIMING.AUTO_CALL;
