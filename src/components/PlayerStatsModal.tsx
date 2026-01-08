'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Player } from '@/lib/types';
import { playClickSound } from './GameAudioPlayer';
import Image from 'next/image';
import type { TranslationDictionary } from '@/lib/translations';

interface PlayerStatsModalProps {
    player: Player;
    onClose: () => void;
    currentUserId: string;
    onKick?: (playerId: string) => void;
    t: TranslationDictionary;
}

export default function PlayerStatsModal({
    player,
    onClose,
    currentUserId,
    onKick,
    t
}: PlayerStatsModalProps) {
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
    const isMe = player.id === currentUserId;

    // Calculate generic stats if available or placeholders for now
    const scoreValue = player.score || 0;
    const flatCount = player.collectedFlats?.length || 0;
    const cardsCount = player.cards?.length || 0;

    // Handle click outside to close
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
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
            onKeyDown={(event) => {
                if (event.key === 'Escape' || (event.key === 'Enter' && event.currentTarget === event.target)) {
                    playClickSound();
                    onClose();
                }
            }}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '384px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '4px solid var(--color-gold)',
                    animation: 'modalSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
                role="dialog"
                aria-modal="true"
            >
                {/* Header Background */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[var(--color-gold)] to-transparent opacity-20" />

                {/* Close Button */}
                <button
                    onClick={() => { playClickSound(); onClose(); }}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors z-10 text-lg"
                    aria-label="Close"
                >
                    ✕
                </button>

                <div className="flex flex-col items-center pt-8 pb-6 px-6 relative">
                    {/* Avatar */}
                    <div className="relative mb-4 group">
                        <div className="w-24 h-24 rounded-full border-4 border-[var(--color-gold)] bg-black/20 flex items-center justify-center text-4xl shadow-xl overflow-hidden relative">
                            {player.avatarUrl && (player.avatarUrl.startsWith('http') || player.avatarUrl.startsWith('data:')) ? (
                                <Image
                                    src={player.avatarUrl}
                                    alt={player.name}
                                    fill
                                    unoptimized
                                    sizes="96px"
                                    className="object-cover"
                                />
                            ) : (
                                <span>{player.avatarUrl || player.name.charAt(0)}</span>
                            )}
                        </div>
                        {isMe && (
                            <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-md font-bold">
                                {t.me}
                            </div>
                        )}
                    </div>

                    {/* Name */}
                    <h2 className="text-2xl font-bold mb-1 text-center truncate w-full text-gray-900">
                        {player.name}
                    </h2>

                    {/* Badges */}
                    <div className="flex gap-2 mb-6">
                        {player.isHost && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                👑 {t.host}
                            </span>
                        )}
                        {player.isConnected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                🟢 {t.online}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                🔴 {t.offline}
                            </span>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 w-full mb-6">
                        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-2xl mb-1">⭐</span>
                            <span className="text-xl font-bold text-gray-900">{scoreValue}</span>
                            <span className="text-xs uppercase text-gray-500">{t.score}</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-2xl mb-1">🏠</span>
                            <span className="text-xl font-bold text-gray-900">{flatCount}</span>
                            <span className="text-xs uppercase text-gray-500">{t.flats}</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-2xl mb-1">🃏</span>
                            <span className="text-xl font-bold text-gray-900">{cardsCount}</span>
                            <span className="text-xs uppercase text-gray-500">{t.cards}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    {onKick && !isMe && (
                        <button
                            className="btn btn-error w-full gap-2"
                            onClick={() => {
                                playClickSound();
                                onKick(player.id);
                            }}
                        >
                            👞 {t.kickPlayer}
                        </button>
                    )}
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
