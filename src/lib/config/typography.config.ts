/**
 * Typography Design Tokens
 *
 * Single source of truth for type scale, weights and spacing.
 * Designed for a family-bingo audience (30-70+ years) — bias toward
 * larger, high-contrast text. NEVER use `adjustsFontSizeToFit` to fix
 * overflow; instead pick a smaller token, allow multi-line, or shorten copy.
 *
 * Slovak / Ukrainian / Russian translations are typically 25-40% longer
 * than English. Tokens below assume the LONGEST translation and leave
 * comfortable headroom rather than relying on dynamic shrink.
 */

import type { TextStyle } from 'react-native';

// =============================================================================
// FONT SIZES (in points)
// =============================================================================
// Use semantic tokens (display / heading / body) — not raw numbers — at call sites.

export const FONT_SIZES = {
    /** Hero numbers, victory headlines (32-40pt) */
    display: 36,
    /** Modal titles, section headers in main views (24-28pt) */
    h1: 26,
    /** Card titles, secondary screen titles (20-22pt) */
    h2: 20,
    /** Sub-section labels, list item titles (17-18pt) */
    h3: 17,
    /** Default body copy, primary button labels (15-16pt) */
    body: 16,
    /** Secondary body, dense lists (13-14pt) */
    bodySmall: 14,
    /** Captions, helper text, badges — readable minimum (11-12pt) */
    caption: 12,
    /** Tiny labels (XP counters, version numbers) — use sparingly (10pt) */
    tiny: 11,
} as const;

// =============================================================================
// FONT WEIGHTS
// =============================================================================

export const FONT_WEIGHTS = {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
} as const satisfies Record<string, TextStyle['fontWeight']>;

// =============================================================================
// LETTER SPACING (tracking)
// =============================================================================
// React Native letterSpacing is in points (not em). Conservative values —
// "tracking-widest" tailwind class is too wide for non-English locales.

export const LETTER_SPACING = {
    /** Tight headings (display/h1) */
    tight: -0.3,
    /** Default body — no tracking */
    normal: 0,
    /** Subtle emphasis on uppercase short labels */
    wide: 0.5,
    /** Maximum — only for very short ALL-CAPS labels (<8 chars) */
    widest: 1,
} as const;

// =============================================================================
// LINE HEIGHT MULTIPLIERS
// =============================================================================

export const LINE_HEIGHTS = {
    /** Display / hero — tight for impact */
    display: 1.05,
    /** Headings */
    heading: 1.2,
    /** Body — comfortable for reading */
    body: 1.4,
    /** Buttons (single-line) — minimal */
    button: 1.15,
    /** Buttons that may wrap to 2 lines */
    buttonMultiline: 1.25,
} as const;

// =============================================================================
// TEXT STYLE PRESETS
// =============================================================================
// Composable React Native TextStyle objects. Prefer these over inline styles.

