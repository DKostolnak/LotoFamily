'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Player } from '@/lib/types';
import { playClickSound } from './GameAudioPlayer';
import Image from 'next/image';
import { TranslationDictionary } from '@/lib/translations';

interface LeaderboardModalProps {
    players: Player[];
    currentUserId?: string;
    onClose: () => void;
    t: TranslationDictionary;
}

export default function LeaderboardModal({ players, currentUserId, onClose, t }: LeaderboardModalProps) {
    useEffect(() => {
        if (typeof document === 'undefined') {
            return () => { };
        }

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // Sort players by score descending
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            playClickSound();
            onClose();
        }
    };

    const handleBackdropKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape' || (event.key === 'Enter' && event.currentTarget === event.target)) {
            playClickSound();
            onClose();
        }
    };

    const modalContent = (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(4px)',
                padding: '16px',
                animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={handleBackdropClick}
            role="presentation"
            tabIndex={-1}
            onKeyDown={handleBackdropKeyDown}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '384px',
                    animation: 'modalSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
                role="dialog"
                aria-modal="true"
            >
                {/* Leaderboard Card */}
                <div className="bg-gradient-to-b from-[#5d4037] to-[#3e2723] rounded-2xl p-5 shadow-2xl border-2 border-[var(--color-gold)]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold uppercase tracking-wider text-lg flex items-center gap-2">
                            🏆 {t.leaderboard}
                        </h3>
                        <button
                            onClick={() => { playClickSound(); onClose(); }}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-lg"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Player List */}
                    <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                        {sortedPlayers.map((player, index) => {
                            const isMe = player.id === currentUserId;
                            const rank = index + 1;

                            let rankIcon = <span className="text-white/50 w-6 text-center font-mono">{rank}</span>;
                            if (rank === 1) rankIcon = <span className="text-2xl">🥇</span>;
                            if (rank === 2) rankIcon = <span className="text-2xl">🥈</span>;
                            if (rank === 3) rankIcon = <span className="text-2xl">🥉</span>;

                            return (
                                <div
                                    key={player.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isMe
                                        ? 'bg-gradient-to-r from-[var(--color-gold)]/30 to-[var(--color-gold)]/10 border border-[var(--color-gold)]/50'
                                        : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center justify-center w-8 shrink-0">
                                        {rankIcon}
                                    </div>

                                    <div className="relative shrink-0">
                                        <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-[#D2B48C] flex items-center justify-center text-lg overflow-hidden relative">
                                            {player.avatarUrl && (player.avatarUrl.startsWith('http') || player.avatarUrl.startsWith('data:')) ? (
                                                <Image
                                                    src={player.avatarUrl}
                                                    alt={player.name}
                                                    fill
                                                    unoptimized
                                                    sizes="40px"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <span>{player.avatarUrl || player.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        {isMe && (
                                            <div className="absolute -bottom-1 -right-1 bg-[var(--color-gold)] text-[var(--color-wood-dark)] text-[8px] font-bold px-1 rounded-full">
                                                {t.me}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className={`truncate font-medium ${isMe ? 'text-[var(--color-gold)]' : 'text-white'}`}>
                                            {player.name}
                                        </div>
                                        {player.collectedFlats && player.collectedFlats.length > 0 && (
                                            <div className="text-xs text-white/50">
                                                {player.collectedFlats.length} flat{player.collectedFlats.length > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>

                                    <div className="font-mono font-bold text-xl text-white">
                                        {player.score || 0}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Animation styles */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.9) translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(modalContent, document.body);
}
