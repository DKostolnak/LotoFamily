'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Player } from '@/lib/types';
import { playClickSound } from './GameAudioPlayer';

interface HeaderPlayerListProps {
    players: Player[];
    currentPlayerId: string;
    onPlayerClick?: (player: Player) => void;
}

/**
 * Calculates the "heat" level (danger of winning) for a player.
 * Heat 1: 1 number left (Critical) - Fire
 * Heat 2: 2 numbers left (Warning) - Alert
 * Heat 0: Safe
 */
function calculateHeat(player: Player): number {
    if (!player.cards || player.cards.length === 0) return 0;

    let minLeft = 999;
    player.cards.forEach(c => {
        let count = 0;
        c.grid.forEach(row => row.forEach(cell => {
            if (cell.value !== null && !cell.isMarked) count++;
        }));
        if (count < minLeft) minLeft = count;
    });

    return minLeft <= 1 ? 1 : minLeft <= 2 ? 2 : 0;
}

/**
 * HeaderPlayerList Component
 * Displays the scrollable list of players in the game header.
 * Applies the 'dent' aesthetic to avatars.
 */
export default function HeaderPlayerList({
    players,
    currentPlayerId,
    onPlayerClick,
}: HeaderPlayerListProps) {
    const sortedPlayers = useMemo(() => {
        // Sort: Current player first, then others
        const current = players.find(p => p.id === currentPlayerId);
        const others = players.filter(p => p.id !== currentPlayerId);
        return current ? [current, ...others] : others;
    }, [players, currentPlayerId]);

    return (
        <div
            className="flex items-center pl-2 py-2 gap-3 w-full overflow-x-auto no-scrollbar"
            style={{
                background: 'rgba(0,0,0,0.15)',
                paddingRight: '60px',
            }}
        >
            {sortedPlayers.map((player) => {
                const isMe = player.id === currentPlayerId;
                const heatLevel = calculateHeat(player);
                const size = isMe ? '90px' : '54px';

                const fontSize = isMe ? '60px' : '30px';

                return (
                    <button
                        key={player.id}
                        type="button"
                        className="shrink-0 flex flex-col items-center gap-1 hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        onClick={() => { playClickSound(); onPlayerClick?.(player); }}
                        aria-label={`View ${player.name}`}
                    >
                        {/* Avatar Container with Dent Effect */}
                        <div
                            className="relative"
                            style={{
                                width: size,
                                height: size,
                                borderRadius: isMe ? '18px' : '14px',
                                background: 'radial-gradient(circle at center, #3a2614 0%, #4a3520 70%, #2d1f10 100%)', // Dark dent effect
                                boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.7), inset 0 -2px 8px rgba(0,0,0,0.4)',
                                border: '2px solid #2d1f10',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '3px'
                            }}
                        >
                            {/* Avatar Image/Placeholder */}
                            {player.avatarUrl && (player.avatarUrl.startsWith('http') || player.avatarUrl.startsWith('data:')) ? (
                                <Image
                                    src={player.avatarUrl}
                                    alt={player.name}
                                    fill
                                    unoptimized
                                    sizes={isMe ? '90px' : '54px'}
                                    className="object-cover rounded-md shadow-inner"
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center font-bold text-[#e8d4b8]"
                                    style={{ fontSize: fontSize, lineHeight: 1 }}
                                >
                                    {player.avatarUrl || player.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Heat Indicator Badge */}
                            {heatLevel > 0 && (
                                <div className={`absolute -top-2 -right-1 text-sm z-10 ${heatLevel === 1 ? 'animate-bounce' : ''}`}>
                                    {heatLevel === 1 ? '🔥' : '⚠️'}
                                </div>
                            )}
                        </div>

                        {/* Player Name */}
                        <span
                            className="text-xs font-medium truncate"
                            style={{
                                color: '#e8d4b8',
                                maxWidth: isMe ? '100px' : '64px'
                            }}
                        >
                            {player.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
