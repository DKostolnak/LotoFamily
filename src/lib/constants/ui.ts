/**
 * UI Constants - Centralized values for consistent styling
 *
 * Naming convention: k_ prefix for constants (per style guide)
 */

// ============================================================================
// LAYOUT SIZES
// ============================================================================

/** Default header height in pixels (Adjusted for Mobile Safe Area usually, but keeping base) */
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
export const k_avatarSizeMedium = 54;
export const k_avatarSizeSmall = 40;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const k_zIndexModal = 1000;
export const k_zIndexToast = 900;
export const k_zIndexHeaderControls = 100;
export const k_zIndexHeader = 50;
export const k_zIndexMainChip = 30;
export const k_zIndexHistoryChips = 20;
export const k_zIndexContent = 0;

// ============================================================================
// TIMING (milliseconds)
// ============================================================================

export const k_autoCallIntervalMs = 5000;
export const k_errorAutoDismissMs = 5000;
export const k_animationFast = 150;
export const k_animationNormal = 300;
export const k_animationSlow = 500;

// ============================================================================
// COLORS
// ============================================================================

export const k_colorWoodLight = '#c9a66b';
export const k_colorWoodMedium = '#a07d4a';
export const k_colorWoodDark = '#5a4025';
export const k_colorWoodDarkest = '#3d2814';
export const k_colorWoodBorder = '#2d1f10';

export const k_colorSuccess = '#4ade80';
export const k_colorError = '#ef4444';
export const k_colorWarning = '#f59e0b';
export const k_colorGold = '#ffd700';

export const k_colorTextLight = '#f5e6c8';
export const k_colorTextMuted = 'rgba(255, 255, 255, 0.7)';
