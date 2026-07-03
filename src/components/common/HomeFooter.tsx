import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Trophy, ShoppingCart, Settings as SettingsIcon, HelpCircle } from 'lucide-react-native';
import { SPACING, RADII } from '@/lib/config';

interface HomeFooterProps {
    onStatsPress: () => void;
    onShopPress: () => void;
    onSettingsPress: () => void;
    onHelpPress: () => void;
    bottomInset?: number;
    labels?: {
        stats?: string;
        shop?: string;
        settings?: string;
        help?: string;
    };
}

/**
 * HomeFooter — single compact row of 4 icon tabs.
 * No second row — keeps total height ≤ 72pt so short screens (SE) can fit
 * all home content without scrolling.
 */
export function HomeFooter({
    onStatsPress,
    onShopPress,
    onSettingsPress,
    onHelpPress,
    bottomInset = 0,
    labels,
}: HomeFooterProps) {
    const items = [
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
            {items.map(({ key, Icon, label, onPress }) => (
                <TouchableOpacity
                    key={key}
                    onPress={() => {
                        Haptics.selectionAsync();
                        onPress();
                    }}
                    activeOpacity={0.65}
                    accessibilityRole="button"
                    accessibilityLabel={label}
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
                        {label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

export default HomeFooter;
