import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gift, ChevronRight } from 'lucide-react-native';
import { TEXT_STYLES, SPACING, RADII, ECONOMY } from '@/lib/config';

interface DailyBonusCardProps {
    lastDailyBonus: number;
    onClaim: () => void;
    /** Localized labels with safe fallbacks */
    labels?: {
        ready?: string;
        claim?: string;
        nextIn?: string;
        amountSuffix?: string;
    };
    style?: ViewStyle;
    /** Compact pill-chip variant (44pt). Renders nothing when bonus not ready. */
    compact?: boolean;
}

const formatRemaining = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

/**
 * DailyBonusCard — retention hero. Shows a CLAIM CTA when the daily bonus
 * is available, otherwise a countdown to the next bonus. Tap CTA → parent
 * triggers store.checkDailyBonus(), which the existing DailyBonusModal
 * picks up (or the parent can open the modal directly).
 */
export function DailyBonusCard({ lastDailyBonus, onClaim, labels, style, compact = false }: DailyBonusCardProps) {
    const intervalMs = ECONOMY.DAILY_BONUS_INTERVAL_MS;
    const amount = ECONOMY.DAILY_BONUS_AMOUNT;

    const computeReady = () => Date.now() - lastDailyBonus > intervalMs;
    const [ready, setReady] = useState(computeReady);
    const [remaining, setRemaining] = useState(() =>
        Math.max(0, intervalMs - (Date.now() - lastDailyBonus))
    );

    useEffect(() => {
        const tick = () => {
            const r = computeReady();
            setReady(r);
            setRemaining(Math.max(0, intervalMs - (Date.now() - lastDailyBonus)));
        };
        tick();
        const id = setInterval(tick, 30_000); // every 30s is plenty
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastDailyBonus, intervalMs]);

    const readyLabel = labels?.ready ?? 'Daily Bonus';
    const claimLabel = labels?.claim ?? 'CLAIM';
    const nextInLabel = labels?.nextIn ?? 'Next bonus in';

    const handlePress = () => {
        if (!ready) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClaim();
    };

    // Compact pill chip variant — only render when ready (avoid stale chrome)
    if (compact) {
        if (!ready) return null;
        return (
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`${readyLabel}, +${amount} coins, claim`}
                style={[
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: SPACING.md,
                        height: 44,
                        paddingHorizontal: SPACING.lg,
                        borderRadius: RADII.pill,
                        backgroundColor: 'rgba(255, 215, 0, 0.14)',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 215, 0, 0.65)',
                    },
                    style,
                ]}
            >
                <Text style={{ fontSize: 18, lineHeight: 22 }}>✨</Text>
                <Text
                    style={[TEXT_STYLES.bodySmall, { color: '#f5e6c8', flex: 1, fontWeight: '600' }]}
                    numberOfLines={1}
                >
                    {readyLabel}
                </Text>
                <Text style={[TEXT_STYLES.bodyBold, { color: '#ffd700' }]}>+{amount}</Text>
                <ChevronRight size={16} color="#ffd700" strokeWidth={2.5} />
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={!ready}
            activeOpacity={ready ? 0.85 : 1}
            accessibilityRole="button"
            accessibilityLabel={ready ? `${readyLabel}, +${amount} coins, claim` : `${nextInLabel} ${formatRemaining(remaining)}`}
            style={[
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: SPACING.md,
                    paddingVertical: SPACING.md,
                    paddingHorizontal: SPACING.lg,
                    borderRadius: RADII.lg,
                    backgroundColor: ready ? 'rgba(255, 215, 0, 0.12)' : 'rgba(45, 31, 16, 0.6)',
                    borderWidth: 2,
                    borderColor: ready ? '#ffd700' : 'rgba(90, 64, 37, 0.6)',
                    minHeight: 72,
                },
                style,
            ]}
        >
            <View
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: RADII.md,
                    backgroundColor: ready ? '#ffd700' : 'rgba(0,0,0,0.3)',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Gift size={28} color={ready ? '#1a1109' : '#d4b896'} strokeWidth={2.5} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[TEXT_STYLES.h3, { color: ready ? '#ffd700' : '#d4b896' }]} numberOfLines={1}>
                    {readyLabel}
                </Text>
                <Text style={[TEXT_STYLES.bodySmall, { color: '#d4b896', marginTop: 2 }]} numberOfLines={1}>
                    {ready ? `+${amount} 💰` : `${nextInLabel} ${formatRemaining(remaining)}`}
                </Text>
            </View>

            {ready && (
                <View
                    style={{
                        backgroundColor: '#ffd700',
                        paddingHorizontal: SPACING.lg,
                        paddingVertical: SPACING.sm,
                        borderRadius: RADII.md,
                        minHeight: 44,
                        justifyContent: 'center',
                    }}
                >
                    <Text style={[TEXT_STYLES.button, { color: '#1a1109' }]}>{claimLabel}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default DailyBonusCard;
