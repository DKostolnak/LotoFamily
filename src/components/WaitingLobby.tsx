import React, { memo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    cancelAnimation,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { WoodenCard, WoodenButton } from '@/components/common';
import { PlayerList } from './PlayerList';
import { Player } from '@/lib/types';
import { ChatMessage } from '@/hooks/useGameSocket';
import { ChatOverlay } from './ChatOverlay';
import { Copy, Share2, MessageSquare } from 'lucide-react-native';
import { useResponsive } from '@/hooks';

/** Translation prop type - accepts both typed and legacy dictionaries */
type TranslationProp = Record<string, string>;

interface WaitingLobbyProps {
    roomCode: string;
    players: Player[];
    currentPlayerId: string;
    isHost: boolean;
    onStart: () => void;
    onLeave: () => void;
    chatMessages?: ChatMessage[];
    onSendMessage?: (msg: string) => void;
    t: TranslationProp;
}

export const WaitingLobby = memo(({
    roomCode, players, currentPlayerId, isHost, onStart, onLeave, chatMessages = [], onSendMessage, t
}: WaitingLobbyProps) => {

    const pulseScale = useSharedValue(1);
    const { scale, scaleFont, scaleIcon } = useResponsive();

    useEffect(() => {
        if (isHost && players.length > 1) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 800 }),
                    withTiming(1, { duration: 800 })
                ),
                -1, // Infinite
                false // Don't reverse
            );
        } else {
            cancelAnimation(pulseScale);
            pulseScale.value = withTiming(1, { duration: 200 });
        }

        return () => {
            cancelAnimation(pulseScale);
        };
    }, [isHost, players.length, pulseScale]);

    const pulseAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const handleShare = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            await Share.share({
                message: `Join my Loto game with code: ${roomCode}`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleCopy = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await Clipboard.setStringAsync(roomCode);
        Alert.alert('Copied!', 'Room code copied to clipboard.');
    };

    const handleStart = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onStart();
    };

    return (
        <View className="flex-1 w-full px-4 justify-center items-center">
            <WoodenCard
                title={t.lobbyTitle || "Waiting Lobby"}
                showBackArrow
                onBack={onLeave}
                className="max-h-[85%]"
            >
                {/* Room Code - Metal Plate Design */}
                <View className="w-full mb-6 items-center">
                    <Text className="text-[#8b6b4a] font-bold text-xs uppercase text-center mb-3 tracking-widest">{t.roomCodeLabel}</Text>

                    <TouchableOpacity
                        onPress={handleCopy}
                        activeOpacity={0.9}
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.5,
                            shadowRadius: 5,
                            elevation: 8
                        }}
                        className="w-full"
                    >
                        {/* Metal Plate Container */}
                        <View className="bg-[#4a4a4a] p-1 rounded-xl border-t border-[#6b6b6b] border-b-2 border-[#2b2b2b]">
                            {/* Inner Brushed Metal */}
                            <View className="bg-[#333] px-6 py-4 rounded-lg border border-[#555] relative overflow-hidden items-center justify-center">

                                {/* Screws */}
                                <View className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#1a1a1a] border border-[#555]" />
                                <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1a1a1a] border border-[#555]" />
                                <View className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[#1a1a1a] border border-[#555]" />
                                <View className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#1a1a1a] border border-[#555]" />

                                {/* Code Text */}
                                <View className="flex-row items-center gap-3">
                                    <Text
                                        className="font-black text-[#e5e5e5] uppercase font-mono"
                                        style={{
                                            fontSize: scaleFont(roomCode.length > 6 ? 32 : 44, 24),
                                            letterSpacing: 8,
                                            textShadowColor: 'rgba(0,0,0,0.5)',
                                            textShadowOffset: { width: 1, height: 1 },
                                            textShadowRadius: 2
                                        }}
                                    >
                                        {roomCode}
                                    </Text>
                                    <View className="bg-[#222] p-2 rounded-full border border-[#444]">
                                        <Copy size={scaleIcon(16)} color="#888" />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleShare} className="mt-4 flex-row items-center gap-2 opacity-80 active:opacity-100">
                        <Share2 size={14} color="#8b6b4a" />
                        <Text className="text-[#8b6b4a] font-bold text-xs uppercase tracking-wider underline">Share Invite</Text>
                    </TouchableOpacity>
                </View>

                {/* Players Roster */}
                <View className="w-full flex-1">
                    <View className="flex-row justify-between items-end mb-2 px-2">
                        <Text className="text-[#8b6b4a] font-bold text-xs uppercase tracking-widest">
                            Roster
                        </Text>
                        <View className="bg-[#5a4025] px-2 py-0.5 rounded-full">
                            <Text className="text-[#ffd700] font-bold text-xs">{players.length}/10</Text>
                        </View>
                    </View>

                    {/* Paper/Clipboard Background */}
                    <View className="w-full bg-[#fdfbf7] border-2 border-[#d6cba0] rounded-sm p-1 flex-1 shadow-sm">
                        {/* Header Clip visual */}
                        <View className="h-1 bg-[#1a1109] mx-12 rounded-b-sm opacity-20 mb-2" />

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 4 }}>
                            <PlayerList players={players} currentPlayerId={currentPlayerId} />
                            {players.length === 0 && (
                                <View className="py-12 items-center opacity-40">
                                    <Text className="text-[#8b6b4a] font-bold uppercase tracking-widest">Waiting for players...</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>

                {/* Action */}
                <View className="w-full mt-6">
                    {isHost ? (
                        <Animated.View style={pulseAnimatedStyle}>
                            <WoodenButton
                                onPress={handleStart}
                                variant="gold"
                                size="lg"
                                fullWidth
                                className="shadow-xl"
                                accessibilityLabel="Start the game"
                            >
                                <Text className="text-2xl mr-2">🎲</Text> {t.startGame}
                            </WoodenButton>
                        </Animated.View>
                    ) : (
                        <View
                            className="p-4 bg-[#1a1109]/50 rounded-xl border border-[#3d2814] justify-center items-center"
                            accessibilityLabel={t.waitingForHost}
                            accessibilityRole="text"
                        >
                            <Text className="text-stone-400 font-medium text-center italic">{t.waitingForHost}</Text>
                        </View>
                    )}
                </View>
            </WoodenCard>
        </View>
    );
});
WaitingLobby.displayName = 'WaitingLobby';
