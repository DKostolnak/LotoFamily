'use client';

import React, { forwardRef } from 'react';

export interface WoodenInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    fullWidth?: boolean;
}

export const WoodenInput = forwardRef<HTMLInputElement, WoodenInputProps>(
    function WoodenInput({ label, fullWidth = true, style, ...props }, ref) {
        return (
            <div style={{ width: fullWidth ? '100%' : 'auto' }}>
                {label && (
                    <label style={{
                        display: 'block',
                        color: '#8b6b4a',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        marginBottom: '8px',
                        textTransform: 'uppercase'
                    }}>
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    style={{
                        width: '100%',
                        padding: 'clamp(12px, 2vw, 16px)',
                        backgroundColor: '#1a1109',
                        border: '2px solid #5a4025',
                        borderRadius: '12px',
                        fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                        color: '#ffd700',
                        fontWeight: 'bold',
                        outline: 'none',
                        textAlign: 'left',
                        ...style
                    }}
                    {...props}
                />
            </div>
        );
    }
);
