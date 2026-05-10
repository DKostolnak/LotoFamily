import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withSpring,
    withTiming,
    withRepeat,
    withDelay,
    cancelAnimation,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import Svg, {
    Rect,
    Ellipse,
    Line,
    Defs,
    LinearGradient,
    Stop,
} from 'react-native-svg';
import { TEXT_STYLES, FONT_WEIGHTS } from '@/lib/config';
import { audioService } from '@/lib/services/audio';

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
    /** Idle wobble (default true). Pauses while a roll is in progress. */
    idle?: boolean;
}

const SIZE_PT: Record<WoodenBarrelSize, number> = {
    sm: 60,
    md: 100,
    lg: 160,
};

// Palette (wood + brass) — uses theme tokens where possible, gold/brass from accent palette.
const COLOR = {
    woodLightTop: '#7a5635',
    woodMid: '#5a4025',
    woodDark: '#3d2814',
    woodDarkest: '#2d1f10',
    plankShadow: '#1a1109',
    brassTop: '#ffd700',
    brassMid: '#d4af37',
    brassDark: '#b8860b',
    holeDark: '#0d0805',
    numberText: '#ffd700',
    numberShadow: '#1a1109',
} as const;

/**
 * Static SVG body of the barrel — drawn once, transformed via Animated.View wrapper.
 *
 * Construction:
 *   - Outer rounded rect = barrel staves (linear gradient top→bottom dark wood)
 *   - 4 horizontal plank lines (subtle, dark stroke, opacity 0.35)
 *   - 2 brass hoops (top + bottom) rendered as flat ellipses with brass gradient
 *   - Inner "hole" — dark elliptical opening centered, revealing the number behind
 */
const BarrelSvg = memo(({ dim, showHole }: { dim: number; showHole: boolean }) => {
    const w = dim;
    const h = dim;
    // Barrel body — slightly inset horizontally so we have hoop overhang space.
    const bodyX = w * 0.08;
    const bodyY = h * 0.12;
    const bodyW = w * 0.84;
    const bodyH = h * 0.76;
    const bodyRx = w * 0.22;

    const hoopX = w * 0.04;
    const hoopW = w * 0.92;
    const hoopH = h * 0.08;
    const hoopTopY = h * 0.10;
    const hoopBottomY = h * 0.82;

    const holeCx = w / 2;
    const holeCy = h / 2;
    const holeRx = w * 0.26;
    const holeRy = h * 0.18;

    return (
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <Defs>
                <LinearGradient id="woodGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={COLOR.woodLightTop} stopOpacity="1" />
                    <Stop offset="0.45" stopColor={COLOR.woodMid} stopOpacity="1" />
                    <Stop offset="1" stopColor={COLOR.woodDarkest} stopOpacity="1" />
                </LinearGradient>
                <LinearGradient id="brassGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={COLOR.brassTop} stopOpacity="1" />
                    <Stop offset="0.5" stopColor={COLOR.brassMid} stopOpacity="1" />
                    <Stop offset="1" stopColor={COLOR.brassDark} stopOpacity="1" />
                </LinearGradient>
                <LinearGradient id="holeGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={COLOR.holeDark} stopOpacity="1" />
                    <Stop offset="1" stopColor={COLOR.woodDarkest} stopOpacity="1" />
                </LinearGradient>
            </Defs>

            {/* Barrel body */}
            <Rect
                x={bodyX}
                y={bodyY}
                width={bodyW}
                height={bodyH}
                rx={bodyRx}
                ry={bodyRx}
                fill="url(#woodGrad)"
                stroke={COLOR.brassDark}
                strokeWidth={2}
            />

            {/* Plank seams — 3 horizontal lines across the body */}
            {[0.32, 0.5, 0.68].map((t) => (
                <Line
                    key={t}
                    x1={bodyX + bodyW * 0.05}
                    y1={bodyY + bodyH * t}
                    x2={bodyX + bodyW * 0.95}
                    y2={bodyY + bodyH * t}
                    stroke={COLOR.plankShadow}
                    strokeWidth={1}
                    opacity={0.35}
                />
            ))}

            {/* Inner hole (the opening from which the number emerges) */}
            {showHole && (
                <Ellipse
                    cx={holeCx}
                    cy={holeCy}
                    rx={holeRx}
                    ry={holeRy}
                    fill="url(#holeGrad)"
                    stroke={COLOR.brassDark}
                    strokeWidth={1.5}
                    opacity={0.85}
                />
            )}

            {/* Top hoop */}
            <Ellipse
                cx={hoopX + hoopW / 2}
                cy={hoopTopY + hoopH / 2}
                rx={hoopW / 2}
                ry={hoopH / 2}
                fill="url(#brassGrad)"
                stroke={COLOR.woodDarkest}
                strokeWidth={1}
            />

            {/* Bottom hoop */}
            <Ellipse
                cx={hoopX + hoopW / 2}
                cy={hoopBottomY + hoopH / 2}
                rx={hoopW / 2}
                ry={hoopH / 2}
                fill="url(#brassGrad)"
                stroke={COLOR.woodDarkest}
                strokeWidth={1}
            />
        </Svg>
    );
});
BarrelSvg.displayName = 'BarrelSvg';

