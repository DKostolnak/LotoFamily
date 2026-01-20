/**
 * ScreenShakeProvider - Context for triggering screen shake effects
 *
 * Uses react-native-reanimated for smooth shake animations.
 * Supports three intensity levels: light, medium, heavy.
 */

import React, {
    createContext,
    useContext,
    useCallback,
    ReactNode,
} from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useHapticFeedback } from '@/hooks';

// ============================================================================
// TYPES
// ============================================================================

type ShakeIntensity = 'light' | 'medium' | 'heavy';

interface ScreenShakeContextType {
    /** Trigger a screen shake effect */
    shake: (intensity?: ShakeIntensity) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ScreenShakeContext = createContext<ScreenShakeContextType | null>(null);

/**
 * Hook to access screen shake functionality
 * @throws Error if used outside ScreenShakeProvider
 */
export function useScreenShake(): ScreenShakeContextType {
    const context = useContext(ScreenShakeContext);
    if (!context) {
        throw new Error('useScreenShake must be used within a ScreenShakeProvider');
    }
    return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface ScreenShakeProviderProps {
    children: ReactNode;
}

export default function ScreenShakeProvider({ children }: ScreenShakeProviderProps) {
    const { triggerHaptic } = useHapticFeedback();
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const shake = useCallback((intensity: ShakeIntensity = 'medium') => {
        // Trigger haptic feedback matching intensity
        triggerHaptic(intensity);

        // Define shake parameters based on intensity
        const config = {
            light: { amplitude: 4, duration: 50, iterations: 3 },
            medium: { amplitude: 8, duration: 40, iterations: 4 },
            heavy: { amplitude: 12, duration: 35, iterations: 6 },
        }[intensity];

        const { amplitude, duration, iterations } = config;

        // Create shake sequence for X axis
        const shakeSequenceX = [];
        for (let i = 0; i < iterations; i++) {
            const dampFactor = 1 - (i / iterations) * 0.5; // Gradually reduce amplitude
            shakeSequenceX.push(
                withTiming(amplitude * dampFactor, { duration }),
                withTiming(-amplitude * dampFactor, { duration }),
            );
        }
        shakeSequenceX.push(withTiming(0, { duration }));

        // Create shake sequence for Y axis (smaller)
        const shakeSequenceY = [];
        for (let i = 0; i < iterations; i++) {
            const dampFactor = 1 - (i / iterations) * 0.5;
            shakeSequenceY.push(
                withTiming(amplitude * 0.3 * dampFactor, { duration }),
                withTiming(-amplitude * 0.3 * dampFactor, { duration }),
            );
        }
        shakeSequenceY.push(withTiming(0, { duration }));

        translateX.value = withSequence(...shakeSequenceX);
        translateY.value = withSequence(...shakeSequenceY);
    }, [translateX, translateY, triggerHaptic]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    return (
        <ScreenShakeContext.Provider value={{ shake }}>
            <Animated.View style={[styles.container, animatedStyle]}>
                {children}
            </Animated.View>
        </ScreenShakeContext.Provider>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
