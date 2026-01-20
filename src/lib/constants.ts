/**
 * Game Constants
 * Single source of truth for all game configuration values
 * 
 * @deprecated Prefer importing from './config' module for new code.
 * This file provides backward compatibility.
 */

import { SERVER_URL } from './config/env.config';

// Re-export UI constants
export const k_headerHeight = 60;
export const k_bottomNavHeight = 80;

// Colors
export const k_colorGold = '#ffd700';
export const k_colorGoldDark = '#b8860b';
export const k_colorWoodDark = '#2d1f10';
export const k_colorWoodLight = '#3d2814';
export const k_colorSuccess = '#4ade80';
export const k_colorError = '#ef4444';
export const k_colorText = '#f5e6c8';

// Shadows
export const k_shadowSm = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
};

// ============================================================================
// SCORING SYSTEM
// ============================================================================

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

export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 6;
export const ROOM_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// GAME TIMING
// ============================================================================

export const AUTO_CALL_INTERVALS = {
    slow: 8000,
    normal: 5000,
    fast: 3000,
} as const;

export const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

// ============================================================================
// NETWORKING
// ============================================================================

/**
 * Socket.io server URL.
 * 
 * @deprecated Use `SERVER_URL` from './config' instead
 */
export const k_serverUrl = SERVER_URL;
