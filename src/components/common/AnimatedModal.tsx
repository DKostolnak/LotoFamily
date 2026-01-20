/**
 * AnimatedModal - Unified animated modal wrapper for consistent UI animations
 * 
 * Features:
 * - Scale + fade in/out animation with spring physics
 * - Backdrop fade animation
 * - Consistent timing across all modals
 * - Haptic feedback on open
 */

import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useResponsive } from '@/hooks';

// ============================================================================
// TYPES
// ============================================================================

interface AnimatedModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Callback when modal should close */
    onClose: () => void;
    /** Modal content */
    children: React.ReactNode;
    /** Close when backdrop is pressed (default: true) */
    closeOnBackdrop?: boolean;
    /** Animation preset */
    animation?: 'scale' | 'slide' | 'fade';
    /** Custom spring config */
    springConfig?: {
        damping?: number;
        stiffness?: number;
        mass?: number;
    };
}

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

const SPRING_CONFIG = {
    damping: 15,
    stiffness: 150,
    mass: 0.8,
};

const ANIMATION_DURATION = 250;

// ============================================================================
// COMPONENT
// ============================================================================

export function AnimatedModal({
    visible,
    onClose,
    children,
    closeOnBackdrop = true,
    animation = 'scale',
    springConfig = SPRING_CONFIG,
}: AnimatedModalProps) {
    const { screenWidth, scale, isTablet } = useResponsive();

    const containerPaddingX = scale(16);
    const maxWidth = isTablet ? 560 : 420;
    const contentMaxWidth = Math.min(maxWidth, Math.max(320, screenWidth - containerPaddingX * 2));

    const progress = useSharedValue(0);
    const [internalVisible, setInternalVisible] = React.useState(visible);

    // Handle open animation
    useEffect(() => {
        if (visible) {
            setInternalVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            progress.value = withSpring(1, {
                ...SPRING_CONFIG,
                ...springConfig,
            });
        }
    }, [visible, progress, springConfig]);

    // Handle parent-driven close (e.g., route changes / state resets)
    useEffect(() => {
        if (!visible && internalVisible) {
            progress.value = withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
                if (finished) {
                    runOnJS(setInternalVisible)(false);
                }
            });
        }
    }, [visible, internalVisible, progress]);

    // Handle close animation
    const handleClose = useCallback(() => {
        progress.value = withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
            if (finished) {
                runOnJS(setInternalVisible)(false);
                runOnJS(onClose)();
            }
        });
    }, [progress, onClose]);

    // Backdrop animation
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolate.CLAMP),
    }));

    // Content animation based on type
    const contentStyle = useAnimatedStyle(() => {
        switch (animation) {
            case 'slide':
                return {
                    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 1, 1]),
                    transform: [
                        { translateY: interpolate(progress.value, [0, 1], [100, 0], Extrapolate.CLAMP) },
                    ],
                };
            case 'fade':
                return {
                    opacity: progress.value,
                };
            case 'scale':
            default:
                return {
                    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 1, 1]),
                    transform: [
                        { scale: interpolate(progress.value, [0, 1], [0.85, 1], Extrapolate.CLAMP) },
                    ],
                };
        }
    });

    if (!internalVisible && !visible) {
        return null;
    }

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]} pointerEvents="box-none">
            {/* Backdrop - positioned behind content */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={closeOnBackdrop ? handleClose : undefined}
                />
            </Animated.View>

            {/* Content - positioned above backdrop */}
            <View style={[styles.container, { paddingHorizontal: containerPaddingX }]} pointerEvents="box-none">
                <Animated.View
                    style={[styles.content, { maxWidth: contentMaxWidth }, contentStyle]}
                    pointerEvents="auto"
                >
                    {children}
                </Animated.View>
            </View>
        </View>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    content: {
        width: '100%',
        maxWidth: 400,
    },
});

export default AnimatedModal;
