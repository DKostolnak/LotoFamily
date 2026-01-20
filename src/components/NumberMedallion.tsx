import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';

interface NumberMedallionProps {
    number: number | null;
    size?: 'sm' | 'md' | 'lg';
}

export const NumberMedallion = ({ number, size = 'md' }: NumberMedallionProps) => {
    // Sizes
    const dim = size === 'lg' ? 74 : size === 'sm' ? 38 : 60;
    const fontSize = size === 'lg' ? 36 : size === 'sm' ? 16 : 28;

    // Animation values
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);
    const prevNumber = useRef(number);

    // Trigger animation when number changes
    useEffect(() => {
        if (number !== null && number !== prevNumber.current) {
            // Pop animation
            scale.value = withSequence(
                withTiming(1.25, { duration: 150, easing: Easing.out(Easing.back(2)) }),
                withSpring(1, { damping: 8, stiffness: 300 })
            );

            // Glow pulse
            glowOpacity.value = withSequence(
                withTiming(0.8, { duration: 150 }),
                withTiming(0, { duration: 400 })
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

    return (
        <Animated.View style={[styles.wrapper, animatedStyle]}>
            {/* Glow Effect */}
            <Animated.View
                style={[
                    styles.glow,
                    { width: dim + 20, height: dim + 20, borderRadius: (dim + 20) / 2 },
                    glowStyle
                ]}
            />

            <View style={[styles.container, { width: dim, height: dim, borderRadius: dim / 2 }]}>
                <LinearGradient
                    colors={['#cda468', '#8b6b4a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.inner, { borderRadius: dim / 2 }]}
                >
                    {/* Inner Bevel */}
                    <View style={[styles.bevel, { borderRadius: dim / 2 }]}>
                        <Text style={[styles.text, { fontSize }]}>
                            {number ?? '?'}
                        </Text>
                    </View>
                </LinearGradient>
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
        shadowRadius: 20,
    },
    container: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
        backgroundColor: '#8b6b4a',
        borderWidth: 1,
        borderColor: '#5a4025',
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
        backgroundColor: 'transparent'
    },
    text: {
        fontFamily: 'System',
        fontWeight: '900',
        color: '#f5e6c8',
        textShadowColor: 'rgba(61, 40, 20, 1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    }
});
