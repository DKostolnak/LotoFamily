'use client';

import React, { useEffect, useMemo } from 'react';
import { Player, LotoCard as LotoCardType } from '@/lib/types';
import LotoCard from './LotoCard';
import ConfettiCanvas from './ConfettiCanvas';
import { WoodenCard } from './common/WoodenCard';
import { playWinSound, playLossSound, playClickSound } from '@/lib/audio';
import Image from 'next/image';
import type { TranslationDictionary } from '@/lib/translations';

const BackArrowIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

interface WinnerCelebrationProps {
    winner: Player;
    players: Player[];
    isHost: boolean;
    isPersonalBest?: boolean;
    winningCard?: LotoCardType;
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
    isPersonalBest = false,
    winningCard,
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

    // Calculate leaderboard (excluding winner)
    const sortedOthers = useMemo(() => {
        return players
            .filter(p => p.id !== winner.id)
            .sort((a, b) => b.score - a.score);
    }, [players, winner.id]);

    // --- STYLES ---
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4">
            {/* Dark Backdrop with Blur */}
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity duration-1000 animate-in fade-in fill-mode-forwards"></div>

            {/* Confetti (Behind everything) */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <ConfettiCanvas />
            </div>

            {/* Floating Wooden Board */}
            <WoodenCard
                className="animate-in zoom-in-95 duration-500"
                maxWidth="480px"
                style={{ overflow: 'visible', margin: 'auto' }}
            >
                {/* 1. HERO SECTION: Crown, Avatar & Title */}
                <div className="relative flex flex-col items-center justify-center -mt-8 mb-4">
                    {/* Rotating Rays Behind (Centered behind avatar) */}
                    <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent rotate-45 animate-spin-slow pointer-events-none rounded-full blur-3xl z-0"></div>

                    {/* Crown Icon */}
                    <div className="text-6xl mb-2 animate-bounce drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] z-20">
                        👑
                    </div>

                    {/* Big Avatar */}
                    <div className="relative w-40 h-40 rounded-full border-4 border-[#ffd700] shadow-[0_0_30px_rgba(255,215,0,0.4)] bg-[#1a1109] z-10 flex items-center justify-center overflow-hidden">
                        {winner.avatarUrl && (winner.avatarUrl.startsWith('http') || winner.avatarUrl.startsWith('data:')) ? (
                            <Image
                                src={winner.avatarUrl}
                                alt={winner.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-7xl">{winner.avatarUrl || '👤'}</span>
                        )}
                    </div>

                    {/* Text Group */}
                    <div className="text-center mt-4 z-20">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] to-[#b8860b] drop-shadow-sm uppercase tracking-wide leading-tight">
                            {isMe ? t.victory : t.gameOver}
                        </h1>
                        <p className="text-lg font-bold text-[#f5e6c8] mt-1 opacity-90">
                            {isMe ? t.youWon : `${winner.name} ${t.playerWins}`}
                        </p>
                        <div className="text-3xl font-black text-[#ffd700] mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {winner.score} PTS
                        </div>
                    </div>
                </div>

                {/* 2. WINNING CARD (Compact) */}
                {winningCard && (
                    <div className="relative w-full transform scale-95 hover:scale-100 transition-transform duration-300">
                        <div className="relative border-2 border-[#8b6b4a] rounded-xl overflow-hidden shadow-inner bg-[#2d1f10]/50">
                            <LotoCard
                                card={winningCard}
                                t={t}
                                compact={true}
                                theme="classic"
                            />
                            {/* Pro Stamp */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                <div className="border-4 border-red-500/80 rounded-lg px-6 py-2 rotate-[-12deg] bg-red-900/40 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                                    <span className="text-2xl font-black text-red-500 uppercase tracking-[0.2em] drop-shadow-md">
                                        WINNER
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. LEADERBOARD (Mini) */}
                {sortedOthers.length > 0 && (
                    <div className="w-full bg-[#1a1109]/50 rounded-xl p-3 border border-[#3d2814]">
                        <p className="text-[#8b6b4a] text-xs font-bold uppercase tracking-widest text-center mb-2">Leaderboard</p>
                        <div className="flex flex-col gap-2">
                            {sortedOthers.slice(0, 3).map((player) => (
                                <div key={player.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{player.avatarUrl || '👤'}</span>
                                        <span className={`font-bold ${player.id === currentUserId ? 'text-[#ffd700]' : 'text-[#e8d4b8]'}`}>
                                            {player.name}
                                        </span>
                                    </div>
                                    <span className="font-mono text-[#f5e6c8]">{player.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. ACTIONS */}
                <div className="w-full flex flex-col gap-3 mt-2">
                    {isHost ? (
                        <button
                            onClick={() => { playClickSound(); onNewGame(); }}
                            style={goldBtnStyle}
                            className="active:scale-95 transition-transform animate-pulse shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                        >
                            <span className="text-xl">🔄</span> {t.playAgain}
                        </button>
                    ) : (
                        <div className="text-center p-3 text-sm text-[#8b6b4a] italic bg-[#0f0905]/50 rounded-lg border border-[#3d2814]">
                            {t.waitingHostRestart}
                        </div>
                    )}

                    <button
                        onClick={() => { playClickSound(); onBackToLobby(); }}
                        style={woodBtnStyle}
                        className="active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <BackArrowIcon />
                        {t.leaveRoom}
                    </button>
                </div>
            </WoodenCard>
        </div>
    );
}
