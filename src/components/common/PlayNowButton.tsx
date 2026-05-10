import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Play } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface PlayNowButtonProps {
    onPress: () => void;
    title: string;
    subtitle?: string;
    style?: ViewStyle;
}

/**
 * PlayNowButton — the dominant primary CTA on Home. A wood-plaque with
 * gold gradient, prominent shadow and a single, unmistakable call to
 * action. One subtle pulse on mount, no infinite loops.
 */
export function PlayNowButton({ onPress, title, subtitle, style }: PlayNowButtonProps) {
    const pulse = useSharedValue(1);
    const press = useSharedValue(1);

    useEffect(() => {
        pulse.value = withDelay(
            500,
            withSequence(
                withTiming(1.04, { duration: 600, easing: Easing.out(Easing.cubic) }),
                withTiming(1, { duration: 600, easing: Easing.inOut(Easing.cubic) })
            )
        );
    }, [pulse]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value * press.value }],
    }));

    const handlePressIn = () => {
        press.value = withTiming(0.97, { duration: 80 });
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
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.92}
                accessibilityRole="button"
                accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
                style={{
                    minHeight: 100,
                    borderRadius: RADII.xl,
                    borderWidth: 3,
                    borderColor: '#ffd700',
                    backgroundColor: '#3d2814',
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
                }}
            >
                {/* Inner gold gradient highlight */}
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: RADII.xl - 3,
                        backgroundColor: 'rgba(255, 215, 0, 0.10)',
                    }}
                />
                <View
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: RADII.lg,
                        backgroundColor: '#ffd700',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.4,
                        shadowRadius: 4,
                        elevation: 4,
                    }}
                >
                    <Play size={32} color="#1a1109" strokeWidth={3} fill="#1a1109" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                        style={[
                            TEXT_STYLES.display,
                            {
                                color: '#ffd700',
                                fontSize: 28,
                                lineHeight: 32,
                                textShadowColor: 'rgba(0,0,0,0.6)',
                                textShadowOffset: { width: 0, height: 2 },
                                textShadowRadius: 0,
                            },
                        ]}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text
                            style={[
                                TEXT_STYLES.caption,
                                { color: '#d4b896', marginTop: 4 },
                            ]}
                            numberOfLines={1}
                        >
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default PlayNowButton;
