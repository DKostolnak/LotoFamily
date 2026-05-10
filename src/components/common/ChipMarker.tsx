import React, { memo, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withSpring,
    withTiming,
    cancelAnimation,
    Easing,
} from 'react-native-reanimated';
import { TEXT_STYLES, FONT_WEIGHTS } from '@/lib/config';

const CHIP_LARGE = require('../../../assets/wooden-chip-large.png');
const CHIP_SMALL = require('../../../assets/wooden-chip-small.png');

export type ChipMarkerVariant = 'correct' | 'incorrect' | 'missed';

interface ChipMarkerProps {
    /** Whether the chip should be shown. Toggling triggers drop / lift animation. */
    marked: boolean;
    /** Optional value to print on the chip (for the "correct" state). */
    value?: number | null;
    /** Visual variant — 'correct' (default), 'incorrect' (wrong tap), 'missed' (faded). */
    variant?: ChipMarkerVariant;
    /** Pixel size of the chip (assumed square). Default 36. */
    size?: number;
}

/**
 * ChipMarker — a wooden-token marker that drops onto a Loto card cell when
 * the player marks a number, and lifts away when unmarked.
 *
 * Uses the real `wooden-chip-large.png` / `wooden-chip-small.png` assets
 * for an authentic wooden look. The "incorrect" and "missed" variants
 * recolor the chip via a subtle red / muted overlay.
 *
 * Animation:
 *   - Drop in (~340ms): translateY -90 → 0, scale 0.55 → 1.12 → 1, random ±25° → 0.
 *   - Lift out (~260ms): scale 1 → 1.18 → 0, opacity 1 → 0.
 *   - cancelAnimation on unmount and on mark toggle.
 *
 * Conditional render in the parent (only mount when `marked === true`)
 * keeps the per-cell animation footprint at zero for unmarked cells.
 */
const ChipMarkerComponent = ({
    marked,
    value,
    variant = 'correct',
    size = 36,
}: ChipMarkerProps) => {
    const translateY = useSharedValue(marked ? 0 : -90);
    const scale = useSharedValue(marked ? 1 : 0);
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(marked ? 1 : 0);

    useEffect(() => {
        if (marked) {
            translateY.value = -90;
            scale.value = 0.55;
            rotation.value = (Math.random() - 0.5) * 50; // ±25°
            opacity.value = 1;

            translateY.value = withTiming(0, {
                duration: 340,
                easing: Easing.bezier(0.5, 1, 0.6, 1),
            });
            scale.value = withSequence(
                withTiming(1.12, { duration: 240, easing: Easing.out(Easing.cubic) }),
                withSpring(1, { damping: 9, stiffness: 220 })
            );
            rotation.value = withTiming(0, { duration: 340 });
        } else {
            scale.value = withSequence(
                withTiming(1.18, { duration: 100, easing: Easing.out(Easing.cubic) }),
                withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) })
            );
            opacity.value = withTiming(0, { duration: 220 });
        }

        return () => {
            cancelAnimation(translateY);
            cancelAnimation(scale);
            cancelAnimation(rotation);
            cancelAnimation(opacity);
        };
    }, [marked, translateY, scale, rotation, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
            { rotate: `${rotation.value}deg` },
        ],
    }));

    // Pick chip asset: large for >32pt, small for ≤32pt.
    const chipAsset = size > 32 ? CHIP_LARGE : CHIP_SMALL;

    // Per-variant tint overlay (subtle — keeps the wood texture readable).
    const variantTint =
        variant === 'incorrect'
            ? 'rgba(239, 68, 68, 0.45)'
            : variant === 'missed'
                ? 'rgba(0, 0, 0, 0.35)'
                : null;

    const labelColor =
        variant === 'incorrect'
            ? '#fca5a5'
            : variant === 'missed'
                ? '#a8916b'
                : '#3d2814';

    return (
        <View pointerEvents="none" style={styles.wrapper}>
            <Animated.View
                style={[
                    styles.chip,
                    {
                        width: size,
                        height: size,
                    },
                    animatedStyle,
                ]}
            >
                <Image
                    source={chipAsset}
                    style={{ width: size, height: size }}
                    resizeMode="contain"
                />

                {/* Variant tint overlay */}
                {variantTint && (
                    <View
                        pointerEvents="none"
                        style={[
                            styles.tint,
                            {
                                width: size * 0.78,
                                height: size * 0.78,
                                borderRadius: (size * 0.78) / 2,
                                backgroundColor: variantTint,
                            },
                        ]}
                    />
                )}

                {/* Number label */}
                {value !== null && value !== undefined && (
                    <View pointerEvents="none" style={styles.label}>
                        <Text
                            style={[
                                size > 32 ? TEXT_STYLES.bodyBold : TEXT_STYLES.captionUpper,
                                {
                                    color: labelColor,
                                    fontWeight: FONT_WEIGHTS.black,
                                    textShadowColor: 'rgba(255, 235, 200, 0.5)',
                                    textShadowOffset: { width: 0, height: 1 },
                                    textShadowRadius: 1,
                                },
                            ]}
                            numberOfLines={1}
                        >
                            {value}
                        </Text>
                    </View>
                )}
            </Animated.View>
        </View>
    );
};

export const ChipMarker = memo(ChipMarkerComponent);
ChipMarker.displayName = 'ChipMarker';

const styles = StyleSheet.create({
    wrapper: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chip: {
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 6,
    },
    tint: {
        position: 'absolute',
    },
    label: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
