/**
 * BattlePassModal — Season Pass UI
 *
 * Shows the 50-level reward grid (Free + Premium tracks), current XP/level
 * progress, days remaining in the season, and the "Unlock Premium" upsell
 * banner for non-premium users. All state lives in the season slice.
 *
 * Visual notes:
 *  - Reward cells are 80×140 with a free icon on top half and a premium
 *    icon on the bottom half. Locked premium cells get a dark mask + lock.
 *  - Claimable cells get a gold pulsing border (animated via Reanimated).
 *  - Claimed cells get a static gold border + check mark.
 */

import React, { useMemo, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import { Lock, Check, Coins, Zap, Palette, Sparkles, User } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    cancelAnimation,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ModalShell, WoodenButton } from './common';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import {
    generateSeasonLevels,
    deriveLevelFromXp,
    SEASON_PREMIUM_PRICE_USD,
    type SeasonLevel,
    type SeasonReward,
} from '@/lib/config/season.config';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

const SURFACE = '#1a1109';
const SURFACE_2 = '#2d1f10';
const BORDER = '#3d2814';
const BORDER_GOLD = '#ffd700';
const TEXT_GOLD = '#ffd700';
const TEXT_LIGHT = '#e8d4b8';
const TEXT_MUTED = '#5a4025';
const PREMIUM_BG = '#3d2814';

export interface BattlePassModalProps {
    visible: boolean;
    onClose: () => void;
}

export function BattlePassModal({ visible, onClose }: BattlePassModalProps) {
    const language = useGameStore((s) => s.language);
    const seasonId = useGameStore((s) => s.seasonId);
    const seasonXp = useGameStore((s) => s.seasonXp);
    const seasonLevel = useGameStore((s) => s.seasonLevel);
    const seasonEndsAt = useGameStore((s) => s.seasonEndsAt);
    const hasPremium = useGameStore((s) => s.hasPremium);
    const claimedFree = useGameStore((s) => s.claimedFree);
    const claimedPremium = useGameStore((s) => s.claimedPremium);
    const claimReward = useGameStore((s) => s.claimReward);
    const purchasePremium = useGameStore((s) => s.purchasePremium);
    const checkSeasonRollover = useGameStore((s) => s.checkSeasonRollover);

    const t = translations[language];
    const [purchasingPremium, setPurchasingPremium] = useState(false);

    // Bootstrap the season on first open if needed.
    useEffect(() => {
        if (visible) checkSeasonRollover();
    }, [visible, checkSeasonRollover]);

    const levels = useMemo(() => generateSeasonLevels(seasonId || 'preview'), [seasonId]);
    const { xpIntoLevel, xpForNextLevel } = useMemo(
        () => deriveLevelFromXp(seasonXp, levels),
        [seasonXp, levels]
    );

    const daysLeft = Math.max(
        0,
        Math.ceil((seasonEndsAt - Date.now()) / (24 * 60 * 60 * 1000))
    );

    const labelDaysLeft = (t.daysLeft ?? '{n} days left').replace('{n}', String(daysLeft));
    const labelSeasonPass = t.seasonPass ?? 'Season Pass';
    const labelLevel = t.seasonLevel ?? t.level ?? 'Level';
    const labelGetPremium = t.getPremium ?? 'Get Premium';
    const labelUnlockPremium = t.unlockPremium ?? 'Unlock Premium';
    const labelClaim = t.claim ?? 'Claim';
    const labelClaimed = t.claimed ?? 'Claimed';
    const labelLocked = t.locked ?? 'Locked';
    const labelFreeTrack = t.freeTrack ?? 'Free';
    const labelPremiumTrack = t.premiumTrack ?? 'Premium';

    const handlePurchase = async () => {
        if (purchasingPremium) return;
        setPurchasingPremium(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const ok = await purchasePremium();
            if (ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert(t.errorTitle, 'Could not unlock premium. Please try again.');
            }
        } finally {
            setPurchasingPremium(false);
        }
    };

    const handleClaim = (level: number, track: 'free' | 'premium') => {
        const reward = claimReward(level, track);
        if (reward) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    };

    const progressPct = xpForNextLevel > 0 ? Math.min(1, xpIntoLevel / xpForNextLevel) : 1;

    // Animate XP fill from 0 → progressPct each time the modal opens
    const progressAnim = useSharedValue(0);
    useEffect(() => {
        if (visible) {
            progressAnim.value = 0;
            progressAnim.value = withDelay(
                350,
                withTiming(progressPct, { duration: 900, easing: Easing.out(Easing.cubic) })
            );
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, progressPct]);

    const xpBarStyle = useAnimatedStyle(() => ({
        width: `${Math.round(progressAnim.value * 100)}%` as any,
    }));

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={labelSeasonPass}
            subtitle={daysLeft > 0 ? labelDaysLeft : (t.seasonEnded ?? 'Season ended')}
            maxWidth={560}
        >
            {/* Premium upsell banner */}
            {!hasPremium && (
                <View style={styles.premiumBanner}>
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[TEXT_STYLES.bodyBold, { color: TEXT_GOLD }]}>
                            {`✨ ${labelUnlockPremium}`}
                        </Text>
                        <Text style={[TEXT_STYLES.caption, { color: TEXT_LIGHT }]}>
                            {`${labelPremiumTrack} • ${SEASON_PREMIUM_PRICE_USD}`}
                        </Text>
                    </View>
                    <WoodenButton
                        onPress={handlePurchase}
                        variant="gold"
                        size="md"
                        disabled={purchasingPremium}
                    >
                        {purchasingPremium ? '...' : labelGetPremium}
                    </WoodenButton>
                </View>
            )}

            {/* Current level + XP bar */}
            <View style={styles.progressCard}>
                <Text style={[TEXT_STYLES.h3, { color: TEXT_GOLD }]}>
                    {`${labelLevel} ${seasonLevel}`}
                </Text>
                <View style={styles.xpRow}>
                    <View style={styles.xpTrack}>
                        <Animated.View style={[styles.xpFill, xpBarStyle]} />
                    </View>
                    <Text style={[TEXT_STYLES.caption, { color: TEXT_LIGHT, fontWeight: '700' }]}>
                        {xpForNextLevel > 0
                            ? `${xpIntoLevel} / ${xpForNextLevel}`
                            : 'MAX'}
                    </Text>
                </View>
            </View>

            {/* Level row */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.row}
            >
                {levels.map((lvl) => (
                    <LevelCell
                        key={lvl.level}
                        slot={lvl}
                        currentLevel={seasonLevel}
                        hasPremium={hasPremium}
                        claimedFree={claimedFree.includes(lvl.level)}
                        claimedPremium={claimedPremium.includes(lvl.level)}
                        onClaim={handleClaim}
                        labels={{
                            claim: labelClaim,
                            claimed: labelClaimed,
                            locked: labelLocked,
                            freeTrack: labelFreeTrack,
                            premiumTrack: labelPremiumTrack,
                        }}
                    />
                ))}
            </ScrollView>
        </ModalShell>
    );
}

