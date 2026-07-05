import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Trophy, ShoppingCart, Settings as SettingsIcon, HelpCircle, Users } from 'lucide-react-native';
import { SPACING, RADII, FONT_WEIGHTS } from '@/lib/config';

interface HomeFooterProps {
    onFriendsPress: () => void;
    onStatsPress: () => void;
    onShopPress: () => void;
    onSettingsPress: () => void;
    onHelpPress: () => void;
    pendingFriendsCount?: number;
    bottomInset?: number;
    labels?: {
        friends?: string;
        stats?: string;
        shop?: string;
        settings?: string;
        help?: string;
    };
}

/**
 * HomeFooter — single compact row of icon tabs.
 * No second row — keeps total height ≤ 72pt so short screens (SE) can fit
 * all home content without scrolling.
 */
export function HomeFooter({
    onFriendsPress,
    onStatsPress,
    onShopPress,
    onSettingsPress,
    onHelpPress,
    pendingFriendsCount = 0,
    bottomInset = 0,
    labels,
}: HomeFooterProps) {
    const items = [
        { key: 'friends', Icon: Users, label: labels?.friends ?? '', onPress: onFriendsPress, badge: pendingFriendsCount },
        { key: 'stats',    Icon: Trophy,         label: labels?.stats    ?? 'Stats',    onPress: onStatsPress    },
        { key: 'shop',     Icon: ShoppingCart,    label: labels?.shop     ?? 'Shop',     onPress: onShopPress     },
        { key: 'settings', Icon: SettingsIcon,    label: labels?.settings ?? 'Settings', onPress: onSettingsPress },
        { key: 'help',     Icon: HelpCircle,      label: labels?.help     ?? 'Rules',    onPress: onHelpPress     },
    ] as const;

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'stretch',
                paddingHorizontal: SPACING.md,
                paddingTop: SPACING.sm,
                paddingBottom: Math.max(SPACING.sm, bottomInset),
                backgroundColor: 'rgba(18, 12, 6, 0.92)',
                borderTopWidth: 1,
                borderTopColor: 'rgba(90, 64, 37, 0.35)',
                gap: SPACING.xs,
            }}
        >
            {items.map((item) => {
                const Icon = item.Icon;
                const badge = 'badge' in item ? item.badge : 0;

                return (
                    <TouchableOpacity
                        key={item.key}
                        onPress={() => {
                            Haptics.selectionAsync();
                            item.onPress();
                        }}
                        activeOpacity={0.65}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: SPACING.sm,
                            gap: 3,
                            borderRadius: RADII.md,
                            minHeight: 52,
                        }}
                    >
                        {badge ? (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 2,
                                    right: '22%',
                                    minWidth: 18,
                                    height: 18,
                                    paddingHorizontal: 4,
                                    borderRadius: 9,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#ffd700',
                                    borderWidth: 1,
                                    borderColor: '#5a4025',
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#2d1f10',
                                        fontSize: 11,
                                        fontWeight: FONT_WEIGHTS.black,
                                    }}
                                    maxFontSizeMultiplier={1.2}
                                    numberOfLines={1}
                                >
                                    {badge > 9 ? '9+' : badge}
                                </Text>
                            </View>
                        ) : null}
                        <Icon size={22} color="#c9a87a" strokeWidth={2} />
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: '700',
                                // #8a6a40 failed WCAG contrast on dark wood — use muted token
                                color: '#d4b896',
                                textTransform: 'uppercase',
                                letterSpacing: 0.4,
                            }}
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.2}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default HomeFooter;
