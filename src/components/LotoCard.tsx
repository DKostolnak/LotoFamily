'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { LotoCard as LotoCardType } from '@/lib/types';
import { playCellMarkSound, playBonusSound, playErrorSound } from './GameAudioPlayer';
import { useHaptics } from '@/hooks/useHaptics';
import '@/styles/lotoCard.css';
import { TranslationDictionary } from '@/lib/translations';

interface FloatingText {
    id: number;
    text: string;
    x: number;
    y: number;
    color: string;
}

interface LotoCardProps {
    card: LotoCardType;
    onCellClick?: (row: number, col: number) => void;
    compact?: boolean;
    showHeader?: boolean;
    playerName?: string;
    calledNumbers?: number[];
    t: TranslationDictionary;
}

interface CellProps {
    value: number | null;
    isMarked: boolean;
    row: number;
    col: number;
    isMissed: boolean;
    isCorrect: boolean;
    isTapped: boolean;
    isMistake: boolean;
    onActivate: (row: number, col: number, evt: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * Memoized Cell Component - Only re-renders when its props change
 */
const LotoCell = memo(function LotoCell({
    value,
    isMarked,
    row,
    col,
    isMissed,
    isCorrect,
    isTapped,
    isMistake,
    onActivate,
}: CellProps) {
    const isEmpty = value === null;

    const cellClasses = useMemo(() => {
        return [
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
    }, [isEmpty, isCorrect, isMissed, isMistake, isTapped]);

    const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        onActivate(row, col, event);
    }, [onActivate, row, col]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onActivate(row, col, event);
        }
    }, [onActivate, row, col]);

    return (
        <div
            className={cellClasses}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={isEmpty ? undefined : 'button'}
            tabIndex={isEmpty ? undefined : 0}
            aria-label={
                isEmpty ? undefined : `Number ${value}${isMarked ? ', marked' : ''}`
            }
        >
            {value !== null && (
                <span
                    className="loto-cell-number"
                    style={{
                        // Delay the color/style 'switch' to create the 'first chip, then numbers switched' effect
                        transition: 'color 0.1s ease 0.25s, opacity 0.1s ease 0.25s, text-shadow 0.1s ease 0.25s'
                    }}
                >
                    {value}
                </span>
            )}
        </div>
    );
});

/**
 * LotoCard Component
 * Displays a European Loto 90 card (9 columns x 3 rows) with tap feedback
 */
function LotoCard({
    card,
    onCellClick,
    compact = false,
    showHeader = false,
    playerName,
    calledNumbers = [],
    t,
}: LotoCardProps) {
    const [tappedCell, setTappedCell] = useState<string | null>(null);
    const [mistakeCell, setMistakeCell] = useState<string | null>(null);
    const [tempMarked, setTempMarked] = useState<string | null>(null);
    const { vibrate } = useHaptics();

    // Memoize the called numbers set for O(1) lookups
    const calledSet = useMemo(() => new Set(calledNumbers), [calledNumbers]);
    const callsCount = calledNumbers.length;

    // Memoize progress calculation
    const { progress, remaining } = useMemo(() => {
        const cells = card.grid.flat();
        const total = cells.filter(c => c.value !== null).length;
        const marked = cells.filter(c =>
            c.value !== null && c.isMarked && calledSet.has(c.value)
        ).length;

        return {
            progress: total > 0 ? (marked / total) * 100 : 0,
            remaining: total - marked,
        };
    }, [card.grid, calledSet]);

    // Stable cell click handler
    const handleCellClick = useCallback((row: number, col: number, evt: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
        const cell = card.grid[row][col];
        if (cell.value === null) return;
        if (!onCellClick) return;

        const cellKey = `${row}-${col}`;
        const calledIndex = calledNumbers.indexOf(cell.value);
        const isCalled = calledIndex !== -1;

        // Already correctly marked
        if (cell.isMarked && isCalled) return;

        // Check if missed
        const isSafe = isCalled && (callsCount - 1 - calledIndex < 2);
        const isMissed = isCalled && !cell.isMarked && !isSafe;
        if (isMissed) return;

        // Uncalled number - just show red crossed visual, no shake or penalty
        if (!isCalled) {
            setMistakeCell(cellKey);
            // Only visual feedback - no sound, no vibration, no penalty text
            setTimeout(() => setMistakeCell(null), 800); // Show red cross longer
            return;
        }

        // Valid mark
        setTappedCell(cellKey);
        setTempMarked(cellKey); // Immediate visual feedback
        vibrate('light'); // Haptic feedback for successful mark

        // Trigger actual mark in parent/state
        onCellClick(row, col);

        // Sound Feedback Only - No visual text
        if (isSafe) {
            playBonusSound(); // Fast mark!
        } else {
            playCellMarkSound(); // Normal
        }
        setTimeout(() => setTappedCell(null), 200);
        setTimeout(() => setTempMarked(null), 400);
    }, [card.grid, onCellClick, calledNumbers, callsCount]);

    return (
        <div className={`loto-card ${compact ? 'loto-card--compact' : ''} relative`}>
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

            {/* Progress Bar */}
            <div className="loto-card-progress">
                <div
                    className="loto-card-progress-bar"
                    style={{ width: `${progress}%` }}
                />
                <span className="loto-card-progress-text">
                    {remaining === 0 ? `🎉 ${t.cardFull}` : `${remaining} ${t.numbersLeft}`}
                </span>
            </div>

            <div className="loto-card-grid relative">
                {card.grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                        const calledIndex = cell.value !== null ? calledNumbers.indexOf(cell.value) : -1;
                        const isCalled = calledIndex !== -1;
                        const isMissed = isCalled && !cell.isMarked && (callsCount - 1 - calledIndex >= 2);
                        // Show token overlay immediately for called numbers marked optimistically
                        const tappedKey = `${rowIndex}-${colIndex}`;
                        const isCorrect = isCalled && (cell.isMarked || (tempMarked === tappedKey));
                        const cellKey = `${rowIndex}-${colIndex}-${cell.value ?? 'x'}-${cell.isMarked ? 'm' : 'u'}`;

                        // Effective marked includes temp optimistic state
                        const effectiveIsMarked = cell.isMarked || (tempMarked === tappedKey);

                        return (
                            <LotoCell
                                key={cellKey}
                                value={cell.value}
                                isMarked={effectiveIsMarked}
                                row={rowIndex}
                                col={colIndex}
                                isMissed={isMissed}
                                isCorrect={isCorrect}
                                isTapped={tappedCell === tappedKey}
                                isMistake={mistakeCell === tappedKey}
                                onActivate={handleCellClick}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}

export { LotoCard };
export default memo(LotoCard);
