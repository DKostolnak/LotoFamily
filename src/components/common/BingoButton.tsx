import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    cancelAnimation,
    Easing,
    ZoomIn,
} from 'react-native-reanimated';
import { WoodenButton } from './WoodenButton';
import { RADII } from '@/lib/config';

interface BingoButtonProps {
    onPress: () => void;
    label: string;
}

/**
 * BingoButton — the floating "claim it!" moment. Springs in with a zoom,
 * then keeps a heartbeat pulse + gold halo running so the player can't
 * miss that their card is complete. Loops are transform/opacity only and
 * the component unmounts as soon as the claim is made.
 */
export function BingoButton({ onPress, label }: BingoButtonProps) {
    const beat = useSharedValue(0);

    useEffect(() => {
        beat.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 550, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: 550, easing: Easing.inOut(Easing.sin) })
            ),
            -1
        );
        return () => cancelAnimation(beat);
    }, [beat]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + beat.value * 0.05 }],
    }));

    const haloStyle = useAnimatedStyle(() => ({
        opacity: 0.3 + beat.value * 0.5,
    }));

    return (
        <Animated.View entering={ZoomIn.springify().damping(10)} style={pulseStyle}>
            <Animated.View pointerEvents="none" style={[styles.halo, haloStyle]} />
            <WoodenButton onPress={onPress} variant="gold" size="lg" accessibilityLabel="BINGO">
                {label}
            </WoodenButton>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    halo: {
        position: 'absolute',
        top: -8,
        left: -8,
        right: -8,
        bottom: -8,
        borderRadius: RADII.xl + 8,
        backgroundColor: 'rgba(255, 215, 0, 0.20)',
        shadowColor: '#ffd700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 22,
    },
});

export default BingoButton;
