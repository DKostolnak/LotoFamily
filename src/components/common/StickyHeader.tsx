import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CoinBadge } from './CoinBadge';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface StickyHeaderProps {
    avatar: string;
    name: string;
    level: number;
    xpProgress: number; // 0..100
    coins: number;
    topInset: number;
    onPressProfile: () => void;
    onPressCoins: () => void;
    style?: ViewStyle;
    /**
     * Compact mode: single-row layout, no XP bar, smaller avatar.
     * Used on the Home screen to keep the chrome minimal.
     */
    compact?: boolean;
}

/**
 * StickyHeader — always-visible top bar showing player identity, level,
 * XP progress and coin balance. Designed for older audiences: large tap
 * targets, no micro text, single-line names.
 */
export function StickyHeader({
    avatar,
    name,
    level,
    xpProgress,
    coins,
    topInset,
    onPressProfile,
    onPressCoins,
    style,
    compact = false,
}: StickyHeaderProps) {
    const avatarSize = compact ? 40 : 48;
    const avatarFont = compact ? 24 : 28;
    const handleProfile = () => {
        Haptics.selectionAsync();
        onPressProfile();
    };
    const handleCoins = () => {
        Haptics.selectionAsync();
        onPressCoins();
    };

    return (
        <View
            style={[
                {
                    paddingTop: topInset + (compact ? SPACING.xs : SPACING.sm),
                    paddingBottom: compact ? SPACING.sm : SPACING.md,
                    paddingHorizontal: SPACING.lg,
                    backgroundColor: 'rgba(26, 17, 9, 0.92)',
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(90, 64, 37, 0.5)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 8,
                },
                style,
            ]}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                {/* Avatar + identity (tap → stats) */}
                <TouchableOpacity
                    onPress={handleProfile}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${name}, level ${level}`}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: SPACING.md,
                        flex: 1,
                        minHeight: 44,
                    }}
                >
                    <View
                        style={{
                            width: avatarSize,
                            height: avatarSize,
                            borderRadius: RADII.md,
                            backgroundColor: '#3d2814',
                            borderWidth: 2,
                            borderColor: 'rgba(255, 215, 0, 0.5)',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ fontSize: avatarFont, lineHeight: avatarFont + 4 }}>{avatar}</Text>
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                            <Text
                                style={[TEXT_STYLES.bodyBold, { color: '#ffd700', flexShrink: 1 }]}
                                numberOfLines={1}
                            >
                                {name || 'Player'}
                            </Text>
                            <View
                                style={{
                                    backgroundColor: compact ? 'rgba(255, 215, 0, 0.15)' : '#ffd700',
                                    paddingHorizontal: SPACING.sm,
                                    paddingVertical: 2,
                                    borderRadius: RADII.sm,
                                    borderWidth: compact ? 1 : 0,
                                    borderColor: 'rgba(255, 215, 0, 0.4)',
                                }}
                            >
                                <Text style={[TEXT_STYLES.caption, { color: compact ? '#ffd700' : '#1a1109', fontWeight: '900' }]}>
                                    L{level}
                                </Text>
                            </View>
                        </View>

                        {/* XP progress bar — hidden in compact mode */}
                        {!compact && (
                            <View
                                style={{
                                    height: 4,
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    borderRadius: RADII.pill,
                                    marginTop: SPACING.xs,
                                    overflow: 'hidden',
                                }}
                            >
                                <View
                                    style={{
                                        height: '100%',
                                        width: `${Math.max(0, Math.min(100, xpProgress))}%`,
                                        backgroundColor: '#3b82f6',
                                        borderRadius: RADII.pill,
                                    }}
                                />
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Coins (tap → shop) */}
                <TouchableOpacity
                    onPress={handleCoins}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${coins} coins, open shop`}
                    style={{ minHeight: 44, justifyContent: 'center' }}
                >
                    <CoinBadge coins={coins} size={compact ? 'sm' : 'md'} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default StickyHeader;
