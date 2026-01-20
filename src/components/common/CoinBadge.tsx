import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { k_colorGold } from '@/lib/constants';
import { useResponsive } from '@/hooks';

interface CoinBadgeProps {
    coins: number;
    size?: 'sm' | 'md';
    className?: string; // For NativeWind
    style?: ViewStyle;
}

export function CoinBadge({ coins, size = 'md', className, style }: CoinBadgeProps) {
    const { scale, scaleFont } = useResponsive();
    const isSmall = size === 'sm';

    const paddingY = scale(isSmall ? 4 : 6);
    const paddingX = scale(isSmall ? 8 : 12);
    const radius = scale(isSmall ? 12 : 20);
    const gap = scale(isSmall ? 4 : 8);
    const emojiSize = scaleFont(isSmall ? 16 : 20, 14);
    const valueSize = scaleFont(isSmall ? 14 : 18, 12);

    return (
        <View
            className={`flex-row items-center bg-black/40 border border-[${k_colorGold}]/30 ${className}`}
            accessibilityLabel={`${coins} coins`}
            accessibilityRole="text"
            style={{
                paddingVertical: paddingY,
                paddingHorizontal: paddingX,
                borderRadius: radius,
                gap,
                ...style,
            }}
        >
            <Text style={{ fontSize: emojiSize }}>💰</Text>
            <Text
                style={{
                    color: k_colorGold,
                    fontWeight: 'bold',
                    fontFamily: 'monospace', // Or Platform.OS === 'ios' ? 'Courier' : 'monospace'
                    fontSize: valueSize,
                }}
            >
                {coins}
            </Text>
        </View>
    );
}

export default CoinBadge;
