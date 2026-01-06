'use client';

import React, { useEffect, useState } from 'react';
import { Player } from '@/lib/types';
import ConfettiCanvas from './ConfettiCanvas';
import { playWinSound, playLossSound, playClickSound } from './GameAudioPlayer';

interface WinnerCelebrationProps {
    winner: Player;
    isHost: boolean;
    onNewGame: () => void;
    onBackToLobby: () => void;
    currentUserId: string;
}

/**
 * WinnerCelebration Component
 * Victory screen with confetti animation and polished UI
 */
export default function WinnerCelebration({
    winner,
    isHost,
    onNewGame,
    onBackToLobby,
    currentUserId,
}: WinnerCelebrationProps) {
    // Determine if I am the winner
    const isMe = winner.id === currentUserId;

    useEffect(() => {
        // Play appropriate sound
        if (isMe) {
            playWinSound();
        } else {
            playLossSound();
        }
    }, [isMe]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-500 text-white font-sans">
            {/* Confetti Background */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-80">
                <ConfettiCanvas />
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
                {/* Avatar / Trophy */}
                <div className="mb-6 relative group">
                    <div className="absolute inset-0 bg-yellow-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse"></div>
                    <div className="w-32 h-32 rounded-full border-4 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)] overflow-hidden bg-white z-10 relative mx-auto">
                        {winner.avatarUrl && (winner.avatarUrl.includes('http') || winner.avatarUrl.includes('data:')) ? (
                            <img src={winner.avatarUrl} alt={winner.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-800">
                                {winner.avatarUrl || winner.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    {/* Crown Icon */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-6xl drop-shadow-lg animate-bounce z-20">
                        👑
                    </div>
                </div>

                {/* Main Text */}
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-sm mb-2 uppercase tracking-wide">
                    {isMe ? 'Victory!' : 'Game Over'}
                </h1>

                <h2 className="text-2xl font-bold text-white mb-8 drop-shadow-md">
                    {isMe ? 'You won the Loto!' : `${winner.name} takes the prize!`}
                </h2>

                {/* Results Card (Optional - could go here) */}
                <div className="bg-white/10 rounded-xl p-4 mb-8 w-full backdrop-blur-sm border border-white/10">
                    <div className="text-sm uppercase tracking-wider text-white/60 mb-1">Winning Score</div>
                    <div className="text-3xl font-mono font-bold text-yellow-400">
                        {winner.score || 0} PTS
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    {isHost ? (
                        <button
                            className="btn btn-primary btn-lg w-full shadow-xl hover:scale-105 transition-transform font-bold text-lg"
                            onClick={() => {
                                playClickSound();
                                onNewGame();
                            }}
                        >
                            🔄 Play Again
                        </button>
                    ) : (
                        <div className="text-white/60 text-sm mb-2 animate-pulse">
                            Waiting for host to restart...
                        </div>
                    )}

                    <button
                        className="btn btn-ghost text-white/80 hover:bg-white/10 hover:text-white"
                        onClick={() => {
                            playClickSound();
                            onBackToLobby();
                        }}
                    >
                        ⬅️ Leave Room
                    </button>
                </div>
            </div>
        </div>
    );
}
