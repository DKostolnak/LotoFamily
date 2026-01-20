import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { MessageSquare, Send, X } from 'lucide-react-native';
import { ChatMessage } from '@/hooks/useGameSocket';

interface ChatOverlayProps {
    messages: ChatMessage[];
    onSendMessage?: (msg: string) => void;
    currentPlayerId: string;
}

export const ChatOverlay = ({ messages, onSendMessage, currentPlayerId }: ChatOverlayProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

    const height = useSharedValue(0);
    const opacity = useSharedValue(0);

    const toggleChat = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        height.value = withSpring(nextState ? 300 : 0);
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
            className="absolute bottom-4 right-4 z-50 items-end"
        >
            {/* Chat Window */}
            <Animated.View
                style={[animatedContainerStyle]}
                className="bg-[#2d1f10] w-72 rounded-2xl border-2 border-[#d4b075] overflow-hidden mb-2 shadow-2xl"
            >
                {/* Header */}
                <View className="bg-[#1a1109] px-4 py-2 border-b border-[#d4b075]/20 flex-row justify-between items-center">
                    <Text className="text-[#d4b075] font-bold uppercase tracking-widest text-xs">Room Chat</Text>
                    <TouchableOpacity onPress={toggleChat}>
                        <X size={16} color="#d4b075" />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 px-3 py-2"
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((msg, i) => (
                        <View
                            key={`${msg.timestamp}-${i}`}
                            className={`mb-2 max-w-[85%] ${msg.userId === currentPlayerId ? 'self-end' : 'self-start'}`}
                        >
                            <View className={`p-2 rounded-xl ${msg.userId === currentPlayerId ? 'bg-[#d4b075] rounded-tr-none' : 'bg-[#3d2814] rounded-tl-none border border-[#d4b075]/10'}`}>
                                <Text className={`text-[10px] font-bold mb-0.5 ${msg.userId === currentPlayerId ? 'text-[#2d1f10]' : 'text-[#d4b075]'}`}>
                                    {msg.nickname}
                                </Text>
                                <Text className={`text-sm ${msg.userId === currentPlayerId ? 'text-[#1a1109]' : 'text-[#f5e6c8]'}`}>
                                    {msg.message}
                                </Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Input */}
                <View className="p-2 bg-[#1a1109] border-t border-[#d4b075]/20 flex-row gap-2 items-center">
                    <TextInput
                        value={inputValue}
                        onChangeText={setInputValue}
                        placeholder="Type a message..."
                        placeholderTextColor="#a6814c80"
                        className="flex-1 bg-[#2d1f10] text-[#f5e6c8] px-3 py-2 rounded-lg text-sm"
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        className="bg-[#d4b075] p-2 rounded-lg"
                    >
                        <Send size={16} color="#1a1109" />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Toggle Button */}
            {!isOpen && (
                <TouchableOpacity
                    onPress={toggleChat}
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.5,
                        shadowRadius: 5,
                        elevation: 10
                    }}
                    className="bg-[#d4b075] p-4 rounded-full border-b-4 border-[#a6814c]"
                >
                    <MessageSquare size={24} color="#1a1109" />
                    {messages.length > 0 && (
                        <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center border-2 border-[#1a1109]">
                            <Text className="text-white text-[10px] font-bold">{messages.length > 9 ? '9+' : messages.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}
        </KeyboardAvoidingView>
    );
};
