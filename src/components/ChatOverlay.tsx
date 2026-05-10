import React, { useState, useRef } from 'react';
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
import { MessageSquare, Send, X } from 'lucide-react-native';
import { ChatMessage } from '@/hooks/useGameSocket';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface ChatOverlayProps {
    messages: ChatMessage[];
    onSendMessage?: (msg: string) => void;
    currentPlayerId: string;
}

const SEND_BUTTON_SIZE = 44; // min tap target.

export const ChatOverlay = ({ messages, onSendMessage, currentPlayerId }: ChatOverlayProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);
    const language = useGameStore((s) => s.language);
    const t = translations[language];

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
                    <Text style={[TEXT_STYLES.captionUpper, { color: '#ffd700' }]}>
                        {t.chatTitle ?? 'CHAT'}
                    </Text>
                    <TouchableOpacity
                        onPress={toggleChat}
                        accessibilityRole="button"
                        accessibilityLabel={t.close ?? 'Close'}
                        hitSlop={8}
                    >
                        <X size={18} color="#d4b896" />
                    </TouchableOpacity>
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
                    {messages.length === 0 && (
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
                    {messages.map((msg, i) => {
                        const isMe = msg.userId === currentPlayerId;
                        return (
                            <View
                                key={`${msg.timestamp}-${i}`}
                                style={{
                                    marginBottom: SPACING.md,
                                    maxWidth: '85%',
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                }}
                            >
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
                                <View
                                    style={{
                                        padding: SPACING.md,
                                        borderRadius: RADII.lg,
                                        backgroundColor: isMe ? '#ffd700' : '#f5e6c8',
                                        borderTopRightRadius: isMe ? RADII.sm : RADII.lg,
                                        borderTopLeftRadius: isMe ? RADII.lg : RADII.sm,
                                    }}
                                >
                                    <Text
                                        style={[
                                            TEXT_STYLES.body,
                                            { color: isMe ? '#3d2814' : '#2d1f10' },
                                        ]}
                                    >
                                        {msg.message}
                                    </Text>
                                </View>
                            </View>
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
                        placeholderTextColor="#8b6b4a"
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
                    {messages.length > 0 && (
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
                            <Text style={[TEXT_STYLES.caption, { color: 'white' }]}>
                                {messages.length > 9 ? '9+' : messages.length}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}
        </KeyboardAvoidingView>
    );
};
