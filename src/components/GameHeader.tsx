import React, { memo, useEffect } from 'react';
import { View, TouchableOpacity, ImageBackground, Text } from 'react-native';
import { ChevronLeft, Volume2, VolumeX } from 'lucide-react-native';
import { GameNumbersDisplay } from './GameNumbersDisplay';
import { CoinBadge } from './common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/lib/store';
import { audioService } from '@/lib/services';
import { useResponsive } from '@/hooks';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const WOOD_TEXTURE = require('../../assets/wood-seamless.png');

interface GameHeaderProps {
    currentNumber: number | null;
    history: number[];
    coins: number;
    isConnected: boolean;
    onLeave: () => void;
}

const GameHeaderComponent = ({ currentNumber, history, coins, isConnected, onLeave }: GameHeaderProps) => {
    const insets = useSafeAreaInsets();
    const { isMuted, setMuted } = useGameStore();
    const { responsive, isSmallScreen } = useResponsive();

    // Responsive sizing
    const headerHeight = responsive(100, 140);
    const buttonSize = responsive(36, 40);
    const iconSize = responsive(20, 24);
    const numberDisplayTop = responsive(28, 36);
    const numberDisplayHeight = responsive(60, 80);

    // Animation values
    const iconScale = useSharedValue(1);
    const iconRotation = useSharedValue(0);

    // Sync audio service with store
    useEffect(() => {
        audioService.setMuted(isMuted);
    }, [isMuted]);

    const handleToggleMute = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Animate icon
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

    const ButtonBox = ({ children, onPress }: any) => (
        <TouchableOpacity
            onPress={onPress}
            className="rounded-lg bg-[#2d1f10] border border-[#5a4025] items-center justify-center active:bg-[#3d2814]"
            style={{
                width: buttonSize,
                height: buttonSize,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 2,
                elevation: 3
            }}
        >
            {children}
        </TouchableOpacity>
    );

    return (
        <ImageBackground
            source={WOOD_TEXTURE}
            style={{
                width: '100%',
                height: headerHeight + insets.top,
                borderBottomWidth: 2,
                borderColor: '#5a4025',
                zIndex: 50,
                position: 'relative',
            }}
            resizeMode="repeat"
        >
            {/* Dark Overlay for richness */}
            <View className="absolute inset-0 bg-black/40" />
            <View className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Center Area: Numbers Display */}
            <View
                className="absolute inset-x-0 flex-row justify-center items-center pointer-events-none"
                style={{ top: insets.top + numberDisplayTop, height: numberDisplayHeight, zIndex: 0 }}
            >
                <GameNumbersDisplay currentNumber={currentNumber} history={history} compact={isSmallScreen} />
            </View>

            {/* Controls Layer */}
            <View
                className="absolute inset-x-0 flex-row justify-between items-start z-50 pointer-events-box-none"
                style={{ top: insets.top, paddingHorizontal: responsive(12, 16) }}
            >
                {/* Left: Back & Sound */}
                <View className="flex-row" style={{ gap: responsive(6, 8) }}>
                    <ButtonBox onPress={onLeave}>
                        <ChevronLeft color="#e8d4b8" size={iconSize} strokeWidth={2.5} />
                    </ButtonBox>
                    <ButtonBox onPress={handleToggleMute}>
                        <Animated.View style={iconAnimatedStyle}>
                            {isMuted ? (
                                <VolumeX color="#ef4444" size={iconSize - 4} />
                            ) : (
                                <Volume2 color="#4ade80" size={iconSize - 4} />
                            )}
                        </Animated.View>
                    </ButtonBox>
                </View>

                {/* Right: Status & Coins */}
                <View className="flex-row items-center gap-3">
                    {/* Connection Status Pill */}
                    <View className="flex-row items-center gap-1.5 bg-[#2d1f10]/90 px-2 py-1 rounded-full border border-[#5a4025]/50 shadow-sm">
                        <View
                            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#4ade80]' : 'bg-[#ef4444]'}`}
                            style={{ elevation: 2, shadowColor: isConnected ? '#4ade80' : '#ef4444', shadowOpacity: 1, shadowRadius: 4 }}
                        />
                        <Text className="text-[10px] font-bold text-[#8b6b4a] uppercase">
                            {isConnected ? 'LIVE' : 'OFF'}
                        </Text>
                    </View>
                    <CoinBadge coins={coins} />
                </View>
            </View>

        </ImageBackground>
    );
};

export const GameHeader = memo(GameHeaderComponent);
GameHeader.displayName = 'GameHeader';
