/**
 * Badge — UNIFIED inline status pill (OWNED / ACTIVE / FREE / NEW etc.)
 *
 * Single source of truth for status badges — every modal that needs to
 * mark an item with a status pill MUST use this primitive instead of
 * rolling its own.
 */

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

export type BadgeVariant =
    | 'gold' // ACTIVE / EQUIPPED
    | 'success' // OWNED
    | 'info' // FREE
    | 'warning' // LOCKED
    | 'neutral'; // generic

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    style?: ViewStyle;
}

const VARIANTS: Record<
    BadgeVariant,
    { bg: string; border: string; text: string }
> = {
    gold: {
        bg: 'rgba(255, 215, 0, 0.15)',
        border: 'rgba(255, 215, 0, 0.6)',
        text: '#ffd700',
    },
    success: {
        bg: 'rgba(74, 222, 128, 0.12)',
        border: 'rgba(74, 222, 128, 0.5)',
        text: '#4ade80',
    },
    info: {
        bg: 'rgba(59, 130, 246, 0.15)',
        border: 'rgba(59, 130, 246, 0.5)',
        text: '#60a5fa',
    },
    warning: {
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.5)',
        text: '#f87171',
    },
    neutral: {
        bg: 'rgba(212, 184, 150, 0.12)',
        border: 'rgba(212, 184, 150, 0.4)',
        text: '#d4b896',
    },
};

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
    const v = VARIANTS[variant];
    return (
        <View
            style={[
                {
                    paddingHorizontal: SPACING.sm,
                    paddingVertical: 4,
                    borderRadius: RADII.pill,
                    borderWidth: 1,
                    backgroundColor: v.bg,
                    borderColor: v.border,
                    alignSelf: 'flex-start',
                },
                style,
            ]}
        >
            <Text
                style={[
                    TEXT_STYLES.captionUpper,
                    { color: v.text },
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </View>
    );
}

export default Badge;
