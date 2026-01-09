'use client';

import React, { useEffect, useMemo } from 'react';
import { Player } from '@/lib/types';
import ConfettiCanvas from './ConfettiCanvas';
import { playWinSound, playLossSound, playClickSound } from './GameAudioPlayer';
import Image from 'next/image';
import type { TranslationDictionary } from '@/lib/translations';

interface WinnerCelebrationProps {
    winner: Player;
    players: Player[]; // Added players list
    isHost: boolean;
    onNewGame: () => void;
    onBackToLobby: () => void;
    currentUserId: string;
    t: TranslationDictionary;
}

/**
 * WinnerCelebration Component
 * Victory screen with confetti animation and polished Royal Wooden UI
 */
export default function WinnerCelebration({
    winner,
    players,
    isHost,
    onNewGame,
    onBackToLobby,
    currentUserId,
    t,
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

    // Calculate leaderboard (excluding winner, or including? User asked for "other players")
    // Let's show EVERYONE sorted, but highlight the winner at the top.
    // Actually, usually "Winner" is big at top, then list of others below.
    const sortedOthers = useMemo(() => {
        return players
            .filter(p => p.id !== winner.id)
            .sort((a, b) => b.score - a.score);
    }, [players, winner.id]);

    // --- STYLES (Copied from MainMenu/Lobby for consistency) ---
    const mainStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/assets/wood-seamless.png)',
        backgroundSize: '256px 256px',
        backgroundRepeat: 'repeat',
        backgroundColor: '#1a1109',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '20px',
    };

    const cardStyle: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'rgba(26, 17, 9, 0.95)',
        border: '4px solid #8b6b4a',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(0,0,0,0.5)',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        zIndex: 10,
        margin: 'auto', // Center in scroll view
    };

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        padding: '16px',
        borderRadius: '16px',
        border: 'none',
        fontSize: '1.1rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 8px 15px rgba(0,0,0,0.3)',
        transition: 'transform 0.1s',
    };

    const goldBtnStyle: React.CSSProperties = {
        ...buttonStyle,
        background: 'linear-gradient(180deg, #ffd700 0%, #daa520 100%)',
        color: '#3d2814',
        borderBottom: '4px solid #b8860b',
    };

    const woodBtnStyle: React.CSSProperties = {
        ...buttonStyle,
        background: 'linear-gradient(180deg, #5a4025 0%, #3d2814 100%)',
        color: '#f5e6c8',
        borderBottom: '4px solid #2d1f10',
    };

    return (
        <div style={mainStyle}>
            {/* Confetti Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <ConfettiCanvas />
            </div>

            <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />

            <div style={cardStyle}>
                {/* Header / Avatar */}
                <div className="relative mb-2">
                    <div className="absolute inset-0 bg-yellow-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                    <div className="w-32 h-32 rounded-full border-4 border-[#ffd700] shadow-lg bg-[#f5f0e8] z-10 relative flex items-center justify-center text-5xl">
                        {winner.avatarUrl || '👤'}
                    </div>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-7xl drop-shadow-xl animate-bounce z-20">
                        👑
                    </div>
                </div>

                {/* Winner Title */}
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        color: '#ffd700',
                        textTransform: 'uppercase',
                        margin: 0,
                        textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(255, 215, 0, 0.4)',
                        lineHeight: 1.1,
                    }}>
                        {isMe ? t.victory : t.gameOver}
                    </h1>
                    <p style={{
                        color: '#e8d4b8',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        marginTop: '8px'
                    }}>
                        {isMe ? t.youWon : `${winner.name} ${t.playerWins}`}
                    </p>
                </div>

                {/* Winner Score Box */}
                <div style={{
                    background: 'linear-gradient(135deg, #ffd700 0%, #daa520 100%)',
                    borderRadius: '16px',
                    padding: '16px',
                    width: '100%',
                    textAlign: 'center',
                    border: '2px solid #b8860b',
                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                    color: '#3d2814'
                }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8 }}>
                        {t.winningScore || 'Winning Score'}
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>
                        {winner.score} PTS
                    </div>
                </div>

                {/* Other Players Leaderboard */}
                {sortedOthers.length > 0 && (
                    <div style={{ width: '100%' }}>
                        <p style={{
                            color: '#8b6b4a',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            marginBottom: '12px',
                            textAlign: 'center',
                            letterSpacing: '0.1em'
                        }}>
                            {t.leaderboard || 'Leaderboard'}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {sortedOthers.map((player, index) => {
                                const isUser = player.id === currentUserId;
                                return (
                                    <div key={player.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px',
                                        background: isUser ? 'rgba(61, 40, 20, 0.6)' : 'rgba(26, 17, 9, 0.6)',
                                        borderRadius: '12px',
                                        border: isUser ? '1px solid #ccafa5' : '1px solid #5a4025',
                                    }}>
                                        <div style={{
                                            width: '32px', height: '32px',
                                            borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.2rem',
                                            background: '#3d2814',
                                            marginRight: '12px',
                                            border: '1px solid #5a4025'
                                        }}>
                                            {player.avatarUrl || '👤'}
                                        </div>
                                        <div style={{ flex: 1, fontWeight: 'bold', color: isUser ? '#ffd700' : '#e8d4b8' }}>
                                            {player.name} {isUser && '(You)'}
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: '#f5e6c8' }}>
                                            {player.score}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    {isHost ? (
                        <button
                            onClick={() => { playClickSound(); onNewGame(); }}
                            style={goldBtnStyle}
                            className="active:translate-y-1"
                        >
                            🔄 {t.playAgain}
                        </button>
                    ) : (
                        <div className="text-center p-3 text-[#8b6b4a] italic bg-[#1a1109]/50 rounded-lg border border-[#3d2814]">
                            {t.waitingHostRestart}
                        </div>
                    )}

                    <button
                        onClick={() => { playClickSound(); onBackToLobby(); }}
                        style={woodBtnStyle}
                        className="active:translate-y-1"
                    >
                        ⬅️ {t.leaveRoom}
                    </button>
                </div>
            </div>
        </div>
    );
}
