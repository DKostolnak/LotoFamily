/**
 * UI Constants - Centralized styling values
 * 
 * Naming convention: k_ prefix for constants
 * Keep UI constants separate from game logic constants.
 */

// ============================================================================
// LAYOUT SIZES
// ============================================================================

/** Default header height in pixels */
export const k_headerHeight = 130;

/** Standard button size in pixels */
export const k_buttonSize = 40;

/** Leaderboard button size in pixels */
export const k_leaderboardButtonSize = 44;

/** Main number chip size in header */
export const k_mainChipSize = 90;

/** Inner chip size (inside dent) */
export const k_mainChipInnerSize = 74;

/** History chip size in header */
export const k_historyChipSize = 38;

/** Avatar sizes */
export const k_avatarSizeLarge = 90;
export const k_avatarSizeMedium = 48;
export const k_avatarSizeSmall = 36;

// ============================================================================
// SPACING
// ============================================================================

export const k_spacingXs = 4;
export const k_spacingSm = 8;
export const k_spacingMd = 16;
export const k_spacingLg = 24;
export const k_spacingXl = 32;

// ============================================================================
// COLORS
// ============================================================================

export const k_colorGold = '#ffd700';
export const k_colorGoldDark = '#b8860b';
export const k_colorWoodDark = '#2d1f10';
export const k_colorWoodLight = '#3d2814';
export const k_colorWoodBorder = '#5a4025';
export const k_colorBackground = '#1a1109';
export const k_colorSuccess = '#4ade80';
export const k_colorError = '#ef4444';
export const k_colorText = '#f5e6c8';
export const k_colorTextMuted = '#8b6b4a';

// ============================================================================
// SHADOWS (React Native StyleSheet format)
// ============================================================================

export const k_shadowSm = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
} as const;

export const k_shadowMd = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
} as const;

export const k_shadowLg = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
} as const;

// ============================================================================
// ANIMATION TIMING
// ============================================================================

export const k_animationFast = 150;
export const k_animationNormal = 300;
export const k_animationSlow = 500;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const k_radiusSm = 4;
export const k_radiusMd = 8;
export const k_radiusLg = 16;
export const k_radiusXl = 24;
export const k_radiusFull = 9999;
