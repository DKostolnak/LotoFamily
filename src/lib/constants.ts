/**
 * Game Constants
 * Single source of truth for all game configuration values
 */

import type { SabotageType } from './types';

// ============================================================================
// SABOTAGE SYSTEM
// ============================================================================

/** Energy costs for each sabotage ability */
export const SABOTAGE_COSTS: Record<SabotageType, number> = {
    snowball: 30,    // Freeze target for 5 seconds
    ink_splat: 20,   // Obscure target's view
    swap_hand: 50,   // Shuffle target's card positions
} as const;

/** Duration of freeze effect in milliseconds */
export const FREEZE_DURATION_MS = 5000;

// ============================================================================
// ENERGY SYSTEM
// ============================================================================

/** Maximum energy a player can accumulate */
export const MAX_ENERGY = 100;

/** Energy gained for marking a number quickly (within 2 seconds) */
export const ENERGY_FAST_MARK = 15;

/** Energy gained for marking a number slowly */
export const ENERGY_SLOW_MARK = 5;

/** Energy lost for marking an incorrect/uncalled number */
export const ENERGY_MISTAKE_PENALTY = -10;

/** Time window (ms) for fast mark bonus */
export const FAST_MARK_WINDOW_MS = 2000;

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
