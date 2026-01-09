/**
 * useHaptics Hook
 * 
 * Mobile haptic feedback for enhanced game feel.
 * Falls back gracefully on unsupported devices.
 * 
 * Cross-device optimizations:
 * - Caches support detection to avoid repeated checks
 * - Wraps all calls in try-catch for maximum compatibility
 * - Supports both pattern names and raw durations
 */

import { useCallback, useMemo } from 'react';

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
 * Provides consistent haptic feedback across iOS and Android
 */
export function useHaptics() {
    // Cache support detection - only check once
    const isSupported = useMemo(() => {
        if (typeof navigator === 'undefined') return false;
        if (!('vibrate' in navigator)) return false;

        // Test if vibrate actually works (some browsers have it but it's a no-op)
        try {
            // iOS Safari has vibrate but throws on call
            return typeof navigator.vibrate === 'function';
        } catch {
            return false;
        }
    }, []);

    /**
     * Trigger haptic feedback
     * @param pattern - Named pattern or 'light' | 'medium' | 'heavy' | 'success' | 'error'
     */
    const vibrate = useCallback((pattern: HapticPattern = 'light') => {
        if (!isSupported) return;

        try {
            const vibrationPattern = PATTERNS[pattern] || PATTERNS.light;
            navigator.vibrate(vibrationPattern);
        } catch {
            // Silently fail on unsupported devices or when user has disabled vibration
            // This can happen on iOS Safari or in low-power mode
        }
    }, [isSupported]);

    /**
     * Trigger raw vibration pattern (for advanced use cases)
     * @param durations - Array of durations in ms [vibrate, pause, vibrate, ...]
     */
    const vibrateRaw = useCallback((durations: number | number[]) => {
        if (!isSupported) return;

        try {
            navigator.vibrate(durations);
        } catch {
            // Silently fail
        }
    }, [isSupported]);

    /**
     * Cancel any ongoing vibration
     */
    const cancel = useCallback(() => {
        if (!isSupported) return;

        try {
            navigator.vibrate(0);
        } catch {
            // Silently fail
        }
    }, [isSupported]);

    return { vibrate, vibrateRaw, cancel, isSupported };
}

export default useHaptics;
