/**
 * Theme Configuration
 * 
 * Single source of truth for all visual customization options.
 * Follows Open/Closed Principle - extend by adding to configs, not modifying code.
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
        textSecondary: '#8b6b4a',
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
