'use client';

import React, { useEffect, useState, useRef } from 'react';

interface NumberMedallionProps {
    number: number | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * NumberMedallion Component
 * Displays the current called number in a decorative medallion with dramatic pop-in animation
 * Number appears large then shrinks into position
 */
export default function NumberMedallion({
    number,
    size = 'md',
    className = '',
}: NumberMedallionProps) {
    const [animationPhase, setAnimationPhase] = useState<'idle' | 'pop-in' | 'shrink'>('idle');
    const [displayNumber, setDisplayNumber] = useState(number);
    const prevNumberRef = useRef(number);

    useEffect(() => {
        if (number !== prevNumberRef.current && number !== null) {
            // Phase 1: Pop in big
            setAnimationPhase('pop-in');
            setDisplayNumber(number);

            // Phase 2: Shrink to normal after pop
            const shrinkTimer = setTimeout(() => {
                setAnimationPhase('shrink');
            }, 150);

            // Phase 3: Return to idle
            const idleTimer = setTimeout(() => {
                setAnimationPhase('idle');
            }, 600);

            prevNumberRef.current = number;

            return () => {
                clearTimeout(shrinkTimer);
                clearTimeout(idleTimer);
            };
        } else if (number === null) {
            setDisplayNumber(null);
            prevNumberRef.current = null;
        }
    }, [number]);

    const sizeClass = size === 'sm' ? 'medallion-sm' : size === 'lg' ? 'medallion-lg' : '';

    // Calculate scale based on animation phase
    const getTransform = () => {
        switch (animationPhase) {
            case 'pop-in':
                return 'scale(1.5)'; // Start BIG
            case 'shrink':
                return 'scale(1.0)'; // Shrink to normal
            default:
                return 'scale(1)';
        }
    };

    // Get transition based on phase
    const getTransition = () => {
        switch (animationPhase) {
            case 'pop-in':
                return 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease';
            case 'shrink':
                return 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.45s ease';
            default:
                return 'transform 0.3s ease, box-shadow 0.3s ease';
        }
    };

    // Get box shadow based on animation phase
    const getBoxShadow = () => {
        if (animationPhase === 'pop-in') {
            return '0 0 50px rgba(255, 193, 7, 1), 0 0 80px rgba(255, 193, 7, 0.6), 0 15px 30px rgba(0, 0, 0, 0.4)';
        } else if (animationPhase === 'shrink') {
            return '0 0 25px rgba(255, 193, 7, 0.6), 0 10px 20px rgba(0, 0, 0, 0.3)';
        }
        return undefined;
    };

    return (
        <div
            className={`medallion ${sizeClass} ${className}`}
            style={{
                transition: getTransition(),
                transform: getTransform(),
                boxShadow: getBoxShadow(),
                willChange: animationPhase !== 'idle' ? 'transform, box-shadow' : undefined,
            }}
        >
            {displayNumber !== null ? displayNumber : '?'}
        </div>
    );
}

