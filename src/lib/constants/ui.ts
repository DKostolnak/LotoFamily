/**
 * UI Constants - Centralized values for consistent styling
 *
 * Naming convention: k_ prefix for constants (per style guide)
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
export const k_avatarSizeMedium = 54;
export const k_avatarSizeSmall = 40;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

/** Modal overlays (highest priority) */
export const k_zIndexModal = 1000;

/** Toasts and notifications */
export const k_zIndexToast = 900;

/** Header controls (buttons, badges) */
export const k_zIndexHeaderControls = 100;

/** Header background */
export const k_zIndexHeader = 50;

/** Main game number chip */
export const k_zIndexMainChip = 30;

/** History chips */
export const k_zIndexHistoryChips = 20;

/** Default content layer */
export const k_zIndexContent = 0;

// ============================================================================
// TIMING (milliseconds)
// ============================================================================

/** Default auto-call interval */
export const k_autoCallIntervalMs = 5000;

/** Error auto-dismiss duration */
export const k_errorAutoDismissMs = 5000;

/** Animation durations */
export const k_animationFast = 150;
export const k_animationNormal = 300;
export const k_animationSlow = 500;

// ============================================================================
// COLORS
// ============================================================================

/** Wooden theme colors */
export const k_colorWoodLight = '#c9a66b';
export const k_colorWoodMedium = '#a07d4a';
export const k_colorWoodDark = '#5a4025';
export const k_colorWoodDarkest = '#3d2814';
export const k_colorWoodBorder = '#2d1f10';

/** Status colors */
export const k_colorSuccess = '#4ade80';
export const k_colorError = '#ef4444';
export const k_colorWarning = '#f59e0b';
export const k_colorGold = '#ffd700';

/** Text colors */
export const k_colorTextLight = '#f5e6c8';
export const k_colorTextMuted = 'rgba(255, 255, 255, 0.7)';

// ============================================================================
// GRADIENTS
// ============================================================================

/** Wooden button gradient */
export const k_gradientWoodenButton = 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)';

/** Dent/inset effect gradient */
export const k_gradientDent = 'radial-gradient(circle, #3a2614 0%, #4a3520 70%, transparent 100%)';

// ============================================================================
// SHADOWS
// ============================================================================

/** Standard button shadow */
export const k_shadowButton = '0 2px 0 #3d2814, inset 0 1px 0 rgba(255,255,255,0.3)';

/** Card/container shadow */
export const k_shadowCard = '0 4px 6px rgba(0,0,0,0.3)';

/** Inset/dent shadow */
export const k_shadowInset = 'inset 0 4px 12px rgba(0,0,0,0.7), inset 0 -2px 8px rgba(0,0,0,0.4)';
