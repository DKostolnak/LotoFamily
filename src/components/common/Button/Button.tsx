/**
 * Button Component
 * 
 * Reusable button with consistent styling and haptic feedback.
 * Supports multiple variants matching the design system.
 */

'use client';

import React, { forwardRef, type ButtonHTMLAttributes } from 'react';
import { useHaptics } from '@/hooks/useHaptics';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'info' | 'warning' | 'purple' | 'wood';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    hapticFeedback?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            hapticFeedback = true,
            className = '',
            disabled,
            onClick,
            children,
            ...props
        },
        ref
    ) => {
        const { vibrate } = useHaptics();

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (hapticFeedback) {
                vibrate('light');
            }
            onClick?.(e);
        };

        const sizeClasses: Record<ButtonSize, string> = {
            xs: 'btn-xs',
            sm: 'btn-sm',
            md: '',
            lg: 'btn-lg',
            icon: 'btn-icon',
        };

        const classes = [
            'btn',
            `btn-${variant}`,
            sizeClasses[size],
            isLoading && 'opacity-70 cursor-wait',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <button
                ref={ref}
                className={classes}
                disabled={disabled || isLoading}
                onClick={handleClick}
                {...props}
            >
                {isLoading ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                    children
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
export default Button;
