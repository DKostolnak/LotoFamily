import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Tv, ChevronRight } from 'lucide-react-native';
import { adsService, AD_PLACEMENTS } from '@/lib/services';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

const REWARD_AMOUNT = 50;
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

interface FreeCoinsCTAProps {
    onReward: (amount: number) => void;
    labels?: {
        title?: string; // e.g. "Free Coins"
        action?: string; // e.g. "WATCH"
        cooldown?: string; // e.g. "Available in"
    };
    style?: ViewStyle;
    /** Compact pill-chip variant (44pt). */
    compact?: boolean;
}

const formatRemaining = (ms: number) => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * FreeCoinsCTA — rewarded ad entry point. Calls adsService.showRewardedAd
 * and on success grants `REWARD_AMOUNT` coins via `onReward`. Disables for
 * `COOLDOWN_MS` after a successful claim. In dev mode (mock provider) the
 * reward always succeeds, so the flow is fully testable.
 */
export function FreeCoinsCTA({ onReward, labels, style, compact = false }: FreeCoinsCTAProps) {
    const [loading, setLoading] = useState(false);
    const [cooldownUntil, setCooldownUntil] = useState(0);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (cooldownUntil <= 0) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [cooldownUntil]);

    const onCooldown = cooldownUntil > now;
    const remaining = Math.max(0, cooldownUntil - now);

    const titleLabel = labels?.title ?? 'Get free coins';
    const actionLabel = labels?.action ?? 'WATCH';
    const cooldownLabel = labels?.cooldown ?? 'Available in';

    const handlePress = useCallback(async () => {
        if (loading || onCooldown) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            const result = await adsService.showRewardedAd(AD_PLACEMENTS.EXTRA_COINS);
            if (result.rewarded) {
                onReward(REWARD_AMOUNT);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setCooldownUntil(Date.now() + COOLDOWN_MS);
            }
        } finally {
            setLoading(false);
        }
    }, [loading, onCooldown, onReward]);

    const disabled = loading || onCooldown;

    if (compact) {
        return (
            <TouchableOpacity
                onPress={handlePress}
                disabled={disabled}
                activeOpacity={disabled ? 1 : 0.85}
                accessibilityRole="button"
                accessibilityLabel={`${titleLabel}, +${REWARD_AMOUNT} coins`}
                style={[
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: SPACING.md,
                        height: 44,
                        paddingHorizontal: SPACING.lg,
                        borderRadius: RADII.pill,
                        backgroundColor: 'rgba(74, 222, 128, 0.10)',
                        borderWidth: 1,
                        borderColor: onCooldown ? 'rgba(74, 222, 128, 0.30)' : 'rgba(74, 222, 128, 0.65)',
                        opacity: onCooldown ? 0.7 : 1,
                    },
                    style,
                ]}
            >
                <Text style={{ fontSize: 18, lineHeight: 22 }}>📺</Text>
                <Text
                    style={[TEXT_STYLES.bodySmall, { color: '#f5e6c8', flex: 1, fontWeight: '600' }]}
                    numberOfLines={1}
                >
                    {onCooldown ? `${cooldownLabel} ${formatRemaining(remaining)}` : titleLabel}
                </Text>
                {loading ? (
                    <ActivityIndicator size="small" color="#4ade80" />
                ) : (
                    <>
                        {!onCooldown && (
                            <Text style={[TEXT_STYLES.bodyBold, { color: '#4ade80' }]}>+{REWARD_AMOUNT}</Text>
                        )}
                        <ChevronRight size={16} color={onCooldown ? '#d4b896' : '#4ade80'} strokeWidth={2.5} />
                    </>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled}
            activeOpacity={disabled ? 1 : 0.85}
            accessibilityRole="button"
            accessibilityLabel={`${titleLabel}, +${REWARD_AMOUNT} coins`}
            style={[
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: SPACING.md,
                    paddingVertical: SPACING.md,
                    paddingHorizontal: SPACING.lg,
                    borderRadius: RADII.lg,
                    backgroundColor: 'rgba(74, 222, 128, 0.10)',
                    borderWidth: 2,
                    borderColor: onCooldown ? 'rgba(74, 222, 128, 0.35)' : '#4ade80',
                    minHeight: 64,
                    opacity: onCooldown ? 0.7 : 1,
                },
                style,
            ]}
        >
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: RADII.md,
                    backgroundColor: '#4ade80',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Tv size={24} color="#1a1109" strokeWidth={2.5} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[TEXT_STYLES.bodyBold, { color: '#f5e6c8' }]} numberOfLines={1}>
                    {titleLabel}
                </Text>
                <Text style={[TEXT_STYLES.bodySmall, { color: '#d4b896', marginTop: 2 }]} numberOfLines={1}>
                    {onCooldown ? `${cooldownLabel} ${formatRemaining(remaining)}` : `+${REWARD_AMOUNT} 💰`}
                </Text>
            </View>

            <View
                style={{
                    backgroundColor: onCooldown ? 'rgba(0,0,0,0.3)' : '#4ade80',
                    paddingHorizontal: SPACING.lg,
                    paddingVertical: SPACING.sm,
                    borderRadius: RADII.md,
                    minHeight: 44,
                    minWidth: 80,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#1a1109" />
                ) : (
                    <Text style={[TEXT_STYLES.button, { color: onCooldown ? '#d4b896' : '#1a1109' }]}>
                        {actionLabel}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

export default FreeCoinsCTA;
