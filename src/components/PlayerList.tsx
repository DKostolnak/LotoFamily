'use client';

import React from 'react';
import { Player, FlatWinners } from '@/lib/types';

interface PlayerListProps {
    players: Player[];
    currentPlayerId?: string;
    compact?: boolean;
    flatWinners?: FlatWinners;
    onPlayerClick?: (player: Player) => void;
}

/**
 * PlayerList Component
 * Displays connected players with avatars and flat indicators.
 * Supports clicking on avatars to view details.
 */
export default function PlayerList({
    players,
    currentPlayerId,
    compact = false,
    flatWinners,
    onPlayerClick,
}: PlayerListProps) {
    return (
        <div className={`flex ${compact ? 'gap-sm' : 'gap-md'} items-start`}>
            {players.map((player) => {
                const flats = player.collectedFlats || [];
                const hasFlat1 = flats.includes(1);
                const hasFlat2 = flats.includes(2);
                const isFirstFlat1 = flatWinners?.flat1 === player.id;
                const isFirstFlat2 = flatWinners?.flat2 === player.id;

                // Calculate Heat (Numbers needed to win)
                let minNumbersLeft = 999;
                if (player.cards) {
                    player.cards.forEach(card => {
                        let count = 0;
                        card.grid.forEach(row => {
                            row.forEach(cell => {
                                if (cell.value !== null && !cell.isMarked) {
                                    count++;
                                }
                            });
                        });
                        if (count < minNumbersLeft) minNumbersLeft = count;
                    });
                }
                const heatLevel = minNumbersLeft <= 1 ? 1 : minNumbersLeft <= 2 ? 2 : 0; // 1=Critical, 2=Warning

                return (
                    <button
                        key={player.id}
                        className={`flex flex-col items-center gap-xs border-none bg-transparent p-0 cursor-pointer transition-transform active:scale-95 ${player.isHost ? 'host-badge' : ''}`}
                        onClick={() => onPlayerClick?.(player)}
                        style={{ opacity: player.isConnected ? 1 : 0.5 }}
                    >
                        {/* Heat Indicator (Fire/Emoji) */}
                        {heatLevel > 0 && (
                            <div className={`absolute -top-2 ${heatLevel === 1 ? 'animate-bounce' : ''} z-20 pointer-events-none`}>
                                {heatLevel === 1 ? '🔥' : '⚠️'}
                            </div>
                        )}

                        {/* Flat Indicators */}
                        <div className="flex gap-xs" style={{ height: '8px', marginBottom: '4px' }}>
                            {hasFlat1 && (
                                <div
                                    style={{
                                        width: '12px',
                                        height: '4px',
                                        background: isFirstFlat1 ? 'var(--color-green)' : 'var(--color-gold)',
                                        borderRadius: '2px'
                                    }}
                                    title="1-Room Flat"
                                />
                            )}
                            {hasFlat2 && (
                                <div
                                    style={{
                                        width: '12px',
                                        height: '4px',
                                        background: isFirstFlat2 ? 'var(--color-green)' : 'var(--color-gold)',
                                        borderRadius: '2px'
                                    }}
                                    title="2-Room Flat"
                                />
                            )}
                        </div>

                        <div
                            className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} relative transition-all duration-300`}
                            style={{
                                border:
                                    player.id === currentPlayerId
                                        ? '3px solid var(--color-gold)'
                                        : heatLevel === 1 ? '3px solid #ef4444'
                                            : heatLevel === 2 ? '3px solid #f97316'
                                                : '2px solid rgba(139, 69, 19, 0.5)',
                                boxShadow:
                                    heatLevel === 1 ? '0 0 15px rgba(239, 68, 68, 0.7)'
                                        : heatLevel === 2 ? '0 0 10px rgba(249, 115, 22, 0.5)'
                                            : '0 2px 4px rgba(0,0,0,0.3)',
                                animation: heatLevel === 1 ? 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: compact ? '1rem' : '1.5rem',
                                background: '#D2B48C',
                                borderRadius: '6px',
                                overflow: 'hidden',
                            }}
                        >
                            <div className="overflow-hidden w-full h-full">
                                {player.avatarUrl && (player.avatarUrl.includes('http') || player.avatarUrl.includes('data:')) ? (
                                    <img src={player.avatarUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span className="flex items-center justify-center w-full h-full">{player.avatarUrl || player.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                        {/* Always show player name - using smaller text when compact */}
                        <span
                            style={{
                                fontSize: compact ? '0.65rem' : 'var(--font-size-xs)',
                                color: heatLevel === 1 ? '#ef4444' : 'var(--color-text-light)',
                                fontWeight: heatLevel === 1 ? 'bold' : 'normal',
                                maxWidth: compact ? '50px' : '60px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textAlign: 'center',
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
