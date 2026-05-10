import React, { memo, useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, Platform } from 'react-native';
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
import * as Linking from 'expo-linking';
import { WoodenCard, WoodenButton } from '@/components/common';
import { PlayerList } from './PlayerList';
import { Player } from '@/lib/types';
import { ChatMessage } from '@/hooks/useGameSocket';
import { Copy, Share2 } from 'lucide-react-native';
import type { TranslationKeys } from '@/lib/i18n';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface WaitingLobbyProps {
    roomCode: string;
    players: Player[];
    currentPlayerId: string;
    isHost: boolean;
    onStart: () => void;
    onLeave: () => void;
    chatMessages?: ChatMessage[];
    onSendMessage?: (msg: string) => void;
    t: TranslationKeys;
}

export const WaitingLobby = memo(({
    roomCode,
    players,
    currentPlayerId,
    isHost,
    onStart,
    onLeave,
    t,
}: WaitingLobbyProps) => {
    const pulseScale = useSharedValue(1);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isHost && players.length > 1) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.04, { duration: 800 }),
                    withTiming(1, { duration: 800 })
                ),
                -1,
                false
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

    const handleShare = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            // Build a deep link the recipient can tap to open the app pre-filled
            // in Join mode (handler in src/app/index.tsx parses ?room=).
            const url = Linking.createURL('/', { queryParams: { room: roomCode } });
            const message = `${t.joinMyGame ?? 'Join my Loto game!'} ${url}`;
            await Share.share({
                message,
                url, // iOS surfaces this as the rich preview link
                title: 'LOTO Invite',
            });
        } catch {
            // user cancelled or share unavailable
        }
    }, [roomCode, t.joinMyGame]);

    const handleCopy = useCallback(async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await Clipboard.setStringAsync(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    }, [roomCode]);

    const handleStart = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onStart();
    }, [onStart]);

    return (
        <View style={{ flex: 1, paddingHorizontal: SPACING.lg, justifyContent: 'center', alignItems: 'center' }}>
            <WoodenCard
                title={t.lobbyTitle ?? 'Waiting Lobby'}
                showBackArrow
                onBack={onLeave}
                style={{ maxHeight: '92%' }}
            >
                {/* Room Code Hero */}
                <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
                    <Text
                        style={[
                            TEXT_STYLES.captionUpper,
                            { color: '#d4b896', marginBottom: SPACING.sm, textAlign: 'center' },
                        ]}
                    >
                        {t.roomCodeLabel ?? 'ROOM CODE'}
                    </Text>

                    <TouchableOpacity
                        onPress={handleCopy}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={`${t.roomCodeLabel ?? 'Room code'}: ${roomCode}. ${t.tapToCopy ?? 'Tap to copy'}`}
                        style={{
                            width: '100%',
                            backgroundColor: '#1a1109',
                            borderRadius: RADII.lg,
                            borderWidth: 2,
                            borderColor: '#5a4025',
                            paddingVertical: SPACING.lg,
                            paddingHorizontal: SPACING.xl,
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.5,
                            shadowRadius: 6,
                            elevation: 6,
                        }}
                    >
                        <Text
                            style={[
                                TEXT_STYLES.display,
                                {
                                    color: '#ffd700',
                                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                                    letterSpacing: 4,
                                    textAlign: 'center',
                                    textShadowColor: 'rgba(255,215,0,0.4)',
                                    textShadowOffset: { width: 0, height: 0 },
                                    textShadowRadius: 12,
                                },
                            ]}
                            numberOfLines={1}
                        >
                            {roomCode}
                        </Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: SPACING.xs,
                                marginTop: SPACING.sm,
                            }}
                        >
                            <Copy size={14} color="#d4b896" />
                            <Text style={[TEXT_STYLES.caption, { color: '#d4b896' }]}>
                                {copied ? (t.copied ?? 'Copied') : (t.tapToCopy ?? 'Tap to copy')}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleShare}
                        accessibilityRole="button"
                        accessibilityLabel={t.share ?? 'Share'}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: SPACING.xs,
                            marginTop: SPACING.md,
                            paddingVertical: SPACING.xs,
                            paddingHorizontal: SPACING.md,
                        }}
                        hitSlop={8}
                    >
                        <Share2 size={16} color="#d4b896" />
                        <Text style={[TEXT_STYLES.button, { color: '#d4b896' }]}>
                            {(t as any).shareInvite ?? t.share ?? 'SHARE'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Players Roster */}
                <View style={{ width: '100%', flexShrink: 1 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: SPACING.sm,
                        }}
                    >
                        <Text style={[TEXT_STYLES.captionUpper, { color: '#d4b896' }]}>
                            {t.players ?? 'Players'}
                        </Text>
                        <View
                            style={{
                                backgroundColor: 'rgba(90, 64, 37, 0.6)',
                                paddingHorizontal: SPACING.sm,
                                paddingVertical: 2,
                                borderRadius: RADII.pill,
                            }}
                        >
                            <Text style={[TEXT_STYLES.caption, { color: '#ffd700' }]}>
                                {players.length}/10
                            </Text>
                        </View>
                    </View>

                    <View
                        style={{
                            backgroundColor: 'rgba(26, 17, 9, 0.5)',
                            borderRadius: RADII.lg,
                            borderWidth: 1,
                            borderColor: 'rgba(90, 64, 37, 0.5)',
                            padding: SPACING.sm,
                            minHeight: 120,
                            maxHeight: 360,
                        }}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingVertical: SPACING.xs }}
                        >
                            <PlayerList players={players} currentPlayerId={currentPlayerId} />
                            {players.length === 0 && (
                                <View style={{ paddingVertical: SPACING.xxl, alignItems: 'center' }}>
                                    <Text
                                        style={[
                                            TEXT_STYLES.body,
                                            { color: '#d4b896', textAlign: 'center', fontStyle: 'italic' },
                                        ]}
                                    >
                                        {t.waitingForHost ?? 'Waiting for players…'}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>

                {/* Action */}
                <View style={{ width: '100%', marginTop: SPACING.xl }}>
                    {isHost ? (
                        <Animated.View style={pulseAnimatedStyle}>
                            <WoodenButton
                                onPress={handleStart}
                                variant="gold"
                                size="lg"
                                fullWidth
                                accessibilityLabel={t.startGame ?? 'Start the game'}
                            >
                                {t.startGame ?? 'START GAME'}
                            </WoodenButton>
                        </Animated.View>
                    ) : (
                        <View
                            style={{
                                padding: SPACING.lg,
                                backgroundColor: 'rgba(26, 17, 9, 0.5)',
                                borderRadius: RADII.lg,
                                borderWidth: 1,
                                borderColor: '#5a4025',
                                alignItems: 'center',
                            }}
                            accessibilityRole="text"
                        >
                            <Text
                                style={[
                                    TEXT_STYLES.body,
                                    { color: '#d4b896', fontStyle: 'italic', textAlign: 'center' },
                                ]}
                            >
                                {t.waitingForHost ?? 'Waiting for host…'}
                            </Text>
                        </View>
                    )}
                </View>
            </WoodenCard>
        </View>
    );
});
WaitingLobby.displayName = 'WaitingLobby';