export const TEXT_STYLES = {
    display: {
        fontSize: FONT_SIZES.display,
        fontWeight: FONT_WEIGHTS.black,
        letterSpacing: LETTER_SPACING.tight,
        lineHeight: FONT_SIZES.display * LINE_HEIGHTS.display,
    },
    h1: {
        fontSize: FONT_SIZES.h1,
        fontWeight: FONT_WEIGHTS.black,
        letterSpacing: LETTER_SPACING.tight,
        lineHeight: FONT_SIZES.h1 * LINE_HEIGHTS.heading,
    },
    h2: {
        fontSize: FONT_SIZES.h2,
        fontWeight: FONT_WEIGHTS.bold,
        letterSpacing: LETTER_SPACING.normal,
        lineHeight: FONT_SIZES.h2 * LINE_HEIGHTS.heading,
    },
    h3: {
        fontSize: FONT_SIZES.h3,
        fontWeight: FONT_WEIGHTS.bold,
        letterSpacing: LETTER_SPACING.normal,
        lineHeight: FONT_SIZES.h3 * LINE_HEIGHTS.heading,
    },
    body: {
        fontSize: FONT_SIZES.body,
        fontWeight: FONT_WEIGHTS.regular,
        letterSpacing: LETTER_SPACING.normal,
        lineHeight: FONT_SIZES.body * LINE_HEIGHTS.body,
    },
    bodyBold: {
        fontSize: FONT_SIZES.body,
        fontWeight: FONT_WEIGHTS.bold,
        letterSpacing: LETTER_SPACING.normal,
        lineHeight: FONT_SIZES.body * LINE_HEIGHTS.body,
    },
    bodySmall: {
        fontSize: FONT_SIZES.bodySmall,
        fontWeight: FONT_WEIGHTS.regular,
        letterSpacing: LETTER_SPACING.normal,
        lineHeight: FONT_SIZES.bodySmall * LINE_HEIGHTS.body,
    },
    caption: {
        fontSize: FONT_SIZES.caption,
        fontWeight: FONT_WEIGHTS.medium,
        letterSpacing: LETTER_SPACING.normal,
        lineHeight: FONT_SIZES.caption * LINE_HEIGHTS.body,
    },
    captionUpper: {
        fontSize: FONT_SIZES.caption,
        fontWeight: FONT_WEIGHTS.bold,
        letterSpacing: LETTER_SPACING.wide,
        lineHeight: FONT_SIZES.caption * LINE_HEIGHTS.body,
        textTransform: 'uppercase',
    },
    /** Primary button label (large CTA) */
    buttonLarge: {
        fontSize: FONT_SIZES.h3,
        fontWeight: FONT_WEIGHTS.black,
        letterSpacing: LETTER_SPACING.wide,
        lineHeight: FONT_SIZES.h3 * LINE_HEIGHTS.button,
        textTransform: 'uppercase',
    },
    /** Default button label */
    button: {
        fontSize: FONT_SIZES.body,
        fontWeight: FONT_WEIGHTS.bold,
        letterSpacing: LETTER_SPACING.wide,
        lineHeight: FONT_SIZES.body * LINE_HEIGHTS.button,
        textTransform: 'uppercase',
    },
    /** Small / compact button label */
    buttonSmall: {
        fontSize: FONT_SIZES.bodySmall,
        fontWeight: FONT_WEIGHTS.bold,
        letterSpacing: LETTER_SPACING.normal,
        lineHeight: FONT_SIZES.bodySmall * LINE_HEIGHTS.button,
        textTransform: 'uppercase',
    },
} as const satisfies Record<string, TextStyle>;

// =============================================================================
// SPACING SCALE (4pt grid)
// =============================================================================

export const SPACING = {
    none: 0,
    /** 2pt — hairline gaps */
    xxs: 2,
    /** 4pt */
    xs: 4,
    /** 8pt — default tight gap */
    sm: 8,
    /** 12pt */
    md: 12,
    /** 16pt — default content padding */
    lg: 16,
    /** 24pt — section breathing room */
    xl: 24,
    /** 32pt — major separations */
    xxl: 32,
    /** 48pt — screen-level breathing room */
    xxxl: 48,
} as const;

// =============================================================================
// BUTTON SIZING
// =============================================================================
// Heights chosen so that uppercase localized labels (SK/UK) fit comfortably
// at the assigned font size without dynamic shrinking. Tap target minimum
// is 44pt (Apple HIG) / 48pt (Material) — all sizes meet this.

export const BUTTON_SIZES = {
    sm: {
        height: 44,
        paddingHorizontal: SPACING.lg,
        textStyle: TEXT_STYLES.buttonSmall,
    },
    md: {
        height: 56,
        paddingHorizontal: SPACING.xl,
        textStyle: TEXT_STYLES.button,
    },
    lg: {
        height: 68,
        paddingHorizontal: SPACING.xl,
        textStyle: TEXT_STYLES.buttonLarge,
    },
    xl: {
        height: 80,
        paddingHorizontal: SPACING.xxl,
        textStyle: TEXT_STYLES.buttonLarge,
    },
} as const;

// =============================================================================
// RADII
// =============================================================================

export const RADII = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
} as const;

// =============================================================================
// EXPORTS
// =============================================================================

export const TYPOGRAPHY = {
    fontSizes: FONT_SIZES,
    fontWeights: FONT_WEIGHTS,
    letterSpacing: LETTER_SPACING,
    lineHeights: LINE_HEIGHTS,
    textStyles: TEXT_STYLES,
} as const;

export const DESIGN_TOKENS = {
    typography: TYPOGRAPHY,
    spacing: SPACING,
    radii: RADII,
    button: BUTTON_SIZES,
} as const;

export default DESIGN_TOKENS;
