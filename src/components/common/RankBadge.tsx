/// <reference types="nativewind/types" />
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks';

interface RankBadgeProps {
    tier: string;
    size?: 'sm' | 'md';
    className?: string;
    style?: ViewStyle;
}

export function RankBadge({ tier, size = 'md', className, style }: RankBadgeProps) {
    const { scale, scaleFont } = useResponsive();
    const isSmall = size === 'sm';

    const paddingY = scale(isSmall ? 4 : 6);
    const paddingX = scale(isSmall ? 8 : 12);
    const radius = scale(isSmall ? 12 : 20);
    const gap = scale(isSmall ? 4 : 8);
    const emojiSize = scaleFont(isSmall ? 14 : 16, 12);
    const labelSize = scaleFont(isSmall ? 12 : 14, 10);

    const getRankName = (t: string) => {
        const tierNum = parseInt(t);
        if (tierNum === 1) return 'BRONZE';
        if (tierNum === 2) return 'SILVER';
        if (tierNum === 3) return 'GOLD';
        if (tierNum === 4) return 'PLATINUM';
        if (tierNum === 5) return 'DIAMOND';
        return `TIER ${t}`;
    };

    return (
        <View
            className={`flex-row items-center bg-black/40 border border-[#ffd700]/30 ${className}`}
            style={{
                paddingVertical: paddingY,
                paddingHorizontal: paddingX,
                borderRadius: radius,
                gap,
                ...style,
            }}
        >
            <Text style={{ fontSize: emojiSize }}>🏆</Text>
            <Text
                style={{
                    color: '#ffd700',
                    fontWeight: '900',
                    fontSize: labelSize,
                    letterSpacing: 0.5,
                }}
            >
                {getRankName(tier)}
            </Text>
        </View>
    );
}

export default RankBadge;
