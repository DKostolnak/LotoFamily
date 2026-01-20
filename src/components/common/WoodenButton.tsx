import React from 'react';
import { Text, View, ViewStyle, Pressable } from 'react-native';
import clsx from 'clsx';
import * as Haptics from 'expo-haptics';
import { useResponsive } from '@/hooks';

export type WoodenButtonSize = 'sm' | 'md' | 'lg';
export type WoodenButtonVariant = 'primary' | 'secondary' | 'danger' | 'gold' | 'success' | 'info';

export interface WoodenButtonProps {
    children: React.ReactNode;
    size?: WoodenButtonSize;
    variant?: WoodenButtonVariant;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    onPress?: () => void;
    className?: string; // For NativeWind
    accessibilityLabel?: string;
}

const SIZE_STYLES = {
    sm: { paddingHorizontal: 12, height: 36, fontSize: 14, iconSize: 16 },
    md: { paddingHorizontal: 20, height: 48, fontSize: 16, iconSize: 20 },
    lg: { paddingHorizontal: 32, height: 60, fontSize: 20, iconSize: 28 },
} as const;

const VARIANT_CONFIG = {
    primary: {
        bg: 'bg-[#d4b075]', // Approximation of primary gradient
        border: 'border-[#a6814c]',
        textColor: 'text-[#3d2814]',
        shadowColor: '#5a4025',
    },
    secondary: {
        bg: 'bg-[#8b7355]',
        border: 'border-[#6b5336]',
        textColor: 'text-[#f5e6c8]',
        shadowColor: '#3d2814',
    },
    danger: {
        bg: 'bg-[#ef5350]',
        border: 'border-[#c62828]',
        textColor: 'text-white',
        shadowColor: '#8b0000',
    },
    gold: {
        bg: 'bg-[#ffd700]',
        border: 'border-[#ffc107]',
        textColor: 'text-[#3d2814]',
        shadowColor: '#b8860b',
    },
    success: {
        bg: 'bg-[#22c55e]',
        border: 'border-[#15803d]',
        textColor: 'text-white',
        shadowColor: '#14532d',
    },
    info: {
        bg: 'bg-[#3b82f6]',
        border: 'border-[#1d4ed8]',
        textColor: 'text-white',
        shadowColor: '#1e3a8a',
    },
};

export function WoodenButton({
    children,
    size = 'md',
    variant = 'primary',
    icon,
    fullWidth = false,
    disabled,
    style,
    onPress,
    className,
    accessibilityLabel,
}: WoodenButtonProps) {
    const { scale, scaleFont } = useResponsive();

    const sizeConfig = SIZE_STYLES[size];
    const variantConfig = VARIANT_CONFIG[variant];

    // Keep touch targets >= 44pt. Scale up on tablets, gently down on tiny screens.
    const scaledHeight = Math.max(44, scale(sizeConfig.height));
    const scaledPaddingX = Math.max(12, scale(sizeConfig.paddingHorizontal));
    const scaledFontSize = scaleFont(sizeConfig.fontSize, 12);
    const shadowHeight = Math.max(4, Math.round(scale(6)));

    const handlePress = () => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
            accessibilityState={{ disabled }}
            className={clsx(
                'items-center justify-center flex-row rounded-xl',
                fullWidth ? 'w-full' : 'self-start',
                variantConfig.bg,
                disabled && 'opacity-60',
                className
            )}
            style={({ pressed }) => ({
                height: scaledHeight,
                paddingHorizontal: scaledPaddingX,
                transform: [{ translateY: pressed ? 4 : 0 }],
                shadowColor: variantConfig.shadowColor,
                shadowOffset: { width: 0, height: pressed ? 0 : shadowHeight },
                shadowOpacity: 1,
                shadowRadius: 0,
                borderBottomWidth: pressed ? 0 : 0, // Border simulated by shadow
                marginBottom: pressed ? 0 : shadowHeight, // Maintain layout space
                marginTop: pressed ? shadowHeight : 0,
                ...style,
            })}
            hitSlop={8}
        >
            {/* Top Bevel Highlight */}
            <View className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl bg-white/15 pointer-events-none" />

            {icon && <View className="mr-2">{icon}</View>}

            <Text
                className={clsx('font-bold', variantConfig.textColor)}
                style={{ fontSize: scaledFontSize }}
            >
                {children}
            </Text>
        </Pressable>
    );
}
