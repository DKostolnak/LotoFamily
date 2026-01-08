/**
 * Game Constants
 * Single source of truth for all game configuration values
 */



// ============================================================================
// SCORING SYSTEM
// ============================================================================

/** Points awarded for various achievements */
export const POINTS = {
    WIN: 1000,
    FLAT_1: 100,
    FLAT_2: 200,
    FLAT_1_FIRST_BONUS: 150,
    FLAT_2_FIRST_BONUS: 300,
} as const;

// ============================================================================
// ROOM CONFIGURATION
// ============================================================================

/** Characters for room code generation (excluding ambiguous chars I, O, 0, 1) */
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Length of generated room codes */
export const ROOM_CODE_LENGTH = 6;

/** Maximum age of a room before cleanup (24 hours) */
export const ROOM_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// GAME TIMING
// ============================================================================

/** Default auto-call intervals */
export const AUTO_CALL_INTERVALS = {
    slow: 8000,
    normal: 5000,
    fast: 3000,
} as const;

/** Cleanup interval for stale rooms (1 hour) */
export const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
