import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { WoodenButton, AnimatedModal } from '@/components/common';
import * as Haptics from 'expo-haptics';
import { Trophy, Share2, X } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { VictoryCard } from './VictoryCard';
import { useGameStore } from '@/lib/store';

interface WinnerModalProps {
    visible: boolean;
    winnerName: string;
    isMe: boolean;
    prize: number;
    onClose: () => void;
    onPlayAgain?: () => void;
}

export const WinnerModal = ({ visible, winnerName, isMe, prize, onClose, onPlayAgain }: WinnerModalProps) => {
    const { playerName, playerAvatar, stats } = useGameStore();
    const [isSharing, setIsSharing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Animation Values
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const trophyAnim = useRef(new Animated.Value(1)).current;
    const viewShotRef = useRef<any>(null);

    useEffect(() => {
        if (visible) {
            // 1. Reset
            scaleAnim.setValue(0);
            trophyAnim.setValue(1);

            // 2. Play Entrance
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }).start();

            // 3. Loop Trophy Bounce
            Animated.loop(
                Animated.sequence([
                    Animated.timing(trophyAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
                    Animated.timing(trophyAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();

            // 4. Haptics
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 800);
        }
    }, [visible, scaleAnim, trophyAnim]);

    const handleShare = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSharing(true);
        try {
            const uri = await viewShotRef.current.capture();
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Share your LOTO victory!',
                UTI: 'public.png',
            });
        } catch (error) {
            console.error('[WinnerModal] Share error:', error);
        } finally {
            setIsSharing(false);
        }
    };

    if (!visible) return null;

    return (
        <>
            <AnimatedModal visible={visible} onClose={onClose} animation="scale" closeOnBackdrop={false}>
                <View className="w-full items-center">
                    <ConfettiCannon
                        count={200}
                        origin={{ x: -10, y: 0 }}
                        autoStart={true}
                        fadeOut={true}
                        fallSpeed={3000}
                    />

                    {/* Glow Effect Background */}
                    <View style={styles.glow} />

                    <Animated.View
                        style={{ transform: [{ scale: scaleAnim }] }}
                        className="w-full max-w-md bg-[#1a1109] border-[6px] border-[#ffd700] rounded-3xl p-8 items-center shadow-2xl relative overflow-hidden"
                    >
                        {/* Metal Shine Overlay */}
                        <View className="absolute -top-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

                        {/* Header Icon */}
                        <Animated.View
                            style={{ transform: [{ scale: trophyAnim }] }}
                            className="mb-6 bg-[#ffd700]/10 p-6 rounded-full border-4 border-[#ffd700] shadow-[0_0_30px_#ffd700]"
                        >
                            <Trophy size={64} color="#ffd700" strokeWidth={2} />
                        </Animated.View>

                        {/* Title */}
                        <Text className="text-[#ffd700] text-5xl font-black uppercase tracking-widest text-center mb-2 italic transform -rotate-2"
                            style={{ textShadowColor: '#b8860b', textShadowOffset: { width: 2, height: 4 }, textShadowRadius: 0 }}>
                            {isMe ? 'BINGO!' : 'WINNER!'}
                        </Text>

                        {/* Winner Name */}
                        <Text className="text-white text-xl font-bold mb-8 text-center uppercase tracking-wider opacity-90">
                            {isMe ? 'You claimed the victory!' : `${winnerName} claimed victory!`}
                        </Text>

                        {/* Prize (if any) */}
                        {prize > 0 && (
                            <View className="bg-gradient-to-r from-black/0 via-black/40 to-black/0 px-8 py-4 rounded-xl border-y border-[#ffd700]/30 flex-row items-center gap-3 mb-8">
                                <Text className="text-3xl">💰</Text>
                                <Text className="text-[#ffd700] text-4xl font-black tracking-tighter" style={{ textShadowColor: '#b8860b', textShadowRadius: 10 }}>{prize}</Text>
                            </View>
                        )}

                        {/* Buttons */}
                        <View className="w-full gap-4">
                            {isMe && (
                                <WoodenButton
                                    variant="gold"
                                    size="md"
                                    fullWidth
                                    onPress={() => setShowPreview(true)}
                                    className="border-2 border-white/20"
                                >
                                    <View className="flex-row items-center gap-2">
                                        <Share2 size={18} color="#3d2814" />
                                        <Text className="text-[#3d2814] font-bold">Share Victory</Text>
                                    </View>
                                </WoodenButton>
                            )}

                            <WoodenButton
                                variant="gold"
                                size="lg"
                                fullWidth
                                onPress={onPlayAgain || onClose}
                                className="shadow-xl"
                            >
                                Play Again
                            </WoodenButton>
                            <WoodenButton
                                variant="secondary"
                                fullWidth
                                onPress={onClose}
                            >
                                Return to Lobby
                            </WoodenButton>
                        </View>

                    </Animated.View>
                </View>
            </AnimatedModal>

            {/* Victory Card Preview & Share Modal */}
            <Modal visible={showPreview} transparent animationType="fade">
                <View className="flex-1 bg-black/90 items-center justify-center p-6">
                    <TouchableOpacity
                        className="absolute top-10 right-6 bg-black/50 p-2 rounded-full z-50 border border-white/20"
                        onPress={() => setShowPreview(false)}
                    >
                        <X color="#fff" size={24} />
                    </TouchableOpacity>

                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
                        <VictoryCard
                            playerName={playerName || 'Lucky Player'}
                            playerAvatar={playerAvatar}
                            prize={prize}
                            level={Math.floor(stats.xp / 100) + 1}
                            date={new Date().toLocaleDateString()}
                        />
                    </ViewShot>

                    <View className="mt-10 w-full max-w-xs">
                        <WoodenButton
                            onPress={handleShare}
                            variant="gold"
                            size="lg"
                            fullWidth
                            disabled={isSharing}
                        >
                            {isSharing ? 'Generating...' : 'SHARE NOW'}
                        </WoodenButton>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    glow: {
        position: 'absolute',
        width: 300,
        height: 300,
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        borderRadius: 150,
        shadowColor: '#ffd700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 100,
        elevation: 0, // Android handling requires distinct approach if using elevation
        transform: [{ scale: 1.5 }],
    },
});
