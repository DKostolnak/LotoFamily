'use client';

import React from 'react';
import { GameState } from '@/lib/types';
import { translations } from '@/lib/translations';
import NumberMedallion from './NumberMedallion';
import NumberHistory from './NumberHistory';
import PlayerList from './PlayerList';

interface HostCallerScreenProps {
    gameState: GameState;
    onCallNumber: () => void;
    onPause: () => void;
    onResume: () => void;
    onEndGame: () => void;
}

/**
 * HostCallerScreen Component
 * Host view for calling numbers and managing the game
 */
export default function HostCallerScreen({
    gameState,
    onCallNumber,
    onPause,
    onResume,
    onEndGame,
}: HostCallerScreenProps) {
    const calledNumberValues = gameState.calledNumbers.map(cn => cn.value);
    const isPaused = gameState.phase === 'paused';
    const t = translations[gameState.settings.language || 'en'];
    const canCallNumber = gameState.phase === 'playing' && gameState.remainingNumbers.length > 0;

    // Create a 9x10 grid showing all numbers 1-90
    const numberBoard: (number | null)[][] = [];
    for (let row = 0; row < 9; row++) {
        const boardRow: (number | null)[] = [];
        for (let col = 0; col < 10; col++) {
            const num = col * 9 + row + 1;
            boardRow.push(num <= 90 ? num : null);
        }
        numberBoard.push(boardRow);
    }

    return (
        <div className="container flex flex-col gap-md" style={{ minHeight: '100vh', paddingTop: 'var(--space-md)' }}>
            {/* Header - Players */}
            <div className="flex items-center justify-center">
                <PlayerList players={gameState.players} compact />
            </div>

            {/* Current Number */}
            <div className="wooden-panel text-center">
                <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.7, marginBottom: 'var(--space-sm)' }}>
                    {t.currentNumber}
                </p>
                <div className="flex justify-center">
                    <NumberMedallion number={gameState.currentNumber} size="lg" />
                </div>

                <div className="flex justify-center" style={{ marginTop: 'var(--space-md)' }}>
                    <NumberHistory numbers={calledNumberValues} maxVisible={6} />
                </div>
            </div>

            {/* Call Number Button */}
            <button
                className="btn btn-primary btn-lg"
                onClick={onCallNumber}
                disabled={!canCallNumber}
                style={{
                    fontSize: 'var(--font-size-xl)',
                    padding: 'var(--space-xl)',
                }}
            >
                🎲 {t.callNext}
            </button>

            {/* Control Buttons */}
            <div className="flex gap-md">
                {isPaused ? (
                    <button className="btn btn-secondary" onClick={onResume} style={{ flex: 1 }}>
                        ▶️ {t.resume}
                    </button>
                ) : (
                    <button className="btn btn-secondary" onClick={onPause} style={{ flex: 1 }}>
                        ⏸️ {t.pause}
                    </button>
                )}
                <button className="btn btn-danger" onClick={onEndGame} style={{ flex: 1 }}>
                    🛑 {t.endGame}
                </button>
            </div>

            {/* Number Board - All 90 numbers */}
            <div className="card" style={{ padding: 'var(--space-sm)' }}>
                <p style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-sm)', opacity: 0.6 }}>
                    Called: {calledNumberValues.length} / 90
                </p>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(10, 1fr)',
                        gap: '2px',
                    }}
                >
                    {numberBoard.flat().map((num, index) => {
                        if (num === null) return <div key={index} />;

                        const isCalled = calledNumberValues.includes(num);
                        const isCurrent = num === gameState.currentNumber;

                        return (
                            <div
                                key={num}
                                style={{
                                    aspectRatio: '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 'var(--font-size-xs)',
                                    fontWeight: isCalled ? 700 : 400,
                                    background: isCurrent
                                        ? 'var(--color-gold)'
                                        : isCalled
                                            ? 'var(--color-red)'
                                            : 'var(--color-cell-empty)',
                                    color: isCalled ? 'var(--color-text-light)' : 'var(--color-text-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    transition: 'all var(--transition-fast)',
                                }}
                            >
                                {num}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Remaining */}
            <p
                className="text-center"
                style={{
                    color: 'var(--color-text-light)',
                    opacity: 0.6,
                    fontSize: 'var(--font-size-sm)',
                }}
            >
                {gameState.remainingNumbers.length} {t.remaining}
            </p>
        </div>
    );
}
