'use client';

import React, { useMemo } from 'react';
import { LotoCard } from '@/lib/types';

interface GameProgressProps {
    cards: LotoCard[];
    calledNumbers: number[];
}

/**
 * GameProgress Component
 * Shows overall progress across all player cards
 */
export default function GameProgress({ cards, calledNumbers }: GameProgressProps) {
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

    // Almost there message
    if (remaining <= 5 && remaining > 0) {
        return (
            <div
                className="shrink-0 text-center py-1"
                style={{
                    color: 'var(--color-gold)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    animation: 'pulse 1s infinite'
                }}
            >
                🔥 Almost there! {remaining} left!
            </div>
        );
    }

    // Normal progress display
    return (
        <div
            className="shrink-0 text-center py-1"
            style={{
                color: 'var(--color-text-light)',
                fontSize: '0.75rem',
                opacity: 0.7
            }}
        >
            Progress: {markedCorrectly}/{totalNumbers} ({progressPercent}%)
        </div>
    );
}
