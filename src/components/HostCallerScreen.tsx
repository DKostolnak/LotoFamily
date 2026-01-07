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

            {/* Current Number - Premium Display */}
            <div className="wooden-panel text-center" style={{ position: 'relative', overflow: 'visible' }}>
                <p style={{
                    fontSize: 'var(--font-size-sm)',
                    opacity: 0.8,
                    marginBottom: 'var(--space-md)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 600,
                }}>
                    {t.currentNumber}
                </p>

                {/* Medallion with decorative frame */}
                <div className="flex justify-center" style={{ position: 'relative' }}>
                    {/* Outer glow */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle, rgba(255,193,7,0.3) 0%, transparent 60%)',
                            transform: 'scale(2)',
                            pointerEvents: 'none',
                        }}
                    />
                    {/* Decorative ring */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            margin: 'auto',
                            width: '160px',
                            height: '160px',
                            borderRadius: '50%',
                            background: 'conic-gradient(from 0deg, #8B4513, #D2691E, #DEB887, #D2691E, #8B4513)',
                            opacity: 0.6,
                        }}
                    />
                    {/* Gold border frame */}
                    <div
                        style={{
                            padding: '5px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        <div
                            style={{
                                padding: '3px',
                                borderRadius: '50%',
                                background: '#DEB887',
                                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.25)',
                            }}
                        >
                            <NumberMedallion number={gameState.currentNumber} size="lg" />
                        </div>
                    </div>
                </div>

                {/* Number History Stack */}
                <div className="flex justify-center" style={{ marginTop: 'var(--space-lg)' }}>
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
