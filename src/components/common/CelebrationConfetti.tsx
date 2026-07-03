import React, { useEffect, useRef } from 'react';
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

export interface CelebrationConfettiProps {
    /** When this flips to true the confetti fires once. */
    fire: boolean;
    /** Called after the fade-out completes (~4s). */
    onComplete?: () => void;
}

/** Warm, family-friendly palette — gold + cream + amber, no neon. */
const COLORS = ['#ffd700', '#f5e6c8', '#d4b896', '#b8860b', '#e6b450', '#a6814c'];

/**
 * Deterministic, fire-and-forget confetti wrapper around
 * react-native-confetti-cannon. No infinite animations — fades out in ~4s.
 */
export const CelebrationConfetti = ({ fire, onComplete }: CelebrationConfettiProps) => {
    const { width: screenWidth } = useWindowDimensions();
    const completedRef = useRef(false);

    useEffect(() => {
        if (!fire) {
            completedRef.current = false;
            return;
        }
        if (completedRef.current) return;
        const t = setTimeout(() => {
            completedRef.current = true;
            onComplete?.();
        }, 4200);
        return () => clearTimeout(t);
    }, [fire, onComplete]);

    if (!fire) return null;

    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <ConfettiCannon
                count={100}
                origin={{ x: screenWidth / 2, y: -20 }}
                explosionSpeed={350}
                fallSpeed={3500}
                fadeOut
                autoStart
                colors={COLORS}
            />
        </View>
    );
};

export default CelebrationConfetti;
