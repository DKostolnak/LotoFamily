/**
 * ChipMarker - Animated wooden poker-chip marker for LotoCard cells.
 *
 * Drops onto a marked cell with a gravity-style bounce and rotation,
 * then settles. On unmark, lifts and fades away.
 *
 * Designed to be rendered ONLY while `marked === true` from the parent —
 * unmounting on unmark is fine (the lift animation runs before unmount only
 * if parent gates with a transition; otherwise the chip just disappears,
 * which is acceptable for the conditional-render perf path).
 *
 * Variants:
 *   - 'correct'   gold edge, wood body (default — marked AND called)
 *   - 'incorrect' red edge, dark body (marked but NOT called → user mistake)
 *   - 'missed'    muted gold, low opacity (called but NOT marked → user missed)
 *
 * Sound + haptic hooks are deliberately left to the parent (LotoCard already
 * fires Haptics.impactAsync on mark). The audio service does not yet support
 * a 'chip_drop' effect; once it does it can be wired here with no API change.
 */

import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Line, RadialGradient, Stop } from 'react-native-svg';

export type ChipVariant = 'correct' | 'incorrect' | 'missed';

interface ChipMarkerProps {
    /** Whether the chip is shown (true = marked). Toggles the drop / lift animation. */
    marked: boolean;
    /** Cell value to display through the chip center (optional). */
    value?: number | null;
    /** Visual variant — see file header. */
    variant?: ChipVariant;
    /** Size in pt — typically auto-sized to the cell. Default 32. */
    size?: number;
}

// ---------------------------------------------------------------------------
// Variant palette (semantic — gold/wood/red kept here so callers don't need
// to know the colors; keeps theming centralized within the component).
// ---------------------------------------------------------------------------
const VARIANT_COLORS: Record<ChipVariant, {
    ringTop: string;
    ringBot: string;
    bodyInner: string;
    bodyOuter: string;
    stroke: string;
    hatch: string;
    label: string;
    opacity: number;
}> = {
    correct: {
        ringTop: '#ffd700',
        ringBot: '#b8860b',
        bodyInner: '#5a4025',
        bodyOuter: '#3d2814',
        stroke: '#2a1a0c',
        hatch: 'rgba(255, 215, 0, 0.35)',
        label: 'rgba(255, 230, 150, 0.85)',
        opacity: 1,
    },
    incorrect: {
        ringTop: '#ef4444',
        ringBot: '#7f1d1d',
        bodyInner: '#3d1414',
        bodyOuter: '#1f0808',
        stroke: '#450a0a',
        hatch: 'rgba(254, 202, 202, 0.3)',
        label: 'rgba(254, 226, 226, 0.85)',
        opacity: 1,
    },
    missed: {
        ringTop: '#a98a3f',
        ringBot: '#6b5320',
        bodyInner: '#3a2a18',
        bodyOuter: '#26190c',
        stroke: '#1a1208',
        hatch: 'rgba(180, 150, 80, 0.25)',
        label: 'rgba(220, 200, 150, 0.7)',
        opacity: 0.6,
    },
};

function ChipMarkerComponent({ marked, value, variant = 'correct', size = 32 }: ChipMarkerProps) {
    const chipScale = useSharedValue(marked ? 1 : 0);
    const chipTranslateY = useSharedValue(0);
    const chipRotation = useSharedValue(0);
    const chipOpacity = useSharedValue(marked ? 1 : 0);

    useEffect(() => {
        if (marked) {
            // Drop in from above with a slight random tilt for variety.
            const initialRotation = (Math.random() - 0.5) * 60; // ±30deg
            chipTranslateY.value = -120;
            chipScale.value = 0.4;
            chipRotation.value = initialRotation;
            chipOpacity.value = 1;

            chipTranslateY.value = withTiming(0, {
                duration: 380,
                easing: Easing.bezier(0.5, 1, 0.6, 1),
            });
            chipScale.value = withSequence(
                withTiming(1.15, { duration: 300, easing: Easing.out(Easing.cubic) }),
                withSpring(1, { damping: 8, stiffness: 200 }),
            );
            chipRotation.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });
        } else {
            // Lift away.
            chipScale.value = withSequence(
                withTiming(1.2, { duration: 100 }),
                withTiming(0, { duration: 200 }),
            );
            chipOpacity.value = withTiming(0, { duration: 250 });
        }

        return () => {
            cancelAnimation(chipTranslateY);
            cancelAnimation(chipScale);
            cancelAnimation(chipRotation);
            cancelAnimation(chipOpacity);
        };
    }, [marked, chipTranslateY, chipScale, chipRotation, chipOpacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: chipOpacity.value,
        transform: [
            { translateY: chipTranslateY.value },
            { scale: chipScale.value },
            { rotate: `${chipRotation.value}deg` },
        ],
    }));

    const colors = VARIANT_COLORS[variant];
    const labelSize = Math.max(10, size * 0.42);

    // SVG geometry — viewBox 100x100, drawn relative so any size scales cleanly.
    const ringId = `chip-ring-${variant}`;
    const bodyId = `chip-body-${variant}`;

    return (
        <View style={[styles.wrapper, { opacity: colors.opacity }]} pointerEvents="none">
            <Animated.View style={[styles.chip, { width: size, height: size }, animatedStyle]}>
                <Svg width={size} height={size} viewBox="0 0 100 100">
                    <Defs>
                        <LinearGradient id={ringId} x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={colors.ringTop} />
                            <Stop offset="1" stopColor={colors.ringBot} />
                        </LinearGradient>
                        <RadialGradient id={bodyId} cx="50%" cy="40%" r="60%">
                            <Stop offset="0" stopColor={colors.bodyInner} />
                            <Stop offset="1" stopColor={colors.bodyOuter} />
                        </RadialGradient>
                    </Defs>

                    {/* Outer ring (gold/red rim) */}
                    <Circle cx="50" cy="50" r="48" fill={`url(#${ringId})`} stroke={colors.stroke} strokeWidth="1.5" />

                    {/* Inner wood body */}
                    <Circle cx="50" cy="50" r="36" fill={`url(#${bodyId})`} stroke={colors.stroke} strokeWidth="0.8" />

                    {/* Subtle hatching / wood detail */}
                    <Line x1="22" y1="50" x2="78" y2="50" stroke={colors.hatch} strokeWidth="0.8" />
                    <Line x1="50" y1="22" x2="50" y2="78" stroke={colors.hatch} strokeWidth="0.8" />
                    <Line x1="30" y1="30" x2="70" y2="70" stroke={colors.hatch} strokeWidth="0.6" />
                </Svg>

                {value !== null && value !== undefined ? (
                    <View style={styles.labelWrap} pointerEvents="none">
                        <Text style={[styles.label, { fontSize: labelSize, color: colors.label }]}>{value}</Text>
                    </View>
                ) : null}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chip: {
        alignItems: 'center',
        justifyContent: 'center',
        // Drop shadow for the "settled on cell" feel.
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
        elevation: 4,
    },
    labelWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontWeight: '900',
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});

export const ChipMarker = memo(ChipMarkerComponent);
ChipMarker.displayName = 'ChipMarker';
