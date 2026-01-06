'use client';

import React from 'react';
import { Player, FlatWinners } from '@/lib/types';

interface PlayerListProps {
    players: Player[];
    currentPlayerId?: string;
    compact?: boolean;
    flatWinners?: FlatWinners;
}

/**
 * PlayerList Component
 * Displays connected players with avatars and flat indicators
 */
export default function PlayerList({
    players,
    currentPlayerId,
    compact = false,
    flatWinners,
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
                    <div
                        key={player.id}
                        className={`flex flex-col items-center gap-xs ${player.isHost ? 'host-badge' : ''}`}
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
                            className={`avatar ${compact ? 'avatar-sm' : ''} relative transition-all duration-300`}
                            style={{
                                border:
                                    player.id === currentPlayerId
                                        ? '3px solid var(--color-gold)'
                                        : heatLevel === 1 ? '3px solid #ef4444' // Red
                                            : heatLevel === 2 ? '3px solid #f97316' // Orange
                                                : 'none',
                                boxShadow:
                                    heatLevel === 1 ? '0 0 15px rgba(239, 68, 68, 0.7)'
                                        : heatLevel === 2 ? '0 0 10px rgba(249, 115, 22, 0.5)'
                                            : 'none',
                                animation: heatLevel === 1 ? 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: compact ? '1rem' : '1.5rem',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                overflow: 'visible' // Allow fire to show? No, fire is outside. Avatar overflow hidden constraint?
                            }}
                        >
                            <div className="rounded-full overflow-hidden w-full h-full object-cover">
                                {player.avatarUrl && (player.avatarUrl.includes('http') || player.avatarUrl.includes('data:')) ? (
                                    <img src={player.avatarUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span>{player.avatarUrl || player.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                        {!compact && (
                            <span
                                style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: heatLevel === 1 ? '#ef4444' : 'var(--color-text-light)',
                                    fontWeight: heatLevel === 1 ? 'bold' : 'normal',
                                    maxWidth: '60px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {player.name}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
