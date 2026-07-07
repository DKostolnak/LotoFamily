import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolateColor,
    Easing,
} from 'react-native-reanimated';
import { RADII } from '@/lib/config';

interface GameProgressBarProps {
    /** Progress 0-100 */
    percent: number;
}

/**
 * GameProgressBar — animated fill for the in-game info strip. The fill
 * springs to its new width on every mark and warms from green to gold as
 * the player closes in on a full card, adding a little end-game tension.
 */
export function GameProgressBar({ percent }: GameProgressBarProps) {
    const progress = useSharedValue(percent);

    useEffect(() => {
        progress.value = withTiming(percent, {
            duration: 450,
            easing: Easing.out(Easing.cubic),
        });
    }, [percent, progress]);

    const fillStyle = useAnimatedStyle(() => ({
        width: `${Math.max(0, Math.min(100, progress.value))}%`,
        backgroundColor: interpolateColor(
            progress.value,
            [0, 70, 100],
            ['#4ade80', '#4ade80', '#ffd700'],
        ),
    }));

    return (
        <View
            style={{
                height: 8,
                width: '100%',
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderRadius: RADII.pill,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(90, 64, 37, 0.3)',
            }}
        >
            <Animated.View style={[{ height: '100%', borderRadius: RADII.pill }, fillStyle]} />
        </View>
    );
}

export default GameProgressBar;
