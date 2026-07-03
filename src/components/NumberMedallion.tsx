import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { TEXT_STYLES, FONT_WEIGHTS } from '@/lib/config';

const MEDALLION = require('../../assets/wooden-medallion.jpg');

export type NumberMedallionSize = 'sm' | 'md' | 'lg' | 'xl';

interface NumberMedallionProps {
    number: number | null;
    size?: NumberMedallionSize;
}

/**
 * Pixel sizes per the design system:
 *  - sm: 44pt — history strip default (min tap target / readable chip)
 *  - md: 60pt — small history hero / compact mode
 *  - lg: 80pt — large history hero / mid-screen
 *  - xl: 120pt — current-number hero on game screen
 */
const DIM = { sm: 44, md: 60, lg: 80, xl: 120 } as const;

export const NumberMedallion = ({ number, size = 'md' }: NumberMedallionProps) => {
    const dim = DIM[size];

    // Animation values
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);
    const prevNumber = useRef(number);

    // Trigger entrance animation when the number changes (called just now).
    useEffect(() => {
        if (number !== null && number !== prevNumber.current) {
            scale.value = withSequence(
                withTiming(0.8, { duration: 80, easing: Easing.out(Easing.quad) }),
                withTiming(1.15, { duration: 180, easing: Easing.out(Easing.back(2)) }),
                withSpring(1, { damping: 8, stiffness: 280 })
            );
            glowOpacity.value = withSequence(
                withTiming(0.85, { duration: 150 }),
                withTiming(0, { duration: 450 })
            );
            prevNumber.current = number;
        }
    }, [number, scale, glowOpacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    // Pick text style based on size — minimum readable size always met.
    const textStyle =
        size === 'xl'
            ? TEXT_STYLES.display
            : size === 'lg'
                ? TEXT_STYLES.h1
                : size === 'md'
                    ? TEXT_STYLES.h2
                    : TEXT_STYLES.bodyBold;

    return (
        <Animated.View style={[styles.wrapper, animatedStyle]}>
            {/* Glow Effect (entrance) */}
            <Animated.View
                style={[
                    styles.glow,
                    { width: dim + 24, height: dim + 24, borderRadius: (dim + 24) / 2 },
                    glowStyle,
                ]}
            />

            <View style={[styles.container, { width: dim, height: dim, borderRadius: dim / 2 }]}>
                <ImageBackground
                    source={MEDALLION}
                    style={[styles.inner, { borderRadius: dim / 2 }]}
                    imageStyle={{ borderRadius: dim / 2 }}
                    resizeMode="cover"
                >
                    {/* Inner bevel */}
                    <View style={[styles.bevel, { borderRadius: dim / 2 }]}>
                        <Text
                            style={[textStyle, styles.text, { fontWeight: FONT_WEIGHTS.black }]}
                            numberOfLines={1}
                        >
                            {number ?? '?'}
                        </Text>
                    </View>
                </ImageBackground>
            </View>
        </Animated.View>
    );
};

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
        shadowRadius: 24,
    },
    container: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 5,
        elevation: 6,
        backgroundColor: '#8b6b4a',
        borderWidth: 2,
        borderColor: '#ffd700',
        overflow: 'hidden',
    },
    inner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bevel: {
        width: '92%',
        height: '92%',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    text: {
        color: '#f5e6c8',
        textShadowColor: 'rgba(61, 40, 20, 1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
});
