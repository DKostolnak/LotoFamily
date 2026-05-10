import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    withDelay,
    cancelAnimation,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { X } from 'lucide-react-native';

import {
    WoodenButton,
    AnimatedModal,
    RewardChip,
    CelebrationConfetti,
} from '@/components/common';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import {
    TEXT_STYLES,
    SPACING,
    RADII,
    k_colorGold,
    k_colorText,
    k_colorTextMuted,
    k_colorWoodLight,
    k_colorWoodDark,
} from '@/lib/config';
import { audioService } from '@/lib/services/audio';
import { VictoryCard } from './VictoryCard';

interface WinnerModalProps {
    visible: boolean;
    winnerName: string;
    isMe: boolean;
    prize: number;
    onClose: () => void;
    onPlayAgain?: () => void;
    /** Optional XP gained this round, shown as a chip if > 0 */
    xpGained?: number;
    /** Optional level-before to display "Lv N → Lv N+1" if it differs from current */
    previousLevel?: number;
}

const computeLevel = (xp: number) => Math.floor(xp / 100) + 1;

export const WinnerModal = ({
    visible,
    winnerName,
    isMe,
    prize,
    onClose,
    onPlayAgain,
    xpGained,
    previousLevel,
}: WinnerModalProps) => {
    const { playerName, playerAvatar, stats, language } = useGameStore() as any;
    const t = translations[(language as keyof typeof translations) ?? 'en'] ?? translations.en;

    const [isSharing, setIsSharing] = useState(false);
    const [showShareSheet, setShowShareSheet] = useState(false);
    const shareRef = useRef<View>(null);

    // Reanimated shared values — deterministic, no infinite loops
    const trophyScale = useSharedValue(0);
    const trophyPulse = useSharedValue(1);
    const titleOpacity = useSharedValue(0);
    const titleTranslateY = useSharedValue(12);
    const cardOpacity = useSharedValue(0);
    const cardTranslateY = useSharedValue(16);
    const chipOpacity = useSharedValue(0);
    const buttonsOpacity = useSharedValue(0);

    const trophyStyle = useAnimatedStyle(() => ({
        transform: [{ scale: trophyScale.value * trophyPulse.value }],
    }));
    const titleStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateY: titleTranslateY.value }],
    }));
    const cardStyle = useAnimatedStyle(() => ({
        opacity: cardOpacity.value,
        transform: [{ translateY: cardTranslateY.value }],
    }));
    const chipStyle = useAnimatedStyle(() => ({ opacity: chipOpacity.value }));
    const buttonsStyle = useAnimatedStyle(() => ({ opacity: buttonsOpacity.value }));

    useEffect(() => {
        if (!visible) {
            return;
        }

        // Reset
        trophyScale.value = 0;
        trophyPulse.value = 1;
        titleOpacity.value = 0;
        titleTranslateY.value = 12;
        cardOpacity.value = 0;
        cardTranslateY.value = 16;
        chipOpacity.value = 0;
        buttonsOpacity.value = 0;

        // Mount sequence (deterministic, no withRepeat)
        // Trophy pop @ 200ms
        trophyScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 140 }));
        // Trophy two-bounce ambient pulse (then settles), no infinite loop
        trophyPulse.value = withDelay(
            1100,
            withSequence(
                withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
            ),
        );
        // Title @ 400ms
        titleOpacity.value = withDelay(400, withTiming(1, { duration: 350 }));
        titleTranslateY.value = withDelay(400, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
        // Winner card @ 600ms
        cardOpacity.value = withDelay(600, withTiming(1, { duration: 350 }));
        cardTranslateY.value = withDelay(600, withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) }));
        // Reward chips @ 800ms
        chipOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
        // Buttons @ 1200ms
        buttonsOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));

        // Haptic + sound
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        audioService.playSound('win').catch(() => { });

        return () => {
            cancelAnimation(trophyScale);
            cancelAnimation(trophyPulse);
            cancelAnimation(titleOpacity);
            cancelAnimation(titleTranslateY);
            cancelAnimation(cardOpacity);
            cancelAnimation(cardTranslateY);
            cancelAnimation(chipOpacity);
            cancelAnimation(buttonsOpacity);
        };
    }, [
        visible,
        trophyScale,
        trophyPulse,
        titleOpacity,
        titleTranslateY,
        cardOpacity,
        cardTranslateY,
        chipOpacity,
        buttonsOpacity,
    ]);

    const handlePlayAgain = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
        (onPlayAgain ?? onClose)();
    };

    const handleClose = () => {
        Haptics.selectionAsync().catch(() => { });
        onClose();
    };

    const handleShare = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        if (!shareRef.current || isSharing) return;
        setIsSharing(true);
        try {
            const uri = await captureRef(shareRef, { format: 'png', quality: 0.9 });
            const available = await Sharing.isAvailableAsync();
            if (available) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: (t as any).shareWin ?? 'Share my LOTO win',
                    UTI: 'public.png',
                });
            }
        } catch (e) {
            console.warn('[WinnerModal] Share failed', e);
        } finally {
            setIsSharing(false);
        }
    };

    if (!visible) return null;

    const currentLevel = computeLevel(stats?.xp ?? 0);
    const showLevelUp =
        typeof previousLevel === 'number' && previousLevel > 0 && previousLevel < currentLevel;

    // Localized strings with safe fallbacks
    const victoryLabel = (isMe ? (t as any).victory : (t as any).gameOver) ?? (isMe ? 'VICTORY!' : 'GAME OVER');
    const taglineMe = (t as any).youWon ?? 'You won the Loto!';
    const taglineOther = `${winnerName} ${(t as any).playerWins ?? 'takes the prize!'}`;
    const playAgainLabel = (t as any).playAgain ?? 'Play Again';
    const shareLabel = (t as any).shareWin ?? (t as any).share ?? 'Share Win';
    const backLabel = (t as any).backToMenu ?? (t as any).leaveRoom ?? 'Back to Menu';
    const coinsLabel = (t as any).coinsLabel ?? 'coins';
    const xpLabel = (t as any).xpLabel ?? 'XP';
    const levelUpLabel = (t as any).levelUp ?? 'Level up!';

    return (
        <>
            <AnimatedModal
                visible={visible}
                onClose={handleClose}
                animation="scale"
                closeOnBackdrop={false}
            >
                <View style={styles.outer}>
                    <CelebrationConfetti fire={visible} />

                    <View style={styles.card}>
                        <ScrollView
                            contentContainerStyle={styles.scroll}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {/* Hero zone — trophy + title */}
                            <Reanimated.Text style={[styles.trophy, trophyStyle]} accessibilityRole="image">
                                🏆
                            </Reanimated.Text>

                            <Reanimated.Text style={[styles.title, titleStyle]} numberOfLines={1}>
                                {victoryLabel}
                            </Reanimated.Text>

                            {/* Winner card (also the share screenshot target) */}
                            <Reanimated.View style={[styles.winnerCardWrap, cardStyle]}>
                                <View
                                    ref={shareRef}
                                    collapsable={false}
                                    style={styles.winnerCard}
                                >
                                    <View style={styles.avatarRing}>
                                        <Text style={styles.avatarText}>
                                            {playerAvatar || (isMe ? '🐻' : '🎉')}
                                        </Text>
                                    </View>
                                    <Text style={styles.winnerName} numberOfLines={1}>
                                        {isMe ? (playerName || winnerName) : winnerName}
                                    </Text>
                                    <Text style={styles.winnerTagline} numberOfLines={2}>
                                        {isMe ? taglineMe : taglineOther}
                                    </Text>
                                </View>
                            </Reanimated.View>

                            {/* Reward chips */}
                            <Reanimated.View style={[styles.chipRow, chipStyle]}>
                                {prize > 0 && (
                                    <RewardChip
                                        icon="✨"
                                        value={prize}
                                        label={coinsLabel}
                                        variant="gold"
                                    />
                                )}
                                {typeof xpGained === 'number' && xpGained > 0 && (
                                    <RewardChip
                                        icon="🎯"
                                        value={xpGained}
                                        label={xpLabel}
                                        variant="info"
                                    />
                                )}
                                {showLevelUp && (
                                    <RewardChip
                                        icon="📈"
                                        value={`Lv ${previousLevel} → ${currentLevel}`}
                                        label={levelUpLabel}
                                        variant="success"
                                    />
                                )}
                            </Reanimated.View>

                            {/* Buttons */}
                            <Reanimated.View style={[styles.buttons, buttonsStyle]}>
                                <WoodenButton
                                    variant="gold"
                                    size="xl"
                                    fullWidth
                                    onPress={handlePlayAgain}
                                    accessibilityLabel={playAgainLabel}
                                >
                                    {playAgainLabel}
                                </WoodenButton>
                                {isMe && (
                                    <WoodenButton
                                        variant="secondary"
                                        size="lg"
                                        fullWidth
                                        onPress={() => setShowShareSheet(true)}
                                        accessibilityLabel={shareLabel}
                                    >
                                        {shareLabel}
                                    </WoodenButton>
                                )}
                                <WoodenButton
                                    variant="ghost"
                                    size="md"
                                    fullWidth
                                    onPress={handleClose}
                                    accessibilityLabel={backLabel}
                                >
                                    {backLabel}
                                </WoodenButton>
                            </Reanimated.View>
                        </ScrollView>
                    </View>
                </View>
            </AnimatedModal>

            {/* Shareable preview sheet */}
            <Modal visible={showShareSheet} transparent animationType="fade" onRequestClose={() => setShowShareSheet(false)}>
                <View style={styles.shareBackdrop}>
                    <Pressable
                        style={styles.shareClose}
                        onPress={() => setShowShareSheet(false)}
                        accessibilityRole="button"
                        accessibilityLabel={(t as any).close ?? 'Close'}
                    >
                        <X color="#fff" size={24} />
                    </Pressable>

                    <View collapsable={false}>
                        <VictoryCard
                            playerName={playerName || winnerName || 'Player'}
                            playerAvatar={playerAvatar || '🐻'}
                            prize={prize}
                            level={currentLevel}
                            date={new Date().toLocaleDateString()}
                        />
                    </View>

                    <View style={styles.shareCta}>
                        <WoodenButton
                            variant="gold"
                            size="lg"
                            fullWidth
                            onPress={handleShare}
                            disabled={isSharing}
                        >
                            {isSharing ? '...' : shareLabel}
                        </WoodenButton>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    outer: {
        width: '100%',
        alignItems: 'center',
    },
    card: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: k_colorWoodDark,
        borderRadius: RADII.xl,
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.55)',
        paddingVertical: SPACING.xl,
        paddingHorizontal: SPACING.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 12,
    },
    scroll: {
        alignItems: 'center',
        paddingBottom: SPACING.sm,
    },
    trophy: {
        fontSize: 80,
        lineHeight: 92,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    title: {
        ...TEXT_STYLES.display,
        color: k_colorGold,
        textAlign: 'center',
        marginBottom: SPACING.lg,
        textShadowColor: 'rgba(0,0,0,0.55)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    winnerCardWrap: {
        width: '100%',
        marginBottom: SPACING.lg,
    },
    winnerCard: {
        width: '100%',
        backgroundColor: k_colorWoodLight,
        borderRadius: RADII.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
    },
    avatarRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 215, 0, 0.12)',
        borderWidth: 2,
        borderColor: k_colorGold,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    avatarText: {
        fontSize: 44,
        lineHeight: 52,
    },
    winnerName: {
        ...TEXT_STYLES.h2,
        color: k_colorText,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    winnerTagline: {
        ...TEXT_STYLES.bodySmall,
        color: k_colorTextMuted,
        textAlign: 'center',
    },
    chipRow: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    buttons: {
        width: '100%',
        gap: SPACING.md,
    },
    shareBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.lg,
    },
    shareClose: {
        position: 'absolute',
        top: 48,
        right: SPACING.lg,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: RADII.pill,
        padding: SPACING.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        zIndex: 10,
    },
    shareCta: {
        marginTop: SPACING.xl,
        width: '100%',
        maxWidth: 320,
    },
});

export default WinnerModal;
