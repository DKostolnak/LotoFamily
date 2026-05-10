import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Trophy, ShoppingCart, Settings as SettingsIcon, HelpCircle } from 'lucide-react-native';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

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
 * HomeFooter — minimalist 3-icon row beneath the hero. Holds secondary
 * destinations (Stats, Shop, Settings) plus a tertiary "How to play"
 * link. Replaces the noisier 4-tab BottomTabs on the home screen.
 */
export function HomeFooter({
    onStatsPress,
    onShopPress,
    onSettingsPress,
    onHelpPress,
    bottomInset = 0,
    labels,
}: HomeFooterProps) {
    const items: Array<{ key: string; icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; label: string; onPress: () => void }> = [
        { key: 'stats', icon: Trophy, label: labels?.stats ?? 'Stats', onPress: onStatsPress },
        { key: 'shop', icon: ShoppingCart, label: labels?.shop ?? 'Shop', onPress: onShopPress },
        { key: 'settings', icon: SettingsIcon, label: labels?.settings ?? 'Settings', onPress: onSettingsPress },
    ];

    const handlePress = (fn: () => void) => {
        Haptics.selectionAsync();
        fn();
    };

    return (
        <View
            style={{
                paddingHorizontal: SPACING.lg,
                paddingTop: SPACING.md,
                paddingBottom: bottomInset + SPACING.sm,
                backgroundColor: 'rgba(26, 17, 9, 0.85)',
                borderTopWidth: 1,
                borderTopColor: 'rgba(90, 64, 37, 0.45)',
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
                {items.map(({ key, icon: Icon, label, onPress }) => (
                    <TouchableOpacity
                        key={key}
                        onPress={() => handlePress(onPress)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        style={{
                            flex: 1,
                            minHeight: 60,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: SPACING.sm,
                            gap: SPACING.xs,
                            borderRadius: RADII.md,
                        }}
                    >
                        <Icon size={26} color="#d4b896" strokeWidth={2.2} />
                        <Text
                            style={[
                                TEXT_STYLES.captionUpper,
                                { color: '#d4b896' },
                            ]}
                            numberOfLines={1}
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                onPress={() => handlePress(onHelpPress)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={labels?.help ?? 'How to play'}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: SPACING.xs,
                    minHeight: 36,
                    marginTop: SPACING.xs,
                    opacity: 0.55,
                }}
            >
                <HelpCircle size={14} color="#d4b896" />
                <Text style={[TEXT_STYLES.caption, { color: '#d4b896' }]}>
                    {labels?.help ?? 'How to play'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

export default HomeFooter;
