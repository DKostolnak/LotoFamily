import React, { memo, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withSpring,
    withTiming,
    withDelay,
    cancelAnimation,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { TEXT_STYLES, FONT_WEIGHTS } from '@/lib/config';
import { audioService } from '@/lib/services/audio';

const BARREL = require('../../../assets/wooden-barrel-3d.png');

export type WoodenBarrelSize = 'sm' | 'md' | 'lg';

interface WoodenBarrelProps {
    /** Currently displayed number. null = idle (no number visible). */
    number: number | null;
    /** Triggers roll animation when changes (use a key / call count / timestamp). */
    rollKey?: string | number;
    /** Optional callback after roll animation finishes and number is settled. */
    onRollComplete?: () => void;
    /** Semantic size (default 'lg'). */
    size?: WoodenBarrelSize;
}

const SIZE_PT: Record<WoodenBarrelSize, number> = {
    sm: 64,
    md: 96,
    lg: 132,
};

/**
 * WoodenBarrel — hero "called number" element using the vertical 3D barrel
 * texture asset (assets/wooden-barrel-3d.png) with a tasteful roll-in
 * animation per call.
 *
 * Animation per `rollKey` change:
 *   1. Glow halo flashes briefly behind the barrel (0 → 0.9 → 0).
 *   2. The barrel scales 0.6 → 1.15 → 1 with a spring overshoot, while
 *      the number simultaneously fades in and rotates 25deg → 0deg.
 *   3. After settle, optional onRollComplete fires.
 */
const WoodenBarrelComponent = ({
    number,
    rollKey,
    onRollComplete,
    size = 'lg',
}: WoodenBarrelProps) => {
    const dim = SIZE_PT[size];
    const width = dim;
    const height = dim * 1.25; // 3D barrel is taller than it is wide
    const lastRollKey = useRef(rollKey);

    const scale = useSharedValue(1);
    const numberOpacity = useSharedValue(number !== null ? 1 : 0);
    const numberTilt = useSharedValue(0);
    const glowOpacity = useSharedValue(0);

    // Roll animation triggered by rollKey change.
    useEffect(() => {
        if (rollKey === undefined) return;
        if (rollKey === lastRollKey.current) return;
        lastRollKey.current = rollKey;

        // Sound cue (no-op until audio assets land).
        audioService.playSound('call').catch(() => { });

        // Reset
        numberOpacity.value = 0;
        numberTilt.value = 25;

        // Pop the barrel
        scale.value = withSequence(
            withTiming(0.6, { duration: 80, easing: Easing.out(Easing.quad) }),
            withTiming(1.15, { duration: 220, easing: Easing.out(Easing.back(2)) }),
            withSpring(1, { damping: 10, stiffness: 220 }, (finished) => {
                if (finished && onRollComplete) {
                    runOnJS(onRollComplete)();
                }
            })
        );

        // Reveal number with a small tilt settle
        numberOpacity.value = withDelay(
            120,
            withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) })
        );
        numberTilt.value = withDelay(
            120,
            withSpring(0, { damping: 9, stiffness: 220 })
        );

        // Glow flash
        glowOpacity.value = withSequence(
            withTiming(0.85, { duration: 180, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rollKey]);

    // If a number arrives without a rollKey trigger (e.g. mid-game mount), make sure it's visible.
    useEffect(() => {
        if (number !== null && numberOpacity.value === 0) {
            numberOpacity.value = 1;
            numberTilt.value = 0;
        }
    }, [number, numberOpacity, numberTilt]);

    // Cleanup on unmount.
    useEffect(() => {
        return () => {
            cancelAnimation(scale);
            cancelAnimation(numberOpacity);
            cancelAnimation(numberTilt);
            cancelAnimation(glowOpacity);
        };
    }, [scale, numberOpacity, numberTilt, glowOpacity]);

    const barrelStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const numberStyle = useAnimatedStyle(() => ({
        opacity: numberOpacity.value,
        transform: [{ rotate: `${numberTilt.value}deg` }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    const textStyle =
        size === 'lg'
            ? TEXT_STYLES.display
            : size === 'md'
                ? TEXT_STYLES.h1
                : TEXT_STYLES.h2;

    return (
        <View
            style={[styles.wrapper, { width: width, height: height }]}
            accessibilityRole="image"
            accessibilityLabel={
                number !== null
                    ? `Called number ${number}`
                    : 'Wooden barrel — waiting for next number'
            }
        >
            {/* Glow halo behind barrel (entrance flash) */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.glow,
                    {
                        width: width + 24,
                        height: height + 24,
                        borderRadius: (width + 24) / 2,
                    },
                    glowStyle,
                ]}
            />

            {/* Barrel image and content container */}
            <Animated.View
                style={[
                    styles.barrel,
                    {
                        width: width,
                        height: height,
                    },
                    barrelStyle,
                ]}
            >
                <Image
                    source={BARREL}
                    style={[
                        styles.barrelImage,
                        { width: width, height: height },
                    ]}
                    resizeMode="contain"
                />

                {/* Number centered on the barrel belly */}
                {number !== null && (
                    <Animated.View
                        pointerEvents="none"
                        style={[styles.numberLayer, numberStyle]}
                    >
                        <Text
                            style={[
                                textStyle,
                                styles.numberText,
                                { fontWeight: FONT_WEIGHTS.black },
                            ]}
                            numberOfLines={1}
                        >
                            {number}
                        </Text>
                    </Animated.View>
                )}
            </Animated.View>
        </View>
    );
};

export const WoodenBarrel = memo(WoodenBarrelComponent);
WoodenBarrel.displayName = 'WoodenBarrel';

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        backgroundColor: '#ffd700',
        shadowColor: '#ffd700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 28,
    },
    barrel: {
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.55,
        shadowRadius: 8,
        elevation: 10,
    },
    barrelImage: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    numberLayer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    numberText: {
        color: '#ffd700',
        textShadowColor: 'rgba(0, 0, 0, 0.85)',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 4,
    },
});
