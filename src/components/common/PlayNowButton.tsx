import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View, ViewStyle, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withDelay,
    withRepeat,
    cancelAnimation,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface PlayNowButtonProps {
    onPress: () => void;
    title: string;
    subtitle?: string;
    style?: ViewStyle;
}

const SHINE_WIDTH = 80;

/**
 * PlayNowButton — the dominant primary CTA on Home. A solid-gold plaque
 * with a vertical sheen gradient, a breathing outer glow and a periodic
 * shine sweep. The two loops are slow and lightweight (transform/opacity
 * only) so the battery cost stays negligible while the button clearly
 * reads as "this is the one thing to tap".
 */
export function PlayNowButton({ onPress, title, subtitle, style }: PlayNowButtonProps) {
    const pulse = useSharedValue(1);
    const press = useSharedValue(1);
    const glow = useSharedValue(0);
    const shine = useSharedValue(0);

    useEffect(() => {
        // One welcoming pulse on mount…
        pulse.value = withDelay(
            500,
            withSequence(
                withTiming(1.04, { duration: 600, easing: Easing.out(Easing.cubic) }),
                withTiming(1, { duration: 600, easing: Easing.inOut(Easing.cubic) })
            )
        );
        // …then a slow breathing glow (opacity only — cheap to composite).
        glow.value = withDelay(
            1200,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })
                ),
                -1
            )
        );
        // Shine sweep across the plaque every ~4s.
        shine.value = withDelay(
            900,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
                    withTiming(1, { duration: 3100 }) // hold off-screen between sweeps
                ),
                -1
            )
        );
        return () => {
            cancelAnimation(pulse);
            cancelAnimation(glow);
            cancelAnimation(shine);
        };
    }, [pulse, glow, shine]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value * press.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: 0.25 + glow.value * 0.45,
    }));

    const shineStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(shine.value, [0, 1], [-SHINE_WIDTH * 2, 460]) },
            { rotate: '18deg' },
        ],
    }));

    const handlePressIn = () => {
        press.value = withTiming(0.96, { duration: 80 });
    };
    const handlePressOut = () => {
        press.value = withTiming(1, { duration: 120 });
    };
    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onPress();
    };

    return (
        <Animated.View style={[animatedStyle, style]}>
            {/* Breathing gold halo behind the plaque */}
            <Animated.View pointerEvents="none" style={[styles.halo, glowStyle]} />

            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.92}
                accessibilityRole="button"
                accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
                style={styles.plaque}
            >
                {/* Solid gold body */}
                <LinearGradient
                    pointerEvents="none"
                    colors={['#ffe87a', '#ffd700', '#e8ad17']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Top bevel highlight */}
                <View pointerEvents="none" style={styles.bevel} />
                {/* Bottom inner shadow */}
                <View pointerEvents="none" style={styles.innerShadow} />

                {/* Periodic shine sweep */}
                <Animated.View pointerEvents="none" style={[styles.shine, shineStyle]} />

                <View style={styles.iconDisc}>
                    <Play size={30} color="#ffd700" strokeWidth={3} fill="#ffd700" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                        style={[
                            TEXT_STYLES.display,
                            {
                                color: '#2d1f10',
                                fontSize: 28,
                                lineHeight: 32,
                                textShadowColor: 'rgba(255, 248, 220, 0.55)',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 0,
                            },
                        ]}
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.2}
                    >
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text
                            style={[
                                TEXT_STYLES.caption,
                                { color: '#5a4025', marginTop: 4, fontWeight: '700' },
                            ]}
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.2}
                        >
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    halo: {
        position: 'absolute',
        top: -6,
        left: -6,
        right: -6,
        bottom: -6,
        borderRadius: RADII.xl + 6,
        backgroundColor: 'rgba(255, 215, 0, 0.16)',
        shadowColor: '#ffd700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 18,
        elevation: 0,
    },
    plaque: {
        minHeight: 100,
        borderRadius: RADII.xl,
        borderWidth: 3,
        borderColor: '#7a5b08',
        overflow: 'hidden',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.55,
        shadowRadius: 14,
        elevation: 12,
    },
    bevel: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '48%',
        backgroundColor: 'rgba(255, 255, 255, 0.30)',
    },
    innerShadow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '30%',
        backgroundColor: 'rgba(122, 91, 8, 0.18)',
    },
    shine: {
        position: 'absolute',
        top: -30,
        bottom: -30,
        width: SHINE_WIDTH,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
    },
    iconDisc: {
        width: 56,
        height: 56,
        borderRadius: RADII.lg,
        backgroundColor: '#2d1f10',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
});

export default PlayNowButton;
