import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LucideIcon } from 'lucide-react-native';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

export interface BottomTab {
    key: string;
    icon: LucideIcon;
    /** Accessible label (always required for screen readers). Shown visually only when `showLabel` is true. */
    label: string;
    color?: string;
    onPress: () => void;
}

interface BottomTabsProps {
    tabs: BottomTab[];
    /** When true, render the label text under the icon. Default: icon-only (label remains as accessibility label). */
    showLabel?: boolean;
    style?: ViewStyle;
}

/**
 * BottomTabs — equal-width row of large icon-first tabs.
 *
 * By default tabs are icon-only (universal symbols: Trophy, Cart, Target,
 * Settings) with the label exposed only via `accessibilityLabel` for
 * screen readers. Pass `showLabel` to render the label under the icon.
 * Each tab meets 44pt tap target.
 */
export function BottomTabs({ tabs, showLabel = false, style }: BottomTabsProps) {
    return (
        <View
            style={[
                {
                    flexDirection: 'row',
                    gap: SPACING.sm,
                },
                style,
            ]}
        >
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const color = tab.color ?? '#e8d4b8';
                const handlePress = () => {
                    Haptics.selectionAsync();
                    tab.onPress();
                };
                return (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={handlePress}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={tab.label}
                        style={{
                            flex: 1,
                            minHeight: showLabel ? 72 : 64,
                            paddingVertical: SPACING.sm,
                            paddingHorizontal: SPACING.xs,
                            borderRadius: RADII.lg,
                            backgroundColor: 'rgba(26, 17, 9, 0.85)',
                            borderWidth: 1,
                            borderColor: 'rgba(90, 64, 37, 0.6)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: SPACING.xs,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 4,
                        }}
                    >
                        <Icon size={showLabel ? 26 : 32} color={color} strokeWidth={2} />
                        {showLabel ? (
                            <Text
                                style={[
                                    TEXT_STYLES.captionUpper,
                                    { color: '#d4b896', textAlign: 'center' },
                                ]}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.2}
                            >
                                {tab.label}
                            </Text>
                        ) : null}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default BottomTabs;
