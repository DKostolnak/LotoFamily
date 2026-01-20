import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { WoodenButton, WoodenCard } from './common';
import { useP2PGame } from '@/lib/p2p/P2PContext';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { X, Users, Globe, Lock, ShieldCheck } from 'lucide-react-native';

interface LocalGameModalProps {
    visible: boolean;
    onClose: () => void;
}

export const LocalGameModal: React.FC<LocalGameModalProps> = ({ visible, onClose }) => {
    const router = useRouter();
    const { language, playerName, playerAvatar } = useGameStore();
    const { createRoom, joinRoom, error, clearError } = useP2PGame();
    const t = translations[language];

    const [mode, setMode] = useState<'selection' | 'host' | 'join'>('selection');
    const [roomCode, setRoomCode] = useState('');
    const [localName, setLocalName] = useState(playerName || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleHost = async () => {
        if (localName.length < 2) return;
        setIsLoading(true);
        try {
            await createRoom(localName, playerAvatar);
            router.push({ pathname: '/game', params: { mode: 'p2p' } });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async () => {
        if (localName.length < 2 || roomCode.length < 4) return;
        setIsLoading(true);
        try {
            await joinRoom(roomCode, localName, playerAvatar);
            router.push({ pathname: '/game', params: { mode: 'p2p' } });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const renderSelection = () => (
        <View className="gap-4">
            <Text className="text-[#8b6b4a] text-center mb-4 text-sm font-medium">
                Play Loto over local WiFi. Perfect for when the internet is out!
            </Text>

            <WoodenButton
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setMode('host'); }}
                variant="gold"
                fullWidth
            >
                <View className="flex-row items-center gap-3">
                    <Globe size={20} color="#3d2814" />
                    <Text className="text-[#3d2814] font-black text-lg uppercase">Host Local Game</Text>
                </View>
            </WoodenButton>

            <WoodenButton
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setMode('join'); }}
                variant="info"
                fullWidth
            >
                <View className="flex-row items-center gap-3">
                    <Users size={20} color="#fff" />
                    <Text className="text-white font-bold text-lg uppercase">Join Local Game</Text>
                </View>
            </WoodenButton>
        </View>
    );

    const renderHostForm = () => (
        <View className="gap-5">
            <View>
                <Text className="text-[#8b6b4a] text-[10px] font-bold uppercase mb-2 ml-1">Your Name</Text>
                <TextInput
                    value={localName}
                    onChangeText={setLocalName}
                    placeholder="Enter name"
                    placeholderTextColor="#5a4025"
                    className="bg-[#1a1109] border-2 border-[#3d2814] rounded-xl p-4 text-[#e8d4b8] font-bold text-lg"
                />
            </View>

            <View className="bg-[#2d1f10] p-4 rounded-xl border border-[#5a4025]/30">
                <View className="flex-row items-center gap-2 mb-2">
                    <ShieldCheck size={16} color="#4ade80" />
                    <Text className="text-[#4ade80] font-bold text-xs uppercase">Local Security</Text>
                </View>
                <Text className="text-[#8b6b4a] text-[10px]">
                    Players on the same WiFi network can join using your generated 4-letter code.
                </Text>
            </View>

            <WoodenButton
                onPress={handleHost}
                variant="gold"
                disabled={localName.length < 2 || isLoading}
                fullWidth
            >
                <Text className="text-[#3d2814] font-black text-lg uppercase">
                    {isLoading ? 'Creating...' : 'Create Room'}
                </Text>
            </WoodenButton>
        </View>
    );

    const renderJoinForm = () => (
        <View className="gap-5">
            <View>
                <Text className="text-[#8b6b4a] text-[10px] font-bold uppercase mb-2 ml-1">Room Code</Text>
                <TextInput
                    value={roomCode}
                    onChangeText={(t) => setRoomCode(t.toUpperCase())}
                    placeholder="ABCD"
                    placeholderTextColor="#5a4025"
                    maxLength={4}
                    className="bg-[#1a1109] border-2 border-[#3d2814] rounded-xl p-4 text-[#ffd700] font-black text-3xl text-center tracking-[8px]"
                />
            </View>

            <View>
                <Text className="text-[#8b6b4a] text-[10px] font-bold uppercase mb-2 ml-1">Your Name</Text>
                <TextInput
                    value={localName}
                    onChangeText={setLocalName}
                    placeholder="Enter name"
                    placeholderTextColor="#5a4025"
                    className="bg-[#1a1109] border-2 border-[#3d2814] rounded-xl p-4 text-[#e8d4b8] font-bold text-lg"
                />
            </View>

            <WoodenButton
                onPress={handleJoin}
                variant="info"
                disabled={localName.length < 2 || roomCode.length < 4 || isLoading}
                fullWidth
            >
                <Text className="text-white font-bold text-lg uppercase">
                    {isLoading ? 'Joining...' : 'Join Room'}
                </Text>
            </WoodenButton>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/80 items-center justify-center p-4">
                <WoodenCard
                    title={mode === 'selection' ? 'WiFi Multiplayer' : mode === 'host' ? 'Host Game' : 'Join Game'}
                    showBackArrow={mode !== 'selection'}
                    onBack={() => { Haptics.selectionAsync(); setMode('selection'); clearError(); }}
                    className="w-full max-w-md"
                >
                    <TouchableOpacity
                        onPress={onClose}
                        className="absolute right-0 -top-12 bg-[#3d2814] w-10 h-10 rounded-full items-center justify-center border border-[#5a4025]"
                    >
                        <X size={20} color="#e8d4b8" />
                    </TouchableOpacity>

                    {error && (
                        <View className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg mb-4">
                            <Text className="text-red-300 text-xs text-center">{error}</Text>
                        </View>
                    )}

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {mode === 'selection' ? renderSelection() : mode === 'host' ? renderHostForm() : renderJoinForm()}
                    </ScrollView>
                </WoodenCard>
            </View>
        </Modal>
    );
};
