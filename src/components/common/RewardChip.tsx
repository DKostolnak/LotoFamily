import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';
import type { LucideIcon } from 'lucide-react-native';

export type RewardChipVariant = 'gold' | 'success' | 'info';

export interface RewardChipProps {
    /** Emoji string ('✨') or a Lucide icon component */
    icon: string | LucideIcon;
    /** Caption label (e.g. 'mincí', 'XP') */
    label: string;
    /** Numeric or pre-formatted value (e.g. 1000 or '+1000') */
    value: number | string;
    variant?: RewardChipVariant;
    style?: ViewStyle;
}

const VARIANTS: Record<RewardChipVariant, {
    bg: string;
    border: string;
    valueColor: string;
    labelColor: string;
    iconColor: string;
}> = {
    gold: {
        bg: 'rgba(255, 215, 0, 0.12)',
        border: 'rgba(255, 215, 0, 0.45)',
        valueColor: '#ffd700',
        labelColor: '#d4b896',
        iconColor: '#ffd700',
    },
    success: {
        bg: 'rgba(74, 222, 128, 0.12)',
        border: 'rgba(74, 222, 128, 0.45)',
        valueColor: '#4ade80',
        labelColor: '#d4b896',
        iconColor: '#4ade80',
    },
    info: {
        bg: 'rgba(96, 165, 250, 0.12)',
        border: 'rgba(96, 165, 250, 0.45)',
        valueColor: '#93c5fd',
        labelColor: '#d4b896',
        iconColor: '#93c5fd',
    },
};

export const RewardChip = ({
    icon,
    label,
    value,
    variant = 'gold',
    style,
}: RewardChipProps) => {
    const v = VARIANTS[variant];
    const formatted = typeof value === 'number' ? `+${value.toLocaleString()}` : value;
    const isEmoji = typeof icon === 'string';
    const IconComp = !isEmoji ? (icon as LucideIcon) : null;

    return (
        <View
            style={[
                {
                    height: 56,
                    minWidth: 140,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: SPACING.lg,
                    backgroundColor: v.bg,
                    borderRadius: RADII.pill,
                    borderWidth: 1,
                    borderColor: v.border,
                    gap: SPACING.sm,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.18,
                    shadowRadius: 4,
                    elevation: 2,
                },
                style,
            ]}
            accessibilityRole="text"
            accessibilityLabel={`${formatted} ${label}`}
        >
            {isEmoji ? (
                <Text style={{ fontSize: 22 }} accessible={false}>
                    {icon as string}
                </Text>
            ) : IconComp ? (
                <IconComp size={22} color={v.iconColor} strokeWidth={2.5} />
            ) : null}
            <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                <Text
                    style={[
                        TEXT_STYLES.bodyBold,
                        { color: v.valueColor, lineHeight: 18 },
                    ]}
                    numberOfLines={1}
                >
                    {formatted}
                </Text>
                <Text
                    style={[
                        TEXT_STYLES.caption,
                        { color: v.labelColor, lineHeight: 14 },
                    ]}
                    numberOfLines={1}
                >
                    {label}
                </Text>
            </View>
        </View>
    );
};

export default RewardChip;
