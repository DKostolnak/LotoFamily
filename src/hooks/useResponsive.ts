/**
 * Responsive Scaling Hook
 * Provides screen-aware sizing utilities for adaptive UI across device sizes.
 * 
 * Reference screen widths:
 * - iPhone SE 2: 320pt
 * - iPhone 17 Pro: 393pt (design baseline)
 * - iPhone 17 Pro Max: 430pt
 */

import { useWindowDimensions } from 'react-native';

// Screen size thresholds (based on shortest side)
const k_smallScreenThreshold = 375;
const k_mediumScreenThreshold = 414;
const k_tabletThreshold = 600;

// Base design width (iPhone 17 Pro)
const k_designWidth = 393;

export interface ResponsiveValues {
    /** Screen width in points */
    screenWidth: number;
    /** Screen height in points */
    screenHeight: number;
    /** True if screen width < 375pt (iPhone SE, older iPhones) */
    isSmallScreen: boolean;
    /** True if screen width >= 375pt and < 414pt */
    isMediumScreen: boolean;
    /** True if screen width >= 414pt */
    isLargeScreen: boolean;
    /** True if device is a tablet-sized screen (shortest side >= 600pt) */
    isTablet: boolean;
    /** Scale a size value proportionally to screen width */
    scale: (size: number) => number;
    /** Scale font size with minimum floor for readability */
    scaleFont: (size: number, minSize?: number) => number;
    /** Scale icon size with minimum floor for touch targets */
    scaleIcon: (size: number, minSize?: number) => number;
    /** Get responsive value based on screen size */
    responsive: <T>(small: T, medium: T, large?: T) => T;
}

/**
 * Hook providing responsive scaling utilities.
 * 
 * @example
 * const { scale, scaleFont, isSmallScreen, responsive } = useResponsive();
 * 
 * <View style={{ padding: scale(20) }}>
 *   <Text style={{ fontSize: scaleFont(14) }}>Hello</Text>
 *   <Icon size={scaleIcon(24)} />
 * </View>
 */
export function useResponsive(): ResponsiveValues {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // Use shortest side for scaling so tall phones / unusual aspect ratios don't get weird sizing.
    // Orientation is portrait-locked, but tablets and foldables still benefit from this.
    const shortestSide = Math.min(screenWidth, screenHeight);

    const isSmallScreen = shortestSide <= k_smallScreenThreshold;
    const isMediumScreen = shortestSide > k_smallScreenThreshold && shortestSide < k_mediumScreenThreshold;
    const isLargeScreen = shortestSide >= k_mediumScreenThreshold;
    const isTablet = shortestSide >= k_tabletThreshold;

    // Calculate scale factor relative to design width
    const scaleFactor = shortestSide / k_designWidth;

    const maxScale = isTablet ? 1.6 : 1.25;
    const minScale = 0.75;

    /**
     * Scale a size value proportionally to screen width.
     * Values are clamped to prevent extreme scaling.
     */
    const scale = (size: number): number => {
        const scaled = size * scaleFactor;
        return Math.round(Math.max(size * minScale, Math.min(size * maxScale, scaled)));
    };

    /**
     * Scale font size with a minimum floor for readability.
     * Uses a gentler scaling curve than general scale().
     */
    const scaleFont = (size: number, minSize: number = 8): number => {
        // Use a gentler scaling factor for fonts (square root dampening)
        const fontScaleFactor = Math.sqrt(scaleFactor);
        const scaled = size * fontScaleFactor;
        return Math.round(Math.max(minSize, scaled));
    };

    /**
     * Scale icon size with a minimum floor for touch targets.
     */
    const scaleIcon = (size: number, minSize: number = 16): number => {
        const scaled = size * scaleFactor;
        return Math.round(Math.max(minSize, scaled));
    };

    /**
     * Return different values based on screen size category.
     * If large is not provided, medium value is used for large screens.
     */
    const responsive = <T,>(small: T, medium: T, large?: T): T => {
        if (isSmallScreen) return small;
        if (isLargeScreen) return large ?? medium;
        return medium;
    };

    return {
        screenWidth,
        screenHeight,
        isSmallScreen,
        isMediumScreen,
        isLargeScreen,
        isTablet,
        scale,
        scaleFont,
        scaleIcon,
        responsive,
    };
}