interface LevelCellProps {
    slot: SeasonLevel;
    currentLevel: number;
    hasPremium: boolean;
    claimedFree: boolean;
    claimedPremium: boolean;
    onClaim: (level: number, track: 'free' | 'premium') => void;
    labels: {
        claim: string;
        claimed: string;
        locked: string;
        freeTrack: string;
        premiumTrack: string;
    };
}

function LevelCell({
    slot,
    currentLevel,
    hasPremium,
    claimedFree,
    claimedPremium,
    onClaim,
    labels,
}: LevelCellProps) {
    const reached = currentLevel >= slot.level;
    const freeClaimable = reached && !claimedFree;
    const premiumClaimable = reached && hasPremium && !claimedPremium;
    const anyClaimable = freeClaimable || premiumClaimable;

    // Pulse animation for claimable cells
    const pulse = useSharedValue(0);
    useEffect(() => {
        if (anyClaimable) {
            pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
        } else {
            cancelAnimation(pulse);
            pulse.value = 0;
        }
        return () => cancelAnimation(pulse);
    }, [anyClaimable, pulse]);

    const animatedBorder = useAnimatedStyle(() => ({
        borderColor: anyClaimable
            ? `rgba(255, 215, 0, ${0.4 + pulse.value * 0.6})`
            : reached
              ? BORDER_GOLD
              : BORDER,
    }));

    return (
        <Animated.View style={[styles.cell, animatedBorder]}>
            {/* Level badge */}
            <View style={styles.levelBadge}>
                <Text style={[TEXT_STYLES.captionUpper, { color: TEXT_GOLD, fontWeight: '800' }]}>
                    {slot.level}
                </Text>
            </View>

            {/* Free reward */}
            <TouchableOpacity
                style={styles.rewardSlot}
                disabled={!freeClaimable}
                onPress={() => onClaim(slot.level, 'free')}
                accessibilityRole="button"
                accessibilityLabel={
                    claimedFree
                        ? `${labels.freeTrack} level ${slot.level} — ${labels.claimed}`
                        : freeClaimable
                            ? `${labels.freeTrack} level ${slot.level} — ${labels.claim}`
                            : `${labels.freeTrack} level ${slot.level} — ${reached ? labels.locked : labels.locked}`
                }
                accessibilityState={{ disabled: !freeClaimable }}
            >
                <RewardIcon reward={slot.freeReward} dim={!reached} />
                <RewardLabel reward={slot.freeReward} />
                {claimedFree && (
                    <View style={styles.claimedOverlay}>
                        <Check size={20} color={BORDER_GOLD} strokeWidth={3} />
                    </View>
                )}
                {freeClaimable && (
                    <View style={styles.claimChip}>
                        <Text style={styles.claimChipText}>{labels.claim}</Text>
                    </View>
                )}
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Premium reward */}
            <TouchableOpacity
                style={styles.rewardSlot}
                disabled={!premiumClaimable}
                onPress={() => onClaim(slot.level, 'premium')}
                accessibilityRole="button"
                accessibilityLabel={
                    !hasPremium
                        ? `${labels.premiumTrack} level ${slot.level} — ${labels.locked}`
                        : claimedPremium
                            ? `${labels.premiumTrack} level ${slot.level} — ${labels.claimed}`
                            : premiumClaimable
                                ? `${labels.premiumTrack} level ${slot.level} — ${labels.claim}`
                                : `${labels.premiumTrack} level ${slot.level} — ${labels.locked}`
                }
                accessibilityState={{ disabled: !premiumClaimable }}
            >
                <RewardIcon reward={slot.premiumReward} dim={!reached || !hasPremium} />
                <RewardLabel reward={slot.premiumReward} />
                {claimedPremium && (
                    <View style={styles.claimedOverlay}>
                        <Check size={20} color={BORDER_GOLD} strokeWidth={3} />
                    </View>
                )}
                {premiumClaimable && (
                    <View style={styles.claimChip}>
                        <Text style={styles.claimChipText}>{labels.claim}</Text>
                    </View>
                )}
                {!hasPremium && (
                    <View style={styles.lockOverlay}>
                        <Lock size={18} color={TEXT_LIGHT} strokeWidth={2.5} />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

function RewardIcon({ reward, dim }: { reward: SeasonReward; dim: boolean }) {
    const color = dim ? TEXT_MUTED : TEXT_GOLD;
    const size = 28;
    switch (reward.type) {
        case 'coins':
            return <Coins size={size} color={color} />;
        case 'powerup':
            return <Zap size={size} color={color} />;
        case 'theme':
            return <Palette size={size} color={color} />;
        case 'skin':
            return <Sparkles size={size} color={color} />;
        case 'avatar':
            return <User size={size} color={color} />;
        default:
            return null;
    }
}

function RewardLabel({ reward }: { reward: SeasonReward }) {
    const text = reward.amount
        ? reward.type === 'coins'
            ? `${reward.amount}`
            : `×${reward.amount}`
        : '';
    if (!text) return null;
    return (
        <Text style={[TEXT_STYLES.caption, { color: TEXT_LIGHT, fontWeight: '700' }]} numberOfLines={1}>
            {text}
        </Text>
    );
}

const styles = StyleSheet.create({
    premiumBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.md,
        backgroundColor: PREMIUM_BG,
        borderRadius: RADII.lg,
        borderWidth: 1,
        borderColor: BORDER_GOLD,
    },
    progressCard: {
        gap: SPACING.sm,
        padding: SPACING.md,
        backgroundColor: SURFACE,
        borderRadius: RADII.lg,
        borderWidth: 1,
        borderColor: BORDER,
    },
    xpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    xpTrack: {
        flex: 1,
        height: 10,
        backgroundColor: SURFACE_2,
        borderRadius: RADII.pill,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BORDER,
    },
    xpFill: {
        height: '100%',
        backgroundColor: TEXT_GOLD,
    },
    row: {
        gap: SPACING.sm,
        paddingVertical: SPACING.xs,
        paddingHorizontal: 2,
    },
    cell: {
        width: 80,
        height: 180,
        backgroundColor: SURFACE,
        borderRadius: RADII.lg,
        borderWidth: 2,
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        gap: 6,
    },
    levelBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        backgroundColor: SURFACE_2,
        borderRadius: RADII.pill,
        borderWidth: 1,
        borderColor: BORDER,
    },
    rewardSlot: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        position: 'relative',
    },
    divider: {
        width: '70%',
        height: 1,
        backgroundColor: BORDER,
    },
    claimedOverlay: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: SURFACE_2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: BORDER_GOLD,
    },
    claimChip: {
        position: 'absolute',
        bottom: -2,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        backgroundColor: TEXT_GOLD,
        borderRadius: RADII.pill,
    },
    claimChipText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1a1109',
        letterSpacing: 0.5,
    },
    lockOverlay: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default BattlePassModal;
