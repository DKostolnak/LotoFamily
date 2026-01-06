'use client';

import React from 'react';
import { Player } from '@/lib/types';
import { playClickSound } from './GameAudioPlayer';

interface PlayerStatsModalProps {
    player: Player;
    onClose: () => void;
    currentUserId: string;
    onKick?: (playerId: string) => void;
}

export default function PlayerStatsModal({
    player,
    onClose,
    currentUserId,
    onKick
}: PlayerStatsModalProps) {
    const isMe = player.id === currentUserId;
    const isHost = onKick !== undefined; // If onKick is provided, viewer is host (or logic can be inside)

    // Calculate generic stats if available or placeholders for now
    // In lobby, score is 0. In game, it has value.
    const score = player.score || 0;
    const flatCount = player.collectedFlats?.length || 0;
    const cardsCount = player.cards?.length || 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="relative w-full max-w-sm bg-[var(--color-bg)] rounded-2xl shadow-2xl border-4 border-[var(--color-gold)] overflow-hidden transform transition-all animate-in zoom-in-95">

                {/* Header Background */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[var(--color-gold)] to-transparent opacity-20" />

                {/* Close Button */}
                <button
                    onClick={() => { playClickSound(); onClose(); }}
                    className="absolute top-3 right-3 btn btn-circle btn-sm btn-ghost hover:bg-black/20 z-10"
                >
                    ✕
                </button>

                <div className="flex flex-col items-center pt-8 pb-6 px-6 relative">
                    {/* Avatar */}
                    <div className="relative mb-4 group">
                        <div className="w-24 h-24 rounded-full border-4 border-[var(--color-gold)] bg-black/20 flex items-center justify-center text-4xl shadow-xl overflow-hidden">
                            {player.avatarUrl && (player.avatarUrl.startsWith('http') || player.avatarUrl.startsWith('data:')) ? (
                                <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                                <span>{player.avatarUrl || player.name.charAt(0)}</span>
                            )}
                        </div>
                        {isMe && (
                            <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-md font-bold">
                                ME
                            </div>
                        )}
                    </div>

                    {/* Name */}
                    <h2 className="text-2xl font-bold mb-1 text-center truncate w-full">
                        {player.name}
                    </h2>

                    {/* Badges */}
                    <div className="flex gap-2 mb-6">
                        {player.isHost && (
                            <span className="badge badge-warning gap-1">
                                👑 Host
                            </span>
                        )}
                        {player.isConnected ? (
                            <span className="badge badge-success gap-1">
                                🟢 Online
                            </span>
                        ) : (
                            <span className="badge badge-error gap-1">
                                🔴 Offline
                            </span>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 w-full mb-6">
                        <div className="flex flex-col items-center p-3 bg-black/5 rounded-xl border border-black/5">
                            <span className="text-2xl mb-1">⭐</span>
                            <span className="text-xl font-bold">{score}</span>
                            <span className="text-xs uppercase opacity-60">Score</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-black/5 rounded-xl border border-black/5">
                            <span className="text-2xl mb-1">🏠</span>
                            <span className="text-xl font-bold">{flatCount}</span>
                            <span className="text-xs uppercase opacity-60">Flats</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-black/5 rounded-xl border border-black/5">
                            <span className="text-2xl mb-1">🃏</span>
                            <span className="text-xl font-bold">{cardsCount}</span>
                            <span className="text-xs uppercase opacity-60">Cards</span>
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
                            👞 Kick Player
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
