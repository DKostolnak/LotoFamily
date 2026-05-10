/**
 * Theme Configuration
 *
 * Single source of truth for all visual customization options.
 * Follows Open/Closed Principle - extend by adding to configs, not modifying code.
 *
 * --------------------------------------------------------------------------
 * COLOR ACCESSIBILITY GUIDE (WCAG AA requires >= 4.5:1 for normal text)
 * --------------------------------------------------------------------------
 *
 * Wood palette (Tailwind tokens):
 *   wood.darkest  #1a1109  — app background
 *   wood.darker   #2d1f10  — header / card bg
 *   wood.dark     #3d2814  — card body
 *   wood.medium   #5a4025  — borders
 *   wood.light    #8b6b4a  — BACKGROUND/BORDER ONLY. NOT safe for text
 *                              (3.2:1 on #2d1f10 — fails WCAG AA).
 *
 * SAFE for text on dark backgrounds (>= 4.5:1):
 *   cream.DEFAULT #f5e6c8  — primary body text
 *   cream.light   #fffaf0  — high-emphasis text
 *   muted         #d4b896  — secondary/muted text (replacement for #8b6b4a)
 *   gold          #ffd700  — accent / titles
 *
 * Common pairs (foreground on background → contrast):
 *   #f5e6c8 on #2d1f10 → 12.6:1   (AAA)
 *   #d4b896 on #2d1f10 →  ~5.0:1  (AA)
 *   #ffd700 on #1a1109 →  ~12.0:1 (AAA)
 *   #8b6b4a on #2d1f10 →  ~3.2:1  (FAIL — do not use for text)
 *
 * Theme.textSecondary uses an accessible variant per-theme; legacy
 * '#8b6b4a' has been replaced with '#d4b896' for the classic theme.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ThemeColors {
    readonly cardBg: string;
    readonly headerBg: string;
    readonly gridBg: string;
    readonly border: string;
    readonly textPrimary: string;
    readonly textSecondary: string;
}

export interface SkinColors {
    readonly chipBg: string;
    readonly chipBorder: string;
    readonly incorrectBg: string;
    readonly incorrectBorder: string;
}

export type ThemeId = 'theme_classic' | 'theme_ocean' | 'theme_royal';
export type SkinId = 'skin_classic' | 'skin_coin' | 'skin_poker';

// ============================================================================
// THEME CONFIGURATIONS
// ============================================================================

export const THEMES: Readonly<Record<ThemeId, ThemeColors>> = {
    theme_classic: {
        cardBg: '#3d2814',
        headerBg: '#2d1f10',
        gridBg: '#e6dcc8',
        border: '#5a4025',
        textPrimary: '#f5e6c8',
        // Accessible muted (was #8b6b4a — failed WCAG AA at 3.2:1 on #2d1f10)
        textSecondary: '#d4b896',
    },
    theme_ocean: {
        cardBg: '#1e3a5f',
        headerBg: '#0f2744',
        gridBg: '#d1e9f6',
        border: '#2d5a87',
        textPrimary: '#e8f4fc',
        textSecondary: '#7db3d4',
    },
    theme_royal: {
        cardBg: '#4a1d6e',
        headerBg: '#2d1042',
        gridBg: '#e8d5f5',
        border: '#6b3d8e',
        textPrimary: '#f5e8fc',
        textSecondary: '#b88dd4',
    },
} as const;

// ============================================================================
// SKIN CONFIGURATIONS
// ============================================================================

export const SKINS: Readonly<Record<SkinId, SkinColors>> = {
    skin_classic: {
        chipBg: '#ef4444',
        chipBorder: '#b91c1c',
        incorrectBg: '#d97706',
        incorrectBorder: '#92400e',
    },
    skin_coin: {
        chipBg: '#ffd700',
        chipBorder: '#b8860b',
        incorrectBg: '#d97706',
        incorrectBorder: '#92400e',
    },
    skin_poker: {
        chipBg: '#3b82f6',
        chipBorder: '#1d4ed8',
        incorrectBg: '#d97706',
        incorrectBorder: '#92400e',
    },
} as const;

// ============================================================================
// DEFAULTS
// ============================================================================

export const DEFAULT_THEME_ID: ThemeId = 'theme_classic';
export const DEFAULT_SKIN_ID: SkinId = 'skin_classic';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get theme colors with fallback to classic
 */
export function getTheme(themeId: string): ThemeColors {
    return THEMES[themeId as ThemeId] ?? THEMES[DEFAULT_THEME_ID];
}

/**
 * Get skin colors with fallback to classic
 */
export function getSkin(skinId: string): SkinColors {
    return SKINS[skinId as SkinId] ?? SKINS[DEFAULT_SKIN_ID];
}

/**
 * Check if a theme ID is valid
 */
export function isValidTheme(themeId: string): themeId is ThemeId {
    return themeId in THEMES;
}

/**
 * Check if a skin ID is valid
 */
export function isValidSkin(skinId: string): skinId is SkinId {
    return skinId in SKINS;
}

/**
 * Get theme colors with renamed interface for LotoCard compatibility
 * Returns object with cardBg, headerBg, gridBg, border
 */
export function getThemeColors(themeId: string): { cardBg: string; headerBg: string; gridBg: string; border: string } {
    const theme = THEMES[themeId as ThemeId] ?? THEMES[DEFAULT_THEME_ID];
    return {
        cardBg: theme.cardBg,
        headerBg: theme.headerBg,
        gridBg: theme.gridBg,
        border: theme.border,
    };
}

/**
 * Get skin colors with renamed interface for LotoCard compatibility
 * Returns full skin colors including mistake colors
 */
export function getSkinColors(skinId: string): SkinColors & { bg: string; border: string } {
    const skin = SKINS[skinId as SkinId] ?? SKINS[DEFAULT_SKIN_ID];
    return {
        ...skin,
        bg: skin.chipBg,
        border: skin.chipBorder,
    };
}
