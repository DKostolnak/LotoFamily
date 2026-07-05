import React, { memo, useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    cancelAnimation,
    Easing,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { WoodenCard, HeroCTAButton } from '@/components/common';
import { PlayerList } from './PlayerList';
import { FriendsModal } from './FriendsModal';
import { Player } from '@/lib/types';
import { ChatMessage } from '@/lib/types';
import { Copy, Share2, Clock, Users } from 'lucide-react-native';
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
    enableFriends?: boolean;
    t: TranslationKeys;
}

export const WaitingLobby = memo(({
    roomCode,
    players,
    currentPlayerId,
    isHost,
    onStart,
    onLeave,
    enableFriends = false,
    t,
}: WaitingLobbyProps) => {
    const [copied, setCopied] = useState(false);
    const [friendsOpen, setFriendsOpen] = useState(false);

    // Non-host waiting card — gentle breathing pulse so the layout doesn't
    // feel collapsed compared to the host's hero CTA.
    const waitingScale = useSharedValue(1);
    useEffect(() => {
        if (!isHost) {
            waitingScale.value = withRepeat(
                withSequence(
                    withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
                false,
            );
        } else {
            cancelAnimation(waitingScale);
            waitingScale.value = withTiming(1, { duration: 200 });
        }
        return () => cancelAnimation(waitingScale);
    }, [isHost, waitingScale]);
    const waitingAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: waitingScale.value }],
    }));

    const handleShare = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const url = Linking.createURL('/', { queryParams: { room: roomCode } });
            const message = `${t.joinMyGame ?? 'Join my Loto game!'} ${url}`;
            await Share.share({
                message,
                url,
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

    const canStart = isHost && players.length >= 1;

    return (
        <View style={{ flex: 1, paddingHorizontal: SPACING.lg, justifyContent: 'center', alignItems: 'center' }}>
            <WoodenCard
                title={t.lobbyTitle ?? 'Waiting Lobby'}
                showBackArrow
                onBack={onLeave}
                style={{ maxHeight: '94%' }}
            >
                {/* Room Code Hero */}
                <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
                    <Text
                        style={[
                            TEXT_STYLES.captionUpper,
                            { color: '#d4b896', marginBottom: SPACING.sm, textAlign: 'center', letterSpacing: 3 },
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
                            minHeight: 110,
                            backgroundColor: '#1a1109',
                            borderRadius: RADII.lg,
                            borderWidth: 2,
                            borderColor: 'rgba(255, 215, 0, 0.5)',
                            paddingVertical: SPACING.xl,
                            paddingHorizontal: SPACING.xl,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#ffd700',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.35,
                            shadowRadius: 12,
                            elevation: 6,
                        }}
                    >
                        <Text
                            style={{
                                color: '#ffd700',
                                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                                fontSize: 42,
                                fontWeight: '900',
                                letterSpacing: 6,
                                textAlign: 'center',
                                textShadowColor: 'rgba(255,215,0,0.55)',
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 16,
                            }}
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
                            <Copy size={12} color="#d4b896" />
                            <Text style={[TEXT_STYLES.captionUpper, { color: '#d4b896', letterSpacing: 1.5 }]}>
                                {copied ? (t.copied ?? 'Copied') : (t.tapToCopy ?? 'Tap to copy')}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md, justifyContent: 'center' }}>
                        {/* Share invite as wooden pill chip */}
                        <TouchableOpacity
                            onPress={handleShare}
                            accessibilityRole="button"
                            accessibilityLabel={t.share ?? 'Share'}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: SPACING.sm,
                                paddingVertical: SPACING.sm,
                                paddingHorizontal: SPACING.lg,
                                borderRadius: RADII.pill,
                                borderWidth: 1,
                                borderColor: 'rgba(255, 215, 0, 0.4)',
                                backgroundColor: 'rgba(255, 215, 0, 0.06)',
                                minHeight: 44,
                            }}
                            hitSlop={8}
                        >
                            <Share2 size={14} color="#ffd700" />
                            <Text style={[TEXT_STYLES.button, { color: '#ffd700', fontSize: 12 }]} maxFontSizeMultiplier={1.2}>
                                {(t as any).shareInvite ?? t.share ?? 'SHARE INVITE'}
                            </Text>
                        </TouchableOpacity>

                        {enableFriends ? (
                            <TouchableOpacity
                                onPress={() => setFriendsOpen(true)}
                                accessibilityRole="button"
                                accessibilityLabel={t.friendsTitle}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: SPACING.sm,
                                    paddingVertical: SPACING.sm,
                                    paddingHorizontal: SPACING.lg,
                                    borderRadius: RADII.pill,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 215, 0, 0.4)',
                                    backgroundColor: 'rgba(255, 215, 0, 0.06)',
                                    minHeight: 44,
                                }}
                                hitSlop={8}
                            >
                                <Users size={14} color="#ffd700" />
                                <Text style={[TEXT_STYLES.button, { color: '#ffd700', fontSize: 12 }]} maxFontSizeMultiplier={1.2}>
                                    {t.friendsTitle}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
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
                        <Text style={[TEXT_STYLES.captionUpper, { color: '#ffd700', letterSpacing: 2 }]}>
                            {t.players ?? 'Players'}
                        </Text>
                        <View
                            style={{
                                backgroundColor: 'rgba(255, 215, 0, 0.15)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 215, 0, 0.4)',
                                paddingHorizontal: SPACING.sm,
                                paddingVertical: 2,
                                borderRadius: RADII.pill,
                            }}
                        >
                            <Text style={[TEXT_STYLES.caption, { color: '#ffd700', fontWeight: '900' }]}>
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
                            minHeight: 100,
                            maxHeight: 280,
                        }}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingVertical: SPACING.xs }}
                        >
                            <PlayerList
                                players={players}
                                currentPlayerId={currentPlayerId}
                                showFriendActions={enableFriends}
                            />
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

                {enableFriends ? (
                    <FriendsModal
                        visible={friendsOpen}
                        onClose={() => setFriendsOpen(false)}
                        roomCode={roomCode}
                    />
                ) : null}

                {/* Action — Hero CTA */}
                <View style={{ width: '100%', marginTop: SPACING.xl }}>
                    {isHost ? (
                        <HeroCTAButton
                            title={t.startGame ?? 'START GAME'}
                            subtitle={
                                canStart
                                    ? ((t as any).beginTheRound ?? 'Begin the round')
                                    : ((t as any).waitingForPlayers ?? 'Waiting for players…')
                            }
                            onPress={handleStart}
                            variant="gold"
                            pulse={canStart}
                            glow={canStart}
                            disabled={!canStart}
                            accessibilityLabel={t.startGame ?? 'Start the game'}
                        />
                    ) : (
                        <Animated.View
                            style={[
                                waitingAnimatedStyle,
                                {
                                    height: 92,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingHorizontal: SPACING.xl,
                                    backgroundColor: 'rgba(26, 17, 9, 0.65)',
                                    borderRadius: RADII.xl,
                                    borderWidth: 2,
                                    borderColor: 'rgba(255, 215, 0, 0.35)',
                                    gap: SPACING.md,
                                },
                            ]}
                            accessibilityRole="text"
                        >
                            <Clock size={28} color="#ffd700" />
                            <View style={{ flexShrink: 1 }}>
                                <Text
                                    style={[
                                        TEXT_STYLES.buttonLarge,
                                        { color: '#ffd700', fontSize: 18, letterSpacing: 1 },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {(t as any).waitingTitle ?? 'WAITING…'}
                                </Text>
                                <Text
                                    style={{
                                        color: '#d4b896',
                                        fontSize: 12,
                                        fontWeight: '600',
                                        marginTop: 2,
                                    }}
                                    numberOfLines={1}
                                >
                                    {t.waitingForHost ?? 'Waiting for host to start…'}
                                </Text>
                            </View>
                        </Animated.View>
                    )}
                </View>
            </WoodenCard>
        </View>
    );
});
WaitingLobby.displayName = 'WaitingLobby';
