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
        padding: '0 12px',
        fontSize: '0.875rem',
        height: '36px',
        iconSize: '16px',
    },
    md: {
        padding: '0 20px',
        fontSize: '1rem',
        height: '48px',
        iconSize: '20px',
    },
    lg: {
        padding: '0 32px',
        fontSize: '1.25rem',
        height: '60px', // Taller for more substantial feel
        iconSize: '28px',
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
        // Richer gradient
        background: 'linear-gradient(180deg, #d4b075 0%, #a6814c 40%, #8c6a3d 100%)',
        border: 'none', // Border is handled by shadow/inset
        shadow: '0 6px 0 #5a4025, 0 12px 12px rgba(0,0,0,0.3)',
        textColor: '#3d2814',
        hasTextShadow: false,
    },
    secondary: {
        background: 'linear-gradient(180deg, #8b7355 0%, #6b5336 100%)',
        border: 'none',
        shadow: '0 6px 0 #3d2814, 0 12px 12px rgba(0,0,0,0.3)',
        textColor: '#f5e6c8',
        hasTextShadow: true,
    },
    danger: {
        background: 'linear-gradient(180deg, #ef5350 0%, #c62828 100%)',
        border: 'none',
        shadow: '0 6px 0 #8b0000, 0 12px 12px rgba(0,0,0,0.3)',
        textColor: '#fff',
        hasTextShadow: true,
    },
    gold: {
        background: 'linear-gradient(180deg, #ffd700 0%, #ffc107 40%, #ffb300 100%)',
        border: 'none',
        shadow: '0 6px 0 #b8860b, 0 12px 12px rgba(0,0,0,0.3), 0 0 15px rgba(255, 215, 0, 0.4)',
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
            border: 'none',
            boxShadow: disabled ? 'none' : variantStyle.shadow,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            // Smooth transitions for everything except the press
            transition: 'all 0.1s ease',
            width: fullWidth ? '100%' : 'auto',
            minHeight: sizeStyle.height,
            textShadow: variantStyle.hasTextShadow ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            position: 'relative',
            transform: 'translateY(0)',
            ...style,
        };

        return (
            <button
                ref={ref}
                type="button"
                disabled={disabled}
                style={buttonStyles}
                className="wooden-button"
                onMouseDown={(e) => {
                    if (disabled) return;
                    e.currentTarget.style.transform = 'translateY(4px)';
                    // Squash the shadow to look like it's pressed into the table
                    e.currentTarget.style.boxShadow = `0 0 0 ${variantStyle.shadow.split(' ')[3] || 'transparent'}, 0 0 0 rgba(0,0,0,0)`;
                }}
                onMouseUp={(e) => {
                    if (disabled) return;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = variantStyle.shadow;
                }}
                onMouseLeave={(e) => {
                    if (disabled) return;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = variantStyle.shadow;
                }}
                onTouchStart={(e) => {
                    if (disabled) return;
                    e.currentTarget.style.transform = 'translateY(4px)';
                    e.currentTarget.style.boxShadow = `0 0 0 ${variantStyle.shadow.split(' ')[3] || 'transparent'}, 0 0 0 rgba(0,0,0,0)`;
                }}
                onTouchEnd={(e) => {
                    if (disabled) return;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = variantStyle.shadow;
                }}
                {...buttonProps}
            >
                {/* Top Bevel Highlight (Glass Edge) */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    borderRadius: '12px 12px 0 0',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)',
                    pointerEvents: 'none',
                }} />

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
                <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
            </button>
        );
    }
);

export default WoodenButton;
