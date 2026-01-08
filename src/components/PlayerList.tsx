'use client';

import React from 'react';
import { Player, FlatWinners } from '@/lib/types';
import Image from 'next/image';

interface PlayerListProps {
    players: Player[];
    currentPlayerId?: string;
    compact?: boolean;
    flatWinners?: FlatWinners;
    onPlayerClick?: (player: Player) => void;
}

/**
 * PlayerList Component
 * Displays connected players with avatars.
 * Themed with explicit colors for the Royal Wooden theme.
 */
export default function PlayerList({
    players,
    currentPlayerId,
    compact = false,
    flatWinners,
    onPlayerClick,
}: PlayerListProps) {
    return (
        <div className={`flex flex-wrap justify-center ${compact ? 'gap-3' : 'gap-4'} items-start`}>
            {players.map((player) => {
                const flats = player.collectedFlats || [];
                const hasFlat1 = flats.includes(1);
                const hasFlat2 = flats.includes(2);
                const isFirstFlat1 = flatWinners?.flat1 === player.id;
                const isFirstFlat2 = flatWinners?.flat2 === player.id;

                // Simple heat calculation
                let minNumbersLeft = 999;
                if (player.cards) {
                    player.cards.forEach(card => {
                        let count = 0;
                        card.grid.forEach(row => {
                            row.forEach(cell => {
                                if (cell.value !== null && !cell.isMarked) count++;
                            });
                        });
                        if (count < minNumbersLeft) minNumbersLeft = count;
                    });
                }
                const heatLevel = minNumbersLeft <= 1 ? 1 : minNumbersLeft <= 2 ? 2 : 0;

                // Is this the current user?
                const isMe = player.id === currentPlayerId;

                return (
                    <button
                        key={player.id}
                        className="flex flex-col items-center gap-1 cursor-pointer transition-transform active:scale-95 relative group"
                        onClick={() => onPlayerClick?.(player)}
                        style={{
                            opacity: player.isConnected ? 1 : 0.5,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            padding: 0,
                            margin: 0
                        }}
                    >
                        {/* Host Crown */}
                        {player.isHost && (
                            <div className="absolute -top-3 -right-2 text-lg z-20 drop-shadow-md transform rotate-12">
                                👑
                            </div>
                        )}

                        {/* Heat Indicator */}
                        {heatLevel > 0 && (
                            <div className={`absolute -top-3 -left-2 z-20 pointer-events-none text-lg ${heatLevel === 1 ? 'animate-bounce' : ''}`}>
                                {heatLevel === 1 ? '🔥' : '⚠️'}
                            </div>
                        )}

                        {/* Avatar Box */}
                        {/* Avatar Box - Matching AvatarPicker Style */}
                        <div
                            style={{
                                width: compact ? '56px' : '72px',
                                height: compact ? '56px' : '72px',
                                borderRadius: '14px',
                                background: isMe
                                    ? 'linear-gradient(145deg, #ffd700 0%, #daa520 100%)' // Gold for me
                                    : '#1a1109', // Dark wood for others
                                border: isMe ? '2px solid #b8860b' : '2px solid #3d2814',
                                boxShadow: isMe
                                    ? '0 0 15px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.4)'
                                    : 'inset 0 2px 4px rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: compact ? '2rem' : '2.5rem',
                                color: isMe ? '#3d2814' : '#e8d4b8', // Dark on Gold, Cream on Wood
                                position: 'relative',
                                transition: 'all 0.2s',
                                zIndex: 1,
                            }}
                        >
                            {/* Avatar Image/Placeholder */}
                            {player.avatarUrl && (player.avatarUrl.includes('http') || player.avatarUrl.includes('data:')) ? (
                                <Image
                                    src={player.avatarUrl}
                                    alt={player.name}
                                    fill
                                    unoptimized
                                    sizes="72px"
                                    style={{ objectFit: 'cover', borderRadius: '10px' }}
                                />
                            ) : (
                                <span style={{ filter: isMe ? 'drop-shadow(0 2px 0 rgba(255,255,255,0.4))' : 'none' }}>
                                    {player.avatarUrl || player.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>

                        {/* Flat Indicators */}
                        {(hasFlat1 || hasFlat2) && (
                            <div className="flex gap-1 absolute -bottom-1 z-20 bg-black/50 px-1 rounded-full">
                                {hasFlat1 && <div className={`w-2 h-2 rounded-full ${isFirstFlat1 ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-yellow-600'}`} />}
                                {hasFlat2 && <div className={`w-2 h-2 rounded-full ${isFirstFlat2 ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-yellow-600'}`} />}
                            </div>
                        )}

                        {/* Player Name */}
                        <span
                            style={{
                                fontSize: '0.75rem',
                                color: isMe ? '#ffd700' : '#e8d4b8',
                                fontWeight: isMe ? '800' : '500',
                                maxWidth: '80px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                marginTop: '4px'
                            }}
                        >
                            {player.name} {isMe && '(You)'}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
