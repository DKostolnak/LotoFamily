import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withSpring,
    withTiming,
    cancelAnimation,
    Easing,
} from 'react-native-reanimated';
import { getSkin, DEFAULT_SKIN_ID } from '@/lib/config/theme.config';

export type ChipMarkerVariant = 'correct' | 'incorrect' | 'missed';

interface ChipMarkerProps {
    marked: boolean;
    value?: number | null;
    variant?: ChipMarkerVariant;
    size?: number;
    /** Aktívny skin z obchodu — určuje farby žetóna. Default: skin_classic */
    activeSkin?: string;
}

/**
 * ChipMarker — okrúhly farebný žetón (disc) ktorý padne na bunku keď
 * hráč označí číslo. Čisto RN render — žiadne image assets.
 *
 * correct  → červeno-bordový disc (výrazný na cream bunke)
 * incorrect → červený s priehľadnosťou
 * missed   → sivý s priehľadnosťou
 */
const ChipMarkerComponent = ({
    marked,
    value,
    variant = 'correct',
    size = 36,
    activeSkin = DEFAULT_SKIN_ID,
}: ChipMarkerProps) => {
    const skin = getSkin(activeSkin);
    const translateY = useSharedValue(-60);
    const scale = useSharedValue(0.4);
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (marked) {
            translateY.value = -60;
            scale.value = 0.4;
            rotation.value = (Math.random() - 0.5) * 40;
            opacity.value = 1;

            translateY.value = withTiming(0, {
                duration: 300,
                easing: Easing.bezier(0.22, 1, 0.36, 1),
            });
            scale.value = withSequence(
                withTiming(1.15, { duration: 220, easing: Easing.out(Easing.cubic) }),
                withSpring(1, { damping: 10, stiffness: 240 })
            );
            rotation.value = withTiming(0, { duration: 300 });
        } else {
            scale.value = withSequence(
                withTiming(1.15, { duration: 80 }),
                withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) })
            );
            opacity.value = withTiming(0, { duration: 200 });
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

    // Farby žetóna podľa variantu + aktívneho skinu
    const discColor =
        variant === 'incorrect' ? skin.incorrectBg
            : variant === 'missed' ? 'rgba(80, 60, 40, 0.55)'
                : skin.chipBg;

    const rimColor =
        variant === 'incorrect' ? skin.incorrectBorder
            : variant === 'missed' ? '#6b5340'
                : skin.chipBorder;

    const textColor =
        variant === 'missed' ? 'rgba(255,255,255,0.6)' : '#fff';

    const fontSize = size <= 28 ? size * 0.38 : size * 0.36;

    return (
        <View pointerEvents="none" style={styles.wrapper}>
            <Animated.View style={[animatedStyle, styles.shadow]}>
                {/* Outer rim */}
                <View style={[styles.disc, {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: rimColor,
                }]}>
                    {/* Inner disc */}
                    <View style={[styles.inner, {
                        width: size * 0.82,
                        height: size * 0.82,
                        borderRadius: (size * 0.82) / 2,
                        backgroundColor: discColor,
                    }]}>
                        {/* Shine highlight */}
                        <View style={[styles.shine, {
                            width: size * 0.35,
                            height: size * 0.18,
                            borderRadius: size * 0.1,
                            top: size * 0.08,
                        }]} />
                        {value !== null && value !== undefined && (
                            <Text style={[styles.label, { fontSize, color: textColor }]} numberOfLines={1}>
                                {value}
                            </Text>
                        )}
                    </View>
                </View>
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
        zIndex: 10,
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.55,
        shadowRadius: 5,
        elevation: 8,
    },
    disc: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    inner: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    shine: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.28)',
    },
    label: {
        fontWeight: '900',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        letterSpacing: -0.5,
    },
});
