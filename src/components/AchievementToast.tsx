/**
 * AchievementToast - Animated popup for achievement unlocks
 *
 * Features:
 * - Slide-in animation from top
 * - Pulsing icon animation
 * - Purple gradient background with gold border
 * - Auto-dismiss after 4 seconds
 * - Plays celebration sound
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
    runOnJS,
} from 'react-native-reanimated';
import { audioService } from '@/lib/services/audio';
import { useHapticFeedback } from '@/hooks';

// ============================================================================
// TYPES
// ============================================================================

interface AchievementToastProps {
    /** Unique achievement identifier */
    id: string;
    /** Achievement display name */
    name: string;
    /** Emoji icon for the achievement */
    icon: string;
    /** Achievement description */
    description: string;
    /** Callback when toast is dismissed */
    onDismiss: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOAST_WIDTH = Math.min(340, SCREEN_WIDTH - 48);
const DISMISS_DELAY_MS = 4000;

// ============================================================================
// COMPONENT
// ============================================================================

export default function AchievementToast({
    id,
    name,
    icon,
    description,
    onDismiss,
}: AchievementToastProps) {
    const { triggerHaptic } = useHapticFeedback();

    // Animation values
    const translateY = useSharedValue(-150);
    const opacity = useSharedValue(0);
    const iconScale = useSharedValue(1);

    useEffect(() => {
        // Play celebration sound and haptic
        audioService.playBonusSound();
        triggerHaptic('heavy');

        // Animate in
        translateY.value = withSpring(0, {
            damping: 12,
            stiffness: 100,
        });
        opacity.value = withTiming(1, { duration: 300 });

        // Pulse icon animation
        iconScale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 500 }),
                withTiming(1, { duration: 500 })
            ),
            -1,
            true
        );

        // Auto-dismiss timer
        const timer = setTimeout(() => {
            // Animate out
            translateY.value = withTiming(-150, { duration: 300 });
            opacity.value = withTiming(0, { duration: 300 }, (finished) => {
                if (finished) {
                    runOnJS(onDismiss)();
                }
            });
        }, DISMISS_DELAY_MS);

        return () => clearTimeout(timer);
    }, [translateY, opacity, iconScale, onDismiss, triggerHaptic]);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    return (
        <View style={styles.wrapper} pointerEvents="none">
            <Animated.View style={[styles.container, containerStyle]}>
                {/* Icon */}
                <Animated.View style={iconStyle}>
                    <Text style={styles.icon}>{icon}</Text>
                </Animated.View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={styles.label}>🎉 Achievement Unlocked!</Text>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.description}>{description}</Text>
                </View>
            </Animated.View>
        </View>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        width: TOAST_WIDTH,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#ffd700',
        // Purple gradient effect
        backgroundColor: '#6b2d9e',
        shadowColor: '#ffd700',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 32,
        elevation: 16,
    },
    icon: {
        fontSize: 48,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#ffd700',
        marginBottom: 4,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 2,
    },
    description: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
    },
});
