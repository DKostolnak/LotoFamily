import React from 'react';
import { Text, View, ViewStyle, TextStyle, Pressable } from 'react-native';
import clsx from 'clsx';
import * as Haptics from 'expo-haptics';
import { BUTTON_SIZES, RADII, SPACING } from '@/lib/config';

export type WoodenButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type WoodenButtonVariant =
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'gold'
    | 'success'
    | 'info'
    | 'ghost';

export interface WoodenButtonProps {
    children: React.ReactNode;
    size?: WoodenButtonSize;
    variant?: WoodenButtonVariant;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    disabled?: boolean;
    /** Allow text to wrap to 2 lines (for long localized labels). */
    multiline?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    onPress?: () => void;
    className?: string; // For NativeWind
    accessibilityLabel?: string;
    accessibilityHint?: string;
}

const VARIANT_CONFIG = {
    primary: {
        bg: 'bg-[#d4b075]',
        textColor: 'text-wood-dark',
        shadowColor: '#5a4025',
    },
    secondary: {
        bg: 'bg-[#8b7355]',
        textColor: 'text-cream',
        shadowColor: '#3d2814',
    },
    danger: {
        bg: 'bg-[#ef5350]',
        textColor: 'text-white',
        shadowColor: '#8b0000',
    },
    gold: {
        bg: 'bg-gold',
        textColor: 'text-wood-dark',
        shadowColor: '#b8860b',
    },
    success: {
        bg: 'bg-[#22c55e]',
        textColor: 'text-white',
        shadowColor: '#14532d',
    },
    info: {
        bg: 'bg-[#3b82f6]',
        textColor: 'text-white',
        shadowColor: '#1e3a8a',
    },
    ghost: {
        bg: 'bg-transparent',
        textColor: 'text-cream',
        shadowColor: 'transparent',
    },
} as const;

export function WoodenButton({
    children,
    size = 'lg',
    variant = 'primary',
    icon,
    fullWidth = false,
    disabled,
    multiline = false,
    style,
    textStyle,
    onPress,
    className,
    accessibilityLabel,
    accessibilityHint,
}: WoodenButtonProps) {
    const sizeConfig = BUTTON_SIZES[size];
    const variantConfig = VARIANT_CONFIG[variant];
    const shadowHeight = 6;

    const handlePress = () => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };

    const isStringChild =
        typeof children === 'string' || typeof children === 'number';

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={
                accessibilityLabel ||
                (typeof children === 'string' ? children : undefined)
            }
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled }}
            className={clsx(
                'items-center justify-center flex-row',
                fullWidth ? 'w-full' : 'self-start',
                variantConfig.bg,
                disabled && 'opacity-60',
                className
            )}
            style={({ pressed }) => ({
                height: sizeConfig.height,
                paddingHorizontal: sizeConfig.paddingHorizontal,
                borderRadius: RADII.lg,
                transform: [{ translateY: pressed ? 4 : 0 }],
                shadowColor: variantConfig.shadowColor,
                shadowOffset: { width: 0, height: pressed ? 0 : shadowHeight },
                shadowOpacity: variant === 'ghost' ? 0 : 1,
                shadowRadius: 0,
                marginBottom: pressed ? 0 : shadowHeight,
                marginTop: pressed ? shadowHeight : 0,
                ...style,
            })}
            hitSlop={8}
        >
            {/* Top bevel highlight (skip on ghost). */}
            {variant !== 'ghost' && (
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        borderTopLeftRadius: RADII.lg,
                        borderTopRightRadius: RADII.lg,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                    }}
                />
            )}

            {icon && <View style={{ marginRight: SPACING.sm }}>{icon}</View>}

            {isStringChild ? (
                <Text
                    className={clsx('font-bold', variantConfig.textColor)}
                    style={[
                        sizeConfig.textStyle,
                        { textAlign: 'center', flexShrink: 1 },
                        textStyle,
                    ]}
                    numberOfLines={multiline ? 2 : 1}
                    // NOTE: deliberately no adjustsFontSizeToFit / minimumFontScale —
                    // labels must remain at native size for the 30-70+ audience.
                >
                    {children}
                </Text>
            ) : (
                children
            )}
        </Pressable>
    );
}