const WoodenBarrelComponent = ({
    number,
    rollKey,
    onRollComplete,
    size = 'lg',
    idle = true,
}: WoodenBarrelProps) => {
    const dim = SIZE_PT[size];

    // Shared values
    const rotation = useSharedValue(0); // degrees (Y-axis flip via rotateY)
    const numberScale = useSharedValue(0);
    const numberOpacity = useSharedValue(0);
    const idleWobble = useSharedValue(0); // small Z rotation
    const glowOpacity = useSharedValue(0);

    // Initialize number visibility if there's already a number (e.g. mid-game mount).
    useEffect(() => {
        if (number !== null && numberOpacity.value === 0) {
            numberOpacity.value = 1;
            numberScale.value = 1;
        }
    }, [number, numberOpacity, numberScale]);

    // Roll animation triggered by rollKey change.
    useEffect(() => {
        if (rollKey === undefined) return;

        // Cancel any in-flight idle wobble
        cancelAnimation(idleWobble);
        idleWobble.value = withTiming(0, { duration: 120 });

        // Reset number
        numberOpacity.value = 0;
        numberScale.value = 0;

        // Sound: barrel roll start. Audio service has no-op fallback for missing assets.
        // Note: SoundEffect type currently exposes 'call' as the canonical "number called" cue.
        // We use it here for both the rolling and reveal moments — audio team will replace
        // with dedicated 'barrel_roll' / 'number_called' assets when available.
        audioService.playSound('call').catch(() => { });

        // Rotation: 2 full Y-spins over 700ms, ease-out.
        rotation.value = 0;
        rotation.value = withTiming(720, {
            duration: 700,
            easing: Easing.out(Easing.cubic),
        });

        // Number reveal after rotation settles (700ms).
        numberOpacity.value = withDelay(680, withTiming(1, { duration: 220 }));
        numberScale.value = withDelay(
            680,
            withSequence(
                withTiming(1.2, { duration: 220, easing: Easing.out(Easing.back(2)) }),
                withSpring(1, { damping: 9, stiffness: 260 }, (finished) => {
                    if (finished && onRollComplete) {
                        runOnJS(onRollComplete)();
                    }
                })
            )
        );

        // Glow pulse around number
        glowOpacity.value = withDelay(
            700,
            withSequence(
                withTiming(0.9, { duration: 220 }),
                withTiming(0, { duration: 900 })
            )
        );
        // We intentionally do not include onRollComplete in deps — stable callback contract.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rollKey]);

    // Idle wobble — only when idle is on, no active roll, and we want gentle life.
    useEffect(() => {
        if (!idle) {
            cancelAnimation(idleWobble);
            idleWobble.value = withTiming(0, { duration: 200 });
            return;
        }

        idleWobble.value = withRepeat(
            withSequence(
                withTiming(3, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
                withTiming(-3, { duration: 1600, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );

        return () => {
            cancelAnimation(idleWobble);
        };
    }, [idle, idleWobble]);

    // Cleanup on unmount: cancel every animation to avoid orphaned timers.
    useEffect(() => {
        return () => {
            cancelAnimation(rotation);
            cancelAnimation(numberScale);
            cancelAnimation(numberOpacity);
            cancelAnimation(idleWobble);
            cancelAnimation(glowOpacity);
        };
    }, [rotation, numberScale, numberOpacity, idleWobble, glowOpacity]);

    const barrelStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 600 },
            { rotateY: `${rotation.value}deg` },
            { rotateZ: `${idleWobble.value}deg` },
        ],
    }));

    const numberStyle = useAnimatedStyle(() => ({
        opacity: numberOpacity.value,
        transform: [{ scale: numberScale.value }],
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

    const showHole = size !== 'sm';
    const hasNumber = number !== null;

    return (
        <View
            style={[styles.wrapper, { width: dim, height: dim }]}
            accessibilityLabel={
                hasNumber ? `Called number ${number}` : 'Barrel — waiting for next number'
            }
            accessibilityRole="image"
        >
            {/* Glow halo behind number */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.glow,
                    {
                        width: dim * 0.65,
                        height: dim * 0.65,
                        borderRadius: (dim * 0.65) / 2,
                    },
                    glowStyle,
                ]}
            />

            {/* Barrel body — rotates */}
            <Animated.View style={[styles.barrelLayer, barrelStyle]}>
                <BarrelSvg dim={dim} showHole={showHole} />
            </Animated.View>

            {/* Number overlay — emerges from hole */}
            {hasNumber && size !== 'sm' && (
                <Animated.View style={[styles.numberLayer, numberStyle]} pointerEvents="none">
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
    barrelLayer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
    numberLayer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    numberText: {
        color: COLOR.numberText,
        textShadowColor: COLOR.numberShadow,
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 3,
    },
    glow: {
        position: 'absolute',
        backgroundColor: '#ffd700',
        shadowColor: '#ffd700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 28,
    },
});
