'use client';

/**
 * WoodenButton Component
 * 
 * A reusable button with wooden-themed styling matching the game's aesthetic.
 * Supports multiple sizes and variants with consistent 3D depth effect.
 * 
 * @example
 * <WoodenButton onClick={handleClick} size="md" variant="primary">
 *   Start Game
 * </WoodenButton>
 */

import React, { forwardRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type WoodenButtonSize = 'sm' | 'md' | 'lg';
export type WoodenButtonVariant = 'primary' | 'secondary' | 'danger' | 'gold';

export interface WoodenButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
    /** Button content */
    children: React.ReactNode;
    /** Button size variant */
    size?: WoodenButtonSize;
    /** Color/style variant */
    variant?: WoodenButtonVariant;
    /** Optional icon to display before text */
    icon?: React.ReactNode;
    /** Whether the button takes full width */
    fullWidth?: boolean;
    /** Additional inline styles */
    style?: React.CSSProperties;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_STYLES: Record<WoodenButtonSize, {
    padding: string;
    fontSize: string;
    height: string;
    iconSize: string;
}> = {
    sm: {
        padding: '8px 12px',
        fontSize: '0.875rem',
        height: '36px',
        iconSize: '16px',
    },
    md: {
        padding: '12px 18px',
        fontSize: '1rem',
        height: '44px',
        iconSize: '20px',
    },
    lg: {
        padding: '16px 24px',
        fontSize: '1.125rem',
        height: '52px',
        iconSize: '24px',
    },
};

const VARIANT_STYLES: Record<WoodenButtonVariant, {
    background: string;
    border: string;
    shadow: string;
    textColor: string;
    hasTextShadow: boolean;
}> = {
    primary: {
        background: 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)',
        border: '2px solid #5a4025',
        shadow: '0 3px 0 #3d2814',
        textColor: '#3d2814',
        hasTextShadow: false,
    },
    secondary: {
        background: 'linear-gradient(145deg, #8b7355 0%, #6b5640 100%)',
        border: '2px solid #4a3828',
        shadow: '0 3px 0 #2d1f10',
        textColor: '#f5e6c8',
        hasTextShadow: true,
    },
    danger: {
        background: 'linear-gradient(145deg, #e85d5d 0%, #c23a3a 100%)',
        border: '2px solid #8b2020',
        shadow: '0 3px 0 #6b1515',
        textColor: '#fff',
        hasTextShadow: true,
    },
    gold: {
        background: 'linear-gradient(145deg, #ffd700 0%, #daa520 100%)',
        border: '2px solid #b8860b',
        shadow: '0 3px 0 #8b6914',
        textColor: '#3d2814',
        hasTextShadow: false,
    },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const WoodenButton = forwardRef<HTMLButtonElement, WoodenButtonProps>(
    function WoodenButton(
        {
            children,
            size = 'md',
            variant = 'primary',
            icon,
            fullWidth = false,
            style,
            disabled,
            ...buttonProps
        },
        ref
    ) {
        const sizeStyle = SIZE_STYLES[size];
        const variantStyle = VARIANT_STYLES[variant];

        const buttonStyles: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: sizeStyle.padding,
            fontSize: sizeStyle.fontSize,
            fontWeight: 700,
            lineHeight: 1.2,
            color: variantStyle.textColor,
            background: disabled ? '#888' : variantStyle.background,
            borderRadius: '12px',
            border: variantStyle.border,
            boxShadow: disabled ? 'none' : `${variantStyle.shadow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'transform 0.1s ease, box-shadow 0.1s ease',
            width: fullWidth ? '100%' : 'auto',
            minHeight: sizeStyle.height,
            textShadow: variantStyle.hasTextShadow ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            ...style,
        };

        return (
            <button
                ref={ref}
                type="button"
                disabled={disabled}
                style={buttonStyles}
                className="active:scale-95 active:shadow-none"
                {...buttonProps}
            >
                {icon && (
                    <span
                        style={{
                            display: 'flex',
                            width: sizeStyle.iconSize,
                            height: sizeStyle.iconSize,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {icon}
                    </span>
                )}
                {children}
            </button>
        );
    }
);

export default WoodenButton;
