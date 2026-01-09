'use client';

import React, { useMemo } from 'react';
import { LotoCard } from '@/lib/types';
import type { TranslationDictionary } from '@/lib/translations';

interface GameProgressProps {
    cards: LotoCard[];
    calledNumbers: number[];
    t: TranslationDictionary;
}

/**
 * GameProgress Component
 * Shows overall progress across all player cards with a visual progress bar
 */
export default function GameProgress({ cards, calledNumbers, t }: GameProgressProps) {
    const { totalNumbers, markedCorrectly, remaining, progressPercent } = useMemo(() => {
        let total = 0;
        let marked = 0;

        cards.forEach(card => {
            card.grid.forEach(row => {
                row.forEach(cell => {
                    if (cell.value !== null) {
                        total++;
                        if (cell.isMarked && calledNumbers.includes(cell.value)) {
                            marked++;
                        }
                    }
                });
            });
        });

        return {
            totalNumbers: total,
            markedCorrectly: marked,
            remaining: total - marked,
            progressPercent: total > 0 ? Math.round((marked / total) * 100) : 0,
        };
    }, [cards, calledNumbers]);

    // Determine urgency state for styling
    const isNearWin = remaining <= 5 && remaining > 0;
    const isComplete = remaining === 0;

    return (
        <div
            className="shrink-0 w-full px-4 py-2"
            style={{ maxWidth: '500px', margin: '0 auto' }}
        >
            {/* Progress Bar Container */}
            <div
                style={{
                    position: 'relative',
                    height: '24px',
                    background: 'linear-gradient(180deg, #2d1f10 0%, #3d2814 100%)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid #5a4025',
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
                }}
            >
                {/* Progress Fill */}
                <div
                    style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        height: 'calc(100% - 4px)',
                        width: `calc(${progressPercent}% - 4px)`,
                        minWidth: progressPercent > 0 ? '8px' : '0',
                        background: isComplete
                            ? 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)'
                            : isNearWin
                                ? 'linear-gradient(90deg, #ffd700 0%, #ff6b35 100%)'
                                : 'linear-gradient(90deg, #ffd700 0%, #4ade80 100%)',
                        borderRadius: '8px',
                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isNearWin
                            ? '0 0 12px rgba(255, 107, 53, 0.6)'
                            : '0 0 8px rgba(255, 215, 0, 0.4)',
                        animation: isNearWin ? 'progress-pulse 1.5s ease-in-out infinite' : undefined,
                    }}
                />

                {/* Progress Text */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        letterSpacing: '0.05em',
                        color: '#f5e6c8',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}
                >
                    {isComplete ? (
                        <span>🎉 {t.cardFull || 'Full!'}</span>
                    ) : isNearWin ? (
                        <span style={{ animation: 'text-pulse 1s ease-in-out infinite' }}>
                            🔥 {remaining} {t.numbersLeft || 'left'}!
                        </span>
                    ) : (
                        <span>
                            {t.progress || 'Progress'}: {markedCorrectly}/{totalNumbers} ({progressPercent}%)
                        </span>
                    )}
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes progress-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                @keyframes text-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
}

