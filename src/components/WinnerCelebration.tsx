'use client';

import React, { useEffect } from 'react';
import { Player } from '@/lib/types';
import ConfettiCanvas from './ConfettiCanvas';
import { playVictoryFanfare, playClickSound } from './GameAudioPlayer';

interface WinnerCelebrationProps {
    winner: Player;
    isHost: boolean;
    onNewGame: () => void;
    onBackToLobby: () => void;
}

/**
 * WinnerCelebration Component
 * Victory screen with confetti animation
 */
export default function WinnerCelebration({
    winner,
    isHost,
    onNewGame,
    onBackToLobby,
}: WinnerCelebrationProps) {
    useEffect(() => {
        // Play sound on mount
        playVictoryFanfare();
    }, []);

    return (
        <div
            className="container flex flex-col items-center justify-center gap-xl"
            style={{
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Confetti */}

            {/* Confetti Canvas */}
            <ConfettiCanvas />

            {/* Trophy */}
            <div
                className="animate-pulse"
                style={{ fontSize: '80px', textShadow: '0 4px 20px rgba(255, 193, 7, 0.5)' }}
            >
                🏆
            </div>

            {/* Winner Info */}
            <div className="text-center">
                <h1
                    className="title title-lg"
                    style={{
                        marginBottom: 'var(--space-md)',
                        background: 'linear-gradient(135deg, var(--color-gold) 0%, #fff 50%, var(--color-gold) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    LOTO!
                </h1>

                <div
                    className="avatar avatar-lg"
                    style={{
                        margin: '0 auto var(--space-md)',
                        border: '4px solid var(--color-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.1)',
                        fontSize: '3rem'
                    }}
                >
                    {winner.avatarUrl || winner.name.charAt(0).toUpperCase()}
                </div>

                <h2 style={{ color: 'var(--color-text-light)', fontSize: 'var(--font-size-xl)' }}>
                    {winner.name}
                </h2>
                <p style={{ color: 'var(--color-text-light)', opacity: 0.7, marginTop: 'var(--space-sm)' }}>
                    Winner! 🎉
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-md" style={{ width: '100%', maxWidth: '300px', zIndex: 10 }}>
                {isHost && (
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => {
                            playClickSound();
                            onNewGame();
                        }}
                    >
                        🎲 Play Again
                    </button>
                )}
                {!isHost && (
                    <div className="text-center" style={{ opacity: 0.7, marginBottom: 'var(--space-sm)' }}>
                        Waiting for host to play again...
                    </div>
                )}
                <button
                    className="btn btn-secondary"
                    onClick={() => {
                        playClickSound();
                        onBackToLobby();
                    }}
                >
                    🏠 Back to Lobby
                </button>
            </div>
        </div>
    );
}
