import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Gift, MessageSquare, MoreVertical, Send, X } from 'lucide-react-native';
import { ChatMessage, Player } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { ModalShell, WoodenButton } from '@/components/common';
import { useToast } from '@/components/ToastProvider';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';
import { sendGift, type GiftAmount } from '@/lib/services/gifts';
import { ModerationActionModal } from './moderation/ModerationActionModal';

interface ChatOverlayProps {
    messages: ChatMessage[];
    onSendMessage?: (msg: string) => void;
    currentPlayerId: string;
    players?: Player[];
    roomCode?: string | null;
}

const SEND_BUTTON_SIZE = 44; // min tap target.
const GIFT_AMOUNTS = [50, 100, 500] as const satisfies readonly GiftAmount[];

const formatTemplate = (template: string, values: Record<string, string>) =>
    Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);

const extractGiftAmount = (message: string): GiftAmount | null => {
    const match = message.match(/\b(50|100|500)\b/);
    if (!match) return null;
    return Number(match[1]) as GiftAmount;
};

export const ChatOverlay = ({ messages, onSendMessage, currentPlayerId, players = [], roomCode }: ChatOverlayProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [giftVisible, setGiftVisible] = useState(false);
    const [giftRecipient, setGiftRecipient] = useState<Player | null>(null);
    const [giftSending, setGiftSending] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const lastSeenGiftTimestampRef = useRef<number | null>(null);
    const language = useGameStore((s) => s.language);
    const coins = useGameStore((s) => s.coins);
    const playerName = useGameStore((s) => s.playerName);
    const blockedUserIds = useGameStore((s) => s.blockedUserIds);
    const t = translations[language];
    const { showToast } = useToast();

    const giftRecipients = useMemo(
        () => players.filter((player) => player.id !== currentPlayerId),
        [currentPlayerId, players]
    );

    const currentPlayerName = useMemo(() => {
        return players.find((player) => player.id === currentPlayerId)?.name || playerName || t.playerName;
    }, [currentPlayerId, playerName, players, t.playerName]);

    const visibleMessages = useMemo(
        () => messages.filter((message) => !blockedUserIds.includes(message.userId)),
        [blockedUserIds, messages]
    );

    const height = useSharedValue(0);
    const opacity = useSharedValue(0);

    const toggleChat = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        height.value = withSpring(nextState ? 320 : 0);
        opacity.value = withSpring(nextState ? 1 : 0);
    };

    const handleSend = () => {
        if (!inputValue.trim() || !onSendMessage) return;
        onSendMessage(inputValue.trim());
        setInputValue('');
    };

    const closeGiftModal = () => {
        setGiftVisible(false);
        setGiftRecipient(null);
        setGiftSending(false);
    };

    const handleSendGift = async (amount: GiftAmount) => {
        if (!giftRecipient || giftSending) return;
        if (coins < amount) {
            showToast(t.giftNotEnough, 'error');
            return;
        }

        setGiftSending(true);
        const result = await sendGift(giftRecipient.id, amount);
        setGiftSending(false);

        if (!result.success || result.newBalance === undefined) {
            const errorMessage = result.error === 'gift_limit_reached'
                ? t.giftLimit
                : result.error === 'insufficient_funds'
                    ? t.giftNotEnough
                    : t.connectionError;
            showToast(errorMessage, 'error');
            return;
        }

        useGameStore.setState({ coins: result.newBalance });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(formatTemplate(t.giftSent, { name: giftRecipient.name }), 'success', '🎁');
        onSendMessage?.(formatTemplate(t.giftSystemMessage, {
            sender: currentPlayerName,
            amount: String(amount),
            recipient: giftRecipient.name,
        }));
        closeGiftModal();
    };

    useEffect(() => {
        const latestTimestamp = messages.reduce((latest, message) => Math.max(latest, message.timestamp), 0);
        if (lastSeenGiftTimestampRef.current === null) {
            lastSeenGiftTimestampRef.current = latestTimestamp;
            return;
        }

        const newGift = messages
            .filter((message) => message.timestamp > (lastSeenGiftTimestampRef.current ?? 0))
            .find((message) => {
                return message.userId !== currentPlayerId &&
                    message.message.startsWith('🎁') &&
                    currentPlayerName.length > 0 &&
                    message.message.includes(currentPlayerName) &&
                    extractGiftAmount(message.message) !== null;
            });

        if (newGift) {
            const amount = extractGiftAmount(newGift.message);
            if (amount !== null) {
                showToast(formatTemplate(t.giftReceived, {
                    name: newGift.nickname,
                    n: String(amount),
                }), 'success', '🎁');
            }
        }

        lastSeenGiftTimestampRef.current = latestTimestamp;
    }, [currentPlayerId, currentPlayerName, messages, showToast, t.giftReceived]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        height: height.value,
        opacity: opacity.value,
    }));

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{
                position: 'absolute',
                bottom: SPACING.lg,
                right: SPACING.lg,
                zIndex: 50,
                alignItems: 'flex-end',
            }}
        >
            {/* Chat Window */}
            <Animated.View
                style={[
                    animatedContainerStyle,
                    {
                        backgroundColor: '#2d1f10',
                        width: 300,
                        borderRadius: RADII.xl,
                        borderWidth: 2,
                        borderColor: '#5a4025',
                        overflow: 'hidden',
                        marginBottom: SPACING.sm,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.5,
                        shadowRadius: 16,
                        elevation: 12,
                    },
                ]}
            >
                {/* Header */}
                <View
                    style={{
                        backgroundColor: '#1a1109',
                        paddingHorizontal: SPACING.lg,
                        paddingVertical: SPACING.md,
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(90, 64, 37, 0.6)',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Text
                        style={[TEXT_STYLES.captionUpper, { color: '#ffd700', flex: 1 }]}
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.2}
                    >
                        {t.chatTitle ?? 'CHAT'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                        {giftRecipients.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setGiftVisible(true)}
                                accessibilityRole="button"
                                accessibilityLabel={t.giftButton}
                                style={{
                                    width: 44,
                                    height: 44,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: RADII.md,
                                    backgroundColor: 'rgba(255, 215, 0, 0.12)',
                                }}
                            >
                                <Gift size={20} color="#ffd700" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={toggleChat}
                            accessibilityRole="button"
                            accessibilityLabel={t.close ?? 'Close'}
                            style={{
                                width: 44,
                                height: 44,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <X size={18} color="#d4b896" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingHorizontal: SPACING.md,
                        paddingVertical: SPACING.sm,
                    }}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {visibleMessages.length === 0 && (
                        <View
                            style={{
                                flex: 1,
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: SPACING.xxl,
                                paddingHorizontal: SPACING.lg,
                            }}
                        >
                            <MessageSquare size={32} color="#d4b896" strokeWidth={1.5} opacity={0.5} />
                            <Text
                                style={[
                                    TEXT_STYLES.captionUpper,
                                    { color: '#d4b896', marginTop: SPACING.md, textAlign: 'center' },
                                ]}
                            >
                                {t.noChatMessages ?? 'NO MESSAGES YET'}
                            </Text>
                            <Text
                                style={[
                                    TEXT_STYLES.caption,
                                    {
                                        color: '#d4b896',
                                        textAlign: 'center',
                                        marginTop: SPACING.xs,
                                        maxWidth: 220,
                                    },
                                ]}
                            >
                                {t.noChatMessagesDesc ?? 'Be the first to say hi!'}
                            </Text>
                        </View>
                    )}
                    {visibleMessages.map((msg, i) => {
                        const isMe = msg.userId === currentPlayerId;
                        const isGiftSystem = msg.message.startsWith('🎁');
                        return (
                            <TouchableOpacity
                                key={`${msg.timestamp}-${i}`}
                                onLongPress={isMe ? undefined : () => setSelectedMessage(msg)}
                                activeOpacity={isMe ? 1 : 0.86}
                                disabled={isMe}
                                style={{
                                    marginBottom: SPACING.md,
                                    maxWidth: isGiftSystem ? '92%' : '85%',
                                    alignSelf: isGiftSystem ? 'center' : isMe ? 'flex-end' : 'flex-start',
                                }}
                            >
                                {!isGiftSystem && (
                                    <Text
                                        style={[
                                            TEXT_STYLES.captionUpper,
                                            {
                                                color: isMe ? '#ffd700' : '#d4b896',
                                                marginBottom: 2,
                                                paddingHorizontal: SPACING.sm,
                                                textAlign: isMe ? 'right' : 'left',
                                            },
                                        ]}
                                    >
                                        {msg.nickname}
                                    </Text>
                                )}
                                <View
                                    style={{
                                        padding: SPACING.md,
                                        paddingRight: isMe ? SPACING.md : 48,
                                        borderRadius: RADII.lg,
                                        backgroundColor: isGiftSystem ? '#3d2814' : isMe ? '#ffd700' : '#f5e6c8',
                                        borderTopRightRadius: isMe ? RADII.sm : RADII.lg,
                                        borderTopLeftRadius: isMe ? RADII.lg : RADII.sm,
                                        borderWidth: isGiftSystem ? 1 : 0,
                                        borderColor: isGiftSystem ? 'rgba(255, 215, 0, 0.45)' : 'transparent',
                                        position: 'relative',
                                    }}
                                >
                                    <Text
                                        style={[
                                            TEXT_STYLES.body,
                                            {
                                                color: isGiftSystem ? '#ffd700' : isMe ? '#3d2814' : '#2d1f10',
                                                textAlign: isGiftSystem ? 'center' : 'left',
                                            },
                                        ]}
                                        maxFontSizeMultiplier={1.2}
                                    >
                                        {msg.message}
                                    </Text>
                                    {!isMe && (
                                        <TouchableOpacity
                                            onPress={() => setSelectedMessage(msg)}
                                            accessibilityRole="button"
                                            accessibilityLabel={t.reportPlayer}
                                            hitSlop={4}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                width: 44,
                                                height: 44,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <MoreVertical size={18} color="#2d1f10" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Input row */}
                <View
                    style={{
                        padding: SPACING.sm,
                        backgroundColor: '#1a1109',
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(90, 64, 37, 0.6)',
                        flexDirection: 'row',
                        gap: SPACING.sm,
                        alignItems: 'center',
                    }}
                >
                    <TextInput
                        value={inputValue}
                        onChangeText={setInputValue}
                        placeholder={t.typeMessage ?? 'Type a message…'}
                        placeholderTextColor="#d4b896"
                        style={[
                            TEXT_STYLES.body,
                            {
                                flex: 1,
                                backgroundColor: '#2d1f10',
                                color: '#f5e6c8',
                                paddingHorizontal: SPACING.md,
                                paddingVertical: SPACING.sm,
                                borderRadius: RADII.md,
                                minHeight: SEND_BUTTON_SIZE,
                            },
                        ]}
                        onSubmitEditing={handleSend}
                        accessibilityLabel={t.typeMessage ?? 'Type a message'}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        accessibilityRole="button"
                        accessibilityLabel={t.share ?? 'Send'}
                        style={{
                            width: SEND_BUTTON_SIZE,
                            height: SEND_BUTTON_SIZE,
                            backgroundColor: '#ffd700',
                            borderRadius: RADII.md,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Send size={20} color="#1a1109" />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Toggle Button */}
            {!isOpen && (
                <TouchableOpacity
                    onPress={toggleChat}
                    accessibilityRole="button"
                    accessibilityLabel={t.chatTitle ?? 'Chat'}
                    style={{
                        width: 56,
                        height: 56,
                        backgroundColor: '#ffd700',
                        borderRadius: RADII.pill,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottomWidth: 4,
                        borderColor: '#b8860b',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.5,
                        shadowRadius: 5,
                        elevation: 10,
                    }}
                >
                    <MessageSquare size={24} color="#1a1109" />
                    {visibleMessages.length > 0 && (
                        <View
                            style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                backgroundColor: '#ef4444',
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 2,
                                borderColor: '#1a1109',
                            }}
                        >
                            <Text style={[TEXT_STYLES.caption, { color: 'white' }]} maxFontSizeMultiplier={1.2}>
                                {visibleMessages.length > 9 ? '9+' : visibleMessages.length}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}

            <ModalShell
                visible={giftVisible}
                onClose={closeGiftModal}
                title={t.giftTitle}
                closeAccessibilityLabel={t.close}
                maxWidth={420}
            >
                {!giftRecipient ? (
                    <View style={{ gap: SPACING.sm }}>
                        {giftRecipients.map((player) => (
                            <WoodenButton
                                key={player.id}
                                size="md"
                                variant="secondary"
                                fullWidth
                                onPress={() => setGiftRecipient(player)}
                                accessibilityLabel={`${t.giftButton}: ${player.name}`}
                            >
                                {`${player.avatar} ${player.name}`}
                            </WoodenButton>
                        ))}
                    </View>
                ) : (
                    <View style={{ gap: SPACING.sm }}>
                        <Text
                            style={[TEXT_STYLES.bodyBold, { color: '#f5e6c8', textAlign: 'center' }]}
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.2}
                        >
                            {`${giftRecipient.avatar} ${giftRecipient.name}`}
                        </Text>
                        {GIFT_AMOUNTS.map((amount) => {
                            const disabled = giftSending || coins < amount;
                            return (
                                <WoodenButton
                                    key={amount}
                                    size="md"
                                    variant="gold"
                                    fullWidth
                                    disabled={disabled}
                                    onPress={() => handleSendGift(amount)}
                                    accessibilityLabel={String(amount)}
                                    accessibilityHint={coins < amount ? t.giftNotEnough : undefined}
                                >
                                    {amount}
                                </WoodenButton>
                            );
                        })}
                    </View>
                )}
            </ModalShell>

            <ModerationActionModal
                visible={!!selectedMessage}
                targetUserId={selectedMessage?.userId ?? null}
                targetName={selectedMessage?.nickname}
                roomCode={roomCode}
                message={selectedMessage?.message}
                onClose={() => setSelectedMessage(null)}
            />
        </KeyboardAvoidingView>
    );
};
