'use client';

import React, { useState } from 'react';
import { LotoCard as LotoCardType } from '@/lib/types';
import { playCellMarkSound } from './GameAudioPlayer';
import '@/styles/lotoCard.css';

interface LotoCardProps {
    card: LotoCardType;
    onCellClick?: (row: number, col: number) => void;
    highlightedNumber?: number | null;
    compact?: boolean;
    showHeader?: boolean;
    playerName?: string;
    calledNumbers?: number[];
    highlightAllCalled?: boolean;
}

/**
 * LotoCard Component
 * Displays a European Loto 90 card (9 columns x 3 rows) with tap feedback
 */
export function LotoCard({
    card,
    onCellClick,
    highlightedNumber,
    compact = false,
    showHeader = false,
    playerName,
    calledNumbers = [],
    highlightAllCalled = false,
}: LotoCardProps) {
    const [tappedCell, setTappedCell] = useState<string | null>(null);
    const [mistakeCell, setMistakeCell] = useState<string | null>(null);

    const handleCellClick = (row: number, col: number) => {
        const cell = card.grid[row][col];
        // Empty cells are never clickable
        if (cell.value === null) return;
        if (!onCellClick) return;

        const cellKey = `${row}-${col}`;

        // Check if this number was called and where in the history
        const calledIndex = calledNumbers.indexOf(cell.value);
        const isCalled = calledIndex !== -1;

        // Check if this is already correctly marked (wooden barrel - permanent)
        if (cell.isMarked && isCalled) return;

        // Check if this is a missed number (called but not marked in time - permanent X)
        const callsCount = calledNumbers.length;
        const isSafe = isCalled && (callsCount - 1 - calledIndex < 2);
        const isMissed = isCalled && !cell.isMarked && !isSafe;
        if (isMissed) return;

        // If number hasn't been called yet - show red flash (mistake) but don't mark
        if (!isCalled) {
            setMistakeCell(cellKey);
            // Brief red flash, then disappear
            setTimeout(() => setMistakeCell(null), 500);
            return;
        }

        // Number was called and is within safe window - mark it (wooden barrel)
        setTappedCell(cellKey);
        playCellMarkSound();
        onCellClick(row, col);
        setTimeout(() => setTappedCell(null), 200);
    };

    return (
        <div className={`loto-card ${compact ? 'loto-card--compact' : ''}`}>
            {showHeader && playerName && (
                <div className="loto-card-header">
                    <div className="loto-card-player">
                        <div className="avatar avatar-sm">
                            {playerName.charAt(0).toUpperCase()}
                        </div>
                        <span>{playerName}</span>
                    </div>
                </div>
            )}

            <div className="loto-card-grid">
                {card.grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                        const isEmpty = cell.value === null;
                        const isMarked = cell.isMarked;
                        const calledIndex = cell.value !== null ? calledNumbers.indexOf(cell.value) : -1;
                        const isCalled = calledIndex !== -1;

                        // "Missed" cross only appears if the number is older than the last 2 calls
                        const callsCount = calledNumbers.length;
                        const isSafe = isCalled && (callsCount - 1 - calledIndex < 2);

                        // Missed = called but not marked and out of safe window
                        const isMissed = isCalled && !isMarked && !isSafe;
                        // Correct = called and marked (wooden barrel)
                        const isCorrect = isCalled && isMarked;

                        const cellKey = `${rowIndex}-${colIndex}`;
                        const isTapped = tappedCell === cellKey;
                        const isMistake = mistakeCell === cellKey;

                        const cellClasses = [
                            'loto-cell',
                            isEmpty && 'loto-cell--empty',
                            isCorrect && 'loto-cell--correct',
                            isCorrect && 'loto-cell--marked',
                            isMissed && 'loto-cell--missed',
                            isMistake && 'loto-cell--mistake',
                            isTapped && 'loto-cell--tapped',
                        ]
                            .filter(Boolean)
                            .join(' ');

                        return (
                            <div
                                key={cellKey}
                                className={cellClasses}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                                role={isEmpty ? undefined : 'button'}
                                tabIndex={isEmpty ? undefined : 0}
                                aria-label={
                                    isEmpty
                                        ? undefined
                                        : `Number ${cell.value}${isMarked ? ', marked' : ''}`
                                }
                                style={{
                                    transform: isTapped ? 'scale(0.9)' : undefined,
                                    transition: 'transform 0.1s ease-out',
                                }}
                            >
                                {cell.value !== null && (
                                    <span className="loto-cell-number">{cell.value}</span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
    );
}

export default React.memo(LotoCard);
