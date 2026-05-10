import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity } from 'react-native';
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
import { X, Share2, ChevronLeft } from 'lucide-react-native';

import {
    WoodenButton,
    AnimatedModal,
    RewardChip,
    CelebrationConfetti,
    HeroCTAButton,
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

    // Reanimated shared values
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

        trophyScale.value = 0;
        trophyPulse.value = 1;
        titleOpacity.value = 0;
        titleTranslateY.value = 12;
        cardOpacity.value = 0;
        cardTranslateY.value = 16;
        chipOpacity.value = 0;
        buttonsOpacity.value = 0;

        trophyScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 140 }));
        trophyPulse.value = withDelay(
            1100,
            withSequence(
                withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
            ),
        );
        titleOpacity.value = withDelay(400, withTiming(1, { duration: 350 }));
        titleTranslateY.value = withDelay(400, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
        cardOpacity.value = withDelay(600, withTiming(1, { duration: 350 }));
        cardTranslateY.value = withDelay(600, withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) }));
        chipOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
        buttonsOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));

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

    const victoryLabel = (isMe ? (t as any).victory : (t as any).gameOver) ?? (isMe ? 'VICTORY!' : 'GAME OVER');
    const taglineMe = (t as any).youWon ?? 'You won the Loto!';
    const taglineOther = `${winnerName} ${(t as any).playerWins ?? 'takes the prize!'}`;
    const playAgainLabel = (t as any).playAgain ?? 'PLAY AGAIN';
    const playAgainSubtitle = (t as any).startNewRound ?? 'Start a new round';
    const shareLabel = (t as any).shareWin ?? (t as any).share ?? 'Share my win';
    const backLabel = (t as any).backToMenu ?? (t as any).leaveRoom ?? 'Back to menu';
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
                        {/* Subtle radial gradient overlay — top gold, fading down */}
                        <View pointerEvents="none" style={styles.radialGlow} />

                        {/* Close button top-right */}
                        <TouchableOpacity
                            onPress={handleClose}
                            accessibilityRole="button"
                            accessibilityLabel={(t as any).close ?? 'Close'}
                            style={styles.closeBtn}
                            hitSlop={12}
                        >
                            <X size={20} color="rgba(245, 230, 200, 0.7)" />
                        </TouchableOpacity>

                        <ScrollView
                            contentContainerStyle={styles.scroll}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {/* Hero zone — big trophy + giant title */}
                            <Reanimated.Text style={[styles.trophy, trophyStyle]} accessibilityRole="image">
                                {isMe ? '🏆' : '🎉'}
                            </Reanimated.Text>

                            <Reanimated.Text style={[styles.title, titleStyle]} numberOfLines={1}>
                                {victoryLabel}
                            </Reanimated.Text>

                            {/* Winner card (share screenshot target) */}
                            <Reanimated.View style={[styles.winnerCardWrap, cardStyle]}>
                                <View
                                    ref={shareRef}
                                    collapsable={false}
                                    style={styles.winnerCard}
                                >
                                    <View style={styles.avatarGlow} />
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

                            {/* Reward chips — bigger, chunkier */}
                            <Reanimated.View style={[styles.chipRow, chipStyle]}>
                                {prize > 0 && (
                                    <RewardChip
                                        icon="✨"
                                        value={prize}
                                        label={coinsLabel}
                                        variant="gold"
                                        style={styles.bigChip}
                                    />
                                )}
                                {typeof xpGained === 'number' && xpGained > 0 && (
                                    <RewardChip
                                        icon="🎯"
                                        value={xpGained}
                                        label={xpLabel}
                                        variant="info"
                                        style={styles.bigChip}
                                    />
                                )}
                                {showLevelUp && (
                                    <RewardChip
                                        icon="📈"
                                        value={`Lv ${previousLevel} → ${currentLevel}`}
                                        label={levelUpLabel}
                                        variant="success"
                                        style={styles.bigChip}
                                    />
                                )}
                            </Reanimated.View>

                            {/* Hero CTA */}
                            <Reanimated.View style={[styles.heroCtaWrap, buttonsStyle]}>
                                <HeroCTAButton
                                    title={playAgainLabel}
                                    subtitle={playAgainSubtitle}
                                    onPress={handlePlayAgain}
                                    variant="gold"
                                    pulse
                                    glow
                                    accessibilityLabel={playAgainLabel}
                                />
                            </Reanimated.View>

                            {/* Secondary text-link actions */}
                            <Reanimated.View style={[styles.secondaryActions, buttonsStyle]}>
                                {isMe && (
                                    <TouchableOpacity
                                        onPress={() => setShowShareSheet(true)}
                                        accessibilityRole="button"
                                        accessibilityLabel={shareLabel}
                                        style={styles.linkBtn}
                                        hitSlop={8}
                                    >
                                        <Share2 size={16} color="#d4b896" />
                                        <Text style={styles.linkText}>{shareLabel}</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={handleClose}
                                    accessibilityRole="button"
                                    accessibilityLabel={backLabel}
                                    style={styles.linkBtn}
                                    hitSlop={8}
                                >
                                    <ChevronLeft size={16} color="#d4b896" />
                                    <Text style={styles.linkText}>{backLabel}</Text>
                                </TouchableOpacity>
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
        overflow: 'hidden',
    },
    radialGlow: {
        position: 'absolute',
        top: -120,
        left: -60,
        right: -60,
        height: 320,
        borderRadius: 200,
        backgroundColor: 'rgba(255, 215, 0, 0.08)',
    },
    closeBtn: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADII.pill,
        zIndex: 5,
    },
    scroll: {
        alignItems: 'center',
        paddingBottom: SPACING.sm,
    },
    trophy: {
        fontSize: 100,
        lineHeight: 116,
        textAlign: 'center',
        marginBottom: SPACING.xs,
        textShadowColor: 'rgba(255, 215, 0, 0.55)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    title: {
        ...TEXT_STYLES.display,
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 2,
        color: k_colorGold,
        textAlign: 'center',
        marginBottom: SPACING.lg,
        textShadowColor: 'rgba(255, 215, 0, 0.55)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 16,
    },
    winnerCardWrap: {
        width: '100%',
        marginBottom: SPACING.lg,
    },
    winnerCard: {
        width: '100%',
        backgroundColor: k_colorWoodLight,
        borderRadius: RADII.lg,
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.45)',
        paddingVertical: SPACING.xl,
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarGlow: {
        position: 'absolute',
        top: SPACING.lg,
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(255, 215, 0, 0.18)',
    },
    avatarRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 215, 0, 0.12)',
        borderWidth: 3,
        borderColor: k_colorGold,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
        shadowColor: k_colorGold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 6,
    },
    avatarText: {
        fontSize: 44,
        lineHeight: 52,
    },
    winnerName: {
        ...TEXT_STYLES.h2,
        fontSize: 24,
        fontWeight: '900',
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
    bigChip: {
        height: 64,
        minWidth: 150,
        paddingHorizontal: SPACING.lg,
    },
    heroCtaWrap: {
        width: '100%',
        marginTop: SPACING.xs,
        marginBottom: SPACING.md,
    },
    secondaryActions: {
        width: '100%',
        alignItems: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.sm,
    },
    linkBtn: {
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.lg,
        opacity: 0.85,
    },
    linkText: {
        ...TEXT_STYLES.button,
        color: k_colorTextMuted,
        fontSize: 13,
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
