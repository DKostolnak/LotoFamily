'use client';

import React, { useState, useEffect, useRef } from 'react';

interface NumberHistoryProps {
    numbers: number[];
    maxVisible?: number;
}

/**
 * NumberHistory Component
 * Shows the last called numbers in small medallions with pop-shrink animation
 * New numbers appear big then shrink into the stack
 */
export default function NumberHistory({
    numbers,
    maxVisible = 5,
}: NumberHistoryProps) {
    const visibleNumbers = numbers.slice(-maxVisible).reverse();
    const [animationPhase, setAnimationPhase] = useState<'idle' | 'pop-in' | 'settle'>('idle');
    const prevLengthRef = useRef(numbers.length);

    useEffect(() => {
        if (numbers.length > prevLengthRef.current) {
            const popFrame = requestAnimationFrame(() => {
                setAnimationPhase('pop-in');
            });

            const settleTimer = window.setTimeout(() => {
                setAnimationPhase('settle');
            }, 150);

            const idleTimer = window.setTimeout(() => {
                setAnimationPhase('idle');
            }, 600);

            prevLengthRef.current = numbers.length;

            return () => {
                cancelAnimationFrame(popFrame);
                clearTimeout(settleTimer);
                clearTimeout(idleTimer);
            };
        }
        prevLengthRef.current = numbers.length;
    }, [numbers.length]);

    const getNewNumberStyle = () => {
        switch (animationPhase) {
            case 'pop-in':
                return {
                    transform: 'scale(1.4)',
                    boxShadow: '0 0 20px rgba(255, 193, 7, 0.8)',
                    transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                };
            case 'settle':
                return {
                    transform: 'scale(1)',
                    boxShadow: 'none',
                    transition: 'all 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                };
            default:
                return {
                    transform: 'scale(1)',
                    transition: 'all 0.3s ease-out',
                };
        }
    };

    return (
        <div className="number-history-container flex gap-1 items-center" style={{ overflow: 'visible', position: 'relative' }}>
            {visibleNumbers.map((num, index) => {
                const isNew = index === 0;
                const opacity = 1 - index * 0.15;

                return (
                    <div
                        key={`${num}-${numbers.length}-${index}`}
                        className="rounded-full flex items-center justify-center"
                        style={{
                            width: '32px',
                            height: '32px',
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                            padding: '2px',
                            boxShadow: isNew ? '0 0 12px rgba(255, 193, 7, 0.6)' : '0 1px 3px rgba(0,0,0,0.3)',
                            opacity,
                            zIndex: maxVisible - index,
                            ...(isNew ? getNewNumberStyle() : {
                                transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            }),
                        }}
                    >
                        <div
                            className="rounded-full w-full h-full flex items-center justify-center"
                            style={{
                                background: '#DEB887',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
                            }}
                        >
                            <span className="text-sm font-bold" style={{ color: '#5d4037' }}>
                                {num}
                            </span>
                        </div>
                    </div>
                );
            })}
            {numbers.length > maxVisible && (
                <span
                    className="history-more"
                    style={{
                        color: 'var(--color-text-light)',
                        opacity: 0.7,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        background: 'rgba(0,0,0,0.4)',
                        padding: '2px 5px',
                        borderRadius: '8px',
                    }}
                >
                    +{numbers.length - maxVisible}
                </span>
            )}
        </div>
    );
}

