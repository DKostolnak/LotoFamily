/**
 * useHaptics Hook
 * 
 * Mobile haptic feedback for enhanced game feel.
 * Falls back gracefully on unsupported devices.
 */

import { useCallback } from 'react';

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const PATTERNS: Record<HapticPattern, number[]> = {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 50, 10],
    error: [50, 30, 50],
};

/**
 * Haptic feedback hook for mobile devices
 */
export function useHaptics() {
    const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

    const vibrate = useCallback((pattern: HapticPattern = 'light') => {
        if (!isSupported) return;

        try {
            navigator.vibrate(PATTERNS[pattern]);
        } catch {
            // Silently fail on unsupported devices
        }
    }, [isSupported]);

    return { vibrate, isSupported };
}

export default useHaptics;
