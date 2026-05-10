import React from 'react';
import { Text, View, ViewStyle, TextStyle, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    className?: string;
    accessibilityLabel?: string;
    accessibilityHint?: string;
}

/**
 * VARIANT_STYLE — visual identity per variant.
 *
 * `gradient` — top → bottom gradient stops, gives the wood/metal sheen.
 * `border` — outer border color (gold or matching tone).
 * `bevel` — top inner highlight color (lighter, simulates light source).
 * `text` — label color.
 * `shadow` — drop shadow color (used for the press-down 3D effect).
 */
const VARIANT_STYLE = {
    primary: {
        gradient: ['#d9b67c', '#a37947', '#7c5a36'],
        border: '#5a4025',
        bevel: 'rgba(255, 240, 200, 0.55)',
        text: '#2d1f10',
        shadow: '#1a1109',
    },
    secondary: {
        gradient: ['#5a4025', '#3d2814', '#2d1f10'],
        border: '#7a5635',
        bevel: 'rgba(255, 240, 200, 0.18)',
        text: '#f5e6c8',
        shadow: '#0d0703',
    },
    danger: {
        gradient: ['#f87171', '#dc2626', '#991b1b'],
        border: '#7f1d1d',
        bevel: 'rgba(255, 255, 255, 0.35)',
        text: '#ffffff',
        shadow: '#450a0a',
    },
    gold: {
        gradient: ['#ffe87a', '#ffd700', '#b8860b'],
        border: '#7a5b08',
        bevel: 'rgba(255, 255, 255, 0.5)',
        text: '#2d1f10',
        shadow: '#5a4205',
    },
    success: {
        gradient: ['#86efac', '#22c55e', '#15803d'],
        border: '#14532d',
        bevel: 'rgba(255, 255, 255, 0.3)',
        text: '#0a3015',
        shadow: '#052e16',
    },
    info: {
        gradient: ['#93c5fd', '#3b82f6', '#1e3a8a'],
        border: '#1e3a8a',
        bevel: 'rgba(255, 255, 255, 0.3)',
        text: '#ffffff',
        shadow: '#0c1e4a',
    },
    ghost: {
        gradient: ['transparent', 'transparent', 'transparent'],
        border: 'rgba(212, 184, 150, 0.35)',
        bevel: 'transparent',
        text: '#d4b896',
        shadow: 'transparent',
    },
} as const satisfies Record<WoodenButtonVariant, {
    gradient: readonly [string, string, string];
    border: string;
    bevel: string;
    text: string;
    shadow: string;
}>;

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
    const v = VARIANT_STYLE[variant];

    // Buttons need real visual mass — make sure short labels don't render
    // as anemic 60pt-wide stubs. Min width scales with size.
    const minWidth =
        size === 'xl' ? 200 : size === 'lg' ? 160 : size === 'md' ? 120 : 88;

    // Lift depth — gives the 3D press feedback. Scales with button size so
    // the small chips don't get a comically deep shadow.
    const liftDepth =
        size === 'xl' ? 6 : size === 'lg' ? 5 : size === 'md' ? 4 : 3;

    const handlePress = () => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };

    // Treat children as text content if every child is a primitive (string,
    // number, null/undefined). Mixed JSX like `{label} +{amount}` becomes an
    // array of [string, " +", number] which previously fell through to the
    // "render as-is" branch and triggered "Text strings must be rendered
    // within a <Text> component". Wrap such collections in a <Text>.
    const childArray = React.Children.toArray(children);
    const isStringChild =
        childArray.length > 0 &&
        childArray.every(
            (c) => typeof c === 'string' || typeof c === 'number'
        );

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
            className={className}
            style={({ pressed }) => [
                {
                    height: sizeConfig.height,
                    paddingHorizontal: sizeConfig.paddingHorizontal,
                    minWidth: fullWidth ? undefined : minWidth,
                    width: fullWidth ? '100%' : undefined,
                    borderRadius: RADII.lg,
                    borderWidth: variant === 'ghost' ? 1 : 2,
                    borderColor: v.border,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    transform: [{ translateY: pressed ? liftDepth : 0 }],
                    shadowColor: v.shadow,
                    shadowOffset: { width: 0, height: pressed ? 1 : liftDepth },
                    shadowOpacity: variant === 'ghost' ? 0 : 0.55,
                    shadowRadius: variant === 'ghost' ? 0 : 0.5,
                    elevation: variant === 'ghost' ? 0 : liftDepth,
                    marginBottom: pressed ? 0 : liftDepth,
                    marginTop: pressed ? liftDepth : 0,
                    opacity: disabled ? 0.55 : 1,
                },
                style,
            ]}
            hitSlop={6}
        >
            {/* Wood/metal gradient body (skip on ghost). */}
            {variant !== 'ghost' && (
                <LinearGradient
                    pointerEvents="none"
                    colors={v.gradient as unknown as readonly [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            )}

            {/* Top bevel highlight — simulates a light source above. */}
            {variant !== 'ghost' && (
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        backgroundColor: v.bevel,
                        opacity: 0.85,
                    }}
                />
            )}

            {/* Inner shadow at bottom — depth feel. */}
            {variant !== 'ghost' && (
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '35%',
                        backgroundColor: 'rgba(0, 0, 0, 0.15)',
                    }}
                />
            )}

            {icon && (
                <View style={{ marginRight: SPACING.sm }}>{icon}</View>
            )}

            {isStringChild ? (
                <Text
                    style={[
                        sizeConfig.textStyle,
                        { color: v.text, textAlign: 'center', flexShrink: 1 },
                        textStyle,
                    ]}
                    numberOfLines={multiline ? 2 : 1}
                >
                    {children}
                </Text>
            ) : (
                children
            )}
        </Pressable>
    );
}
