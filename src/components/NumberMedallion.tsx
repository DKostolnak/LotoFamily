'use client';

import React, { useEffect, useState } from 'react';

interface NumberMedallionProps {
    number: number | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * NumberMedallion Component
 * Displays the current called number in a decorative medallion with entrance animation
 */
export default function NumberMedallion({
    number,
    size = 'md',
    className = '',
}: NumberMedallionProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [displayNumber, setDisplayNumber] = useState(number);

    useEffect(() => {
        if (number !== displayNumber && number !== null) {
            // Trigger animation
            setIsAnimating(true);

            // Update displayed number after a tiny delay for the "pop" effect
            const timer = setTimeout(() => {
                setDisplayNumber(number);
            }, 50);

            // Reset animation state
            const resetTimer = setTimeout(() => {
                setIsAnimating(false);
            }, 600);

            return () => {
                clearTimeout(timer);
                clearTimeout(resetTimer);
            };
        } else if (number === null) {
            setDisplayNumber(null);
        }
    }, [number, displayNumber]);

    const sizeClass = size === 'sm' ? 'medallion-sm' : size === 'lg' ? 'medallion-lg' : '';

    return (
        <div
            className={`medallion ${sizeClass} ${className} ${isAnimating ? 'medallion-animate' : ''}`}
            style={{
                transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
                transform: isAnimating ? 'scale(1.15)' : 'scale(1)',
                boxShadow: isAnimating
                    ? '0 0 30px rgba(255, 193, 7, 0.8), 0 10px 20px rgba(0, 0, 0, 0.3)'
                    : undefined,
            }}
        >
            {displayNumber !== null ? displayNumber : '?'}
        </div>
    );
}

