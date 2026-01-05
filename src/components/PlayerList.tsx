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

                return (
                    <div
                        key={player.id}
                        className={`flex flex-col items-center gap-xs ${player.isHost ? 'host-badge' : ''}`}
                        style={{ opacity: player.isConnected ? 1 : 0.5 }}
                    >
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
                            className={`avatar ${compact ? 'avatar-sm' : ''}`}
                            style={{
                                border:
                                    player.id === currentPlayerId
                                        ? '3px solid var(--color-gold)'
                                        : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: compact ? '1rem' : '1.5rem',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                overflow: 'hidden'
                            }}
                        >
                            {player.avatarUrl && (player.avatarUrl.includes('http') || player.avatarUrl.includes('data:')) ? (
                                <img src={player.avatarUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span>{player.avatarUrl || player.name.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        {!compact && (
                            <span
                                style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-text-light)',
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
