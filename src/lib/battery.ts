'use client';

/**
 * Battery-saving utility for mobile devices
 * Provides centralized control for power-intensive features
 */

// Check if user prefers reduced motion (accessibility + battery save)
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Check if device is on battery saver mode (experimental)
export function isLowPowerMode(): boolean {
    if (typeof navigator === 'undefined') return false;
    // @ts-expect-error - experimental API
    return navigator.deviceMemory ? navigator.deviceMemory < 4 : false;
}

// Detect if we should use battery-saving mode
let _batterySaveMode = false;

export function setBatterySaveMode(enabled: boolean): void {
    _batterySaveMode = enabled;
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('loto_batterySave', enabled ? 'true' : 'false');
    }
}

export function isBatterySaveEnabled(): boolean {
    if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('loto_batterySave');
        if (saved) return saved === 'true';
    }
    return _batterySaveMode || prefersReducedMotion();
}

/**
 * Conditionally enable vibration based on battery mode
 */
export function vibrateIfAllowed(pattern: number | number[]): void {
    if (isBatterySaveEnabled()) return;
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

/**
 * Get animation duration multiplier (0 = disabled, 1 = normal)
 */
export function getAnimationMultiplier(): number {
    if (prefersReducedMotion() || isBatterySaveEnabled()) return 0;
    return 1;
}
