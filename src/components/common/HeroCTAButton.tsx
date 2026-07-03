import React, { useEffect } from 'react';
import { Pressable, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    cancelAnimation,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Play } from 'lucide-react-native';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

export type HeroCTAVariant = 'gold' | 'primary';

export interface HeroCTAButtonProps {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    icon?: React.ReactNode;
    variant?: HeroCTAVariant;
    disabled?: boolean;
    /** Repeating breathing scale animation (1 ↔ 1.03) */
    pulse?: boolean;
    /** Outer gold halo glow */
    glow?: boolean;
    accessibilityLabel?: string;
    style?: ViewStyle;
    /** Override default height (default: 92pt). */
    height?: number;
}

const PALETTE = {
    gold: {
        gradient: ['#ffe87a', '#ffd700', '#b8860b'] as const,
        border: '#7a5b08',
        bevel: 'rgba(255, 255, 255, 0.55)',
        text: '#2d1f10',
        subtitle: 'rgba(45, 31, 16, 0.75)',
        shadow: '#5a4205',
        glow: '#ffd700',
    },
    primary: {
        gradient: ['#d9b67c', '#a37947', '#7c5a36'] as const,
        border: '#5a4025',
        bevel: 'rgba(255, 240, 200, 0.55)',
        text: '#2d1f10',
        subtitle: 'rgba(45, 31, 16, 0.7)',
        shadow: '#1a1109',
        glow: '#a37947',
    },
};

/**
 * HeroCTAButton — industry-standard casual-game primary CTA.
 *
 * 92pt tall, full-width, dual-line (title + subtitle), strong shadow + optional
 * gold halo glow + optional pulse animation. Used for "Start Game", "Play Again"
 * style hero moments where the button should dominate the layout.
 */
export const HeroCTAButton = ({
    title,
    subtitle,
    onPress,
    icon,
    variant = 'gold',
    disabled,
    pulse = false,
    glow = true,
    accessibilityLabel,
    style,
    height = 92,
}: HeroCTAButtonProps) => {
    const v = PALETTE[variant];
    const scale = useSharedValue(1);
    const pressed = useSharedValue(0);

    useEffect(() => {
        if (pulse && !disabled) {
            // Breathing pulse (scale 1 ↔ 1.03), continuous; runtime caps re-render
            // cost via Reanimated's worklet — leave it on while button visible.
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.03, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
                false,
            );
        } else {
            cancelAnimation(scale);
            scale.value = withTiming(1, { duration: 200 });
        }
        return () => cancelAnimation(scale);
    }, [pulse, disabled, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { translateY: pressed.value * 4 }],
    }));

    const handlePress = () => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
        onPress?.();
    };

    const renderedIcon =
        icon ?? <Play size={32} color={v.text} fill={v.text} strokeWidth={0} />;

    return (
        <Animated.View style={[{ width: '100%' }, animatedStyle, style]}>
            {/* Outer halo glow — separate Animated.View for the soft radial feel. */}
            {glow && !disabled && (
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        top: -8,
                        left: -8,
                        right: -8,
                        bottom: -8,
                        borderRadius: RADII.xl + 8,
                        shadowColor: v.glow,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.6,
                        shadowRadius: 24,
                        elevation: 0,
                    }}
                />
            )}

            <Pressable
                onPress={handlePress}
                onPressIn={() => {
                    pressed.value = withTiming(1, { duration: 60 });
                }}
                onPressOut={() => {
                    pressed.value = withTiming(0, { duration: 120 });
                }}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel ?? title}
                accessibilityState={{ disabled }}
                style={{
                    height,
                    width: '100%',
                    borderRadius: RADII.xl,
                    borderWidth: 2,
                    borderColor: v.border,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    paddingHorizontal: SPACING.xl,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.6,
                    shadowRadius: 12,
                    elevation: 12,
                    opacity: disabled ? 0.55 : 1,
                }}
                hitSlop={6}
            >
                <LinearGradient
                    pointerEvents="none"
                    colors={v.gradient as unknown as readonly [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Top bevel highlight */}
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        backgroundColor: v.bevel,
                        opacity: 0.85,
                    }}
                />

                {/* Inner bottom shadow */}
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '35%',
                        backgroundColor: 'rgba(0, 0, 0, 0.18)',
                    }}
                />

                <View
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: 'rgba(0, 0, 0, 0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: SPACING.lg,
                    }}
                >
                    {renderedIcon}
                </View>

                <View style={{ flexShrink: 1, alignItems: 'flex-start' }}>
                    <Text
                        style={[
                            TEXT_STYLES.buttonLarge,
                            {
                                color: v.text,
                                fontSize: 22,
                                letterSpacing: 1.5,
                                textShadowColor: 'rgba(255, 255, 255, 0.45)',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 0,
                            },
                        ]}
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.2}
                    >
                        {title}
                    </Text>
                    {subtitle && (
                        <Text
                            style={{
                                color: v.subtitle,
                                fontSize: 12,
                                fontWeight: '700',
                                letterSpacing: 0.4,
                                marginTop: 2,
                            }}
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.2}
                        >
                            {subtitle}
                        </Text>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
};

export default HeroCTAButton;
