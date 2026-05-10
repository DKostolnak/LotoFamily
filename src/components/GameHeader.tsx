import React, { memo, useEffect } from 'react';
import { View, TouchableOpacity, ImageBackground, Text } from 'react-native';
import { ChevronLeft, Volume2, VolumeX } from 'lucide-react-native';
import { GameNumbersDisplay } from './GameNumbersDisplay';
import { CoinBadge } from './common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/lib/store';
import { audioService } from '@/lib/services';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

const WOOD_TEXTURE = require('../../assets/wood-seamless.png');

interface GameHeaderProps {
    currentNumber: number | null;
    history: number[];
    coins: number;
    isConnected: boolean;
    onLeave: () => void;
    /** Optional explicit label — defaults to "LIVE" / "OFF" */
    statusLabel?: string;
}

const BUTTON_BOX_SIZE = 44; // Apple HIG min tap target.

const GameHeaderComponent = ({
    currentNumber,
    history,
    coins,
    isConnected,
    onLeave,
    statusLabel,
}: GameHeaderProps) => {
    const insets = useSafeAreaInsets();
    const { isMuted, setMuted } = useGameStore();

    // Animation values
    const iconScale = useSharedValue(1);
    const iconRotation = useSharedValue(0);

    useEffect(() => {
        audioService.setMuted(isMuted);
    }, [isMuted]);

    const handleToggleMute = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        iconScale.value = withSequence(
            withTiming(0.7, { duration: 100 }),
            withSpring(1, { damping: 8, stiffness: 300 })
        );
        iconRotation.value = withSequence(
            withTiming(isMuted ? -15 : 15, { duration: 100 }),
            withSpring(0, { damping: 10 })
        );
        setMuted(!isMuted);
    };

    const iconAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: iconScale.value },
            { rotate: `${iconRotation.value}deg` },
        ],
    }));

    const ButtonBox = ({
        children,
        onPress,
        accessibilityLabel,
    }: {
        children: React.ReactNode;
        onPress: () => void;
        accessibilityLabel?: string;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            className="bg-wood-darker border border-wood-medium items-center justify-center active:bg-wood-dark"
            style={{
                width: BUTTON_BOX_SIZE,
                height: BUTTON_BOX_SIZE,
                borderRadius: RADII.md,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 2,
                elevation: 3,
            }}
            hitSlop={6}
        >
            {children}
        </TouchableOpacity>
    );

    return (
        <ImageBackground
            source={WOOD_TEXTURE}
            style={{
                width: '100%',
                paddingTop: insets.top,
                paddingBottom: SPACING.md,
                borderBottomWidth: 2,
                borderColor: '#5a4025',
                zIndex: 50,
            }}
            resizeMode="repeat"
        >
            {/* Cozy wooden-panel overlay (rgba 0.85 — drevený panel feel) */}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(45, 31, 16, 0.85)',
                }}
            />

            {/* Top control row */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: SPACING.lg,
                    gap: SPACING.md,
                }}
            >
                {/* Left: Back & Sound */}
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                    <ButtonBox onPress={onLeave} accessibilityLabel="Back">
                        <ChevronLeft color="#e8d4b8" size={24} strokeWidth={2.5} />
                    </ButtonBox>
                    <ButtonBox
                        onPress={handleToggleMute}
                        accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
                    >
                        <Animated.View style={iconAnimatedStyle}>
                            {isMuted ? (
                                <VolumeX color="#ef4444" size={20} />
                            ) : (
                                <Volume2 color="#4ade80" size={20} />
                            )}
                        </Animated.View>
                    </ButtonBox>
                </View>

                {/* Right: Status pill + Coins */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: SPACING.xs,
                            backgroundColor: 'rgba(45, 31, 16, 0.9)',
                            paddingHorizontal: SPACING.md,
                            paddingVertical: SPACING.xs,
                            borderRadius: RADII.pill,
                            borderWidth: 1,
                            borderColor: 'rgba(90, 64, 37, 0.6)',
                        }}
                    >
                        <View
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: isConnected ? '#4ade80' : '#ef4444',
                                shadowColor: isConnected ? '#4ade80' : '#ef4444',
                                shadowOpacity: 1,
                                shadowRadius: 4,
                                elevation: 2,
                            }}
                        />
                        <Text style={[TEXT_STYLES.captionUpper, { color: '#d4b896' }]}>
                            {statusLabel ?? (isConnected ? 'LIVE' : 'OFF')}
                        </Text>
                    </View>
                    <CoinBadge coins={coins} />
                </View>
            </View>

            {/* Numbers display row */}
            <View
                style={{
                    marginTop: SPACING.md,
                    paddingHorizontal: SPACING.lg,
                    alignItems: 'center',
                }}
            >
                <GameNumbersDisplay
                    currentNumber={currentNumber}
                    history={history}
                    compact={true}
                />
            </View>
        </ImageBackground>
    );
};

export const GameHeader = memo(GameHeaderComponent);
GameHeader.displayName = 'GameHeader';
