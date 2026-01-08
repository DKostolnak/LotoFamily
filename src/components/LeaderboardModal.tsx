'use client';

/**
 * LeaderboardModal Component
 * 
 * Displays a ranked list of players by score.
 * Styled with the wooden game theme for visual consistency.
 * 
 * Features:
 * - Sorted player list by score
 * - Medal icons for top 3 positions
 * - Current player highlighting
 * - Flats count display
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Player } from '@/lib/types';
import { playClickSound } from '@/lib/audio';
import Image from 'next/image';
import { TranslationDictionary } from '@/lib/translations';

// ============================================================================
// TYPES
// ============================================================================

interface LeaderboardModalProps {
    /** Array of players to display */
    players: Player[];
    /** Current user's player ID for highlighting */
    currentUserId?: string;
    /** Callback to close the modal */
    onClose: () => void;
    /** Translation dictionary */
    t: TranslationDictionary;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RANK_MEDALS = ['🥇', '🥈', '🥉'] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export default function LeaderboardModal({
    players,
    currentUserId,
    onClose,
    t
}: LeaderboardModalProps) {
    // Sort players by score descending
    const sortedPlayers = useMemo(
        () => [...players].sort((a, b) => (b.score || 0) - (a.score || 0)),
        [players]
    );

    // Lock body scroll when modal is open
    useEffect(() => {
        if (typeof document === 'undefined') return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // Handle backdrop click to close
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            playClickSound();
            onClose();
        }
    }, [onClose]);

    // Handle keyboard events
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            playClickSound();
            onClose();
        }
    }, [onClose]);

    // Handle close button click
    const handleClose = useCallback(() => {
        playClickSound();
        onClose();
    }, [onClose]);

    // Don't render on server
    if (typeof document === 'undefined') {
        return null;
    }

    const modalContent = (
        <div
            className="animate-fadeIn"
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
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(4px)',
                padding: '16px',
            }}
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            role="presentation"
            tabIndex={-1}
        >
            {/* Modal Card - Wooden Theme */}
            <div
                className="animate-scaleIn"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '380px',
                    backgroundImage: 'url(/assets/wood-seamless.png)',
                    backgroundSize: '256px 256px',
                    backgroundRepeat: 'repeat',
                    borderRadius: '20px',
                    border: '4px solid #2d1f10',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="leaderboard-title"
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '3px solid rgba(0, 0, 0, 0.3)',
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 100%)',
                    }}
                >
                    <h3
                        id="leaderboard-title"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: 0,
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: '#f5e6c8',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            textShadow: '1px 1px 0 #3d2814, 0 2px 4px rgba(0,0,0,0.6)',
                        }}
                    >
                        🏆 {t.leaderboard}
                    </h3>

                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={handleClose}
                        className="active:scale-90 transition-transform"
                        style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '50%',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            color: '#f5e6c8',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                        }}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Player List */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        padding: '16px',
                        maxHeight: '60vh',
                        overflowY: 'auto',
                    }}
                >
                    {sortedPlayers.map((player, index) => {
                        const isCurrentUser = player.id === currentUserId;
                        const rank = index + 1;
                        const hasMedal = rank <= 3;

                        return (
                            <div
                                key={player.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 14px',
                                    background: isCurrentUser
                                        ? 'linear-gradient(145deg, rgba(201, 166, 107, 0.3) 0%, rgba(160, 125, 74, 0.2) 100%)'
                                        : 'linear-gradient(145deg, #5a4025 0%, #3d2814 100%)',
                                    borderRadius: '12px',
                                    border: isCurrentUser
                                        ? '2px solid #c9a66b'
                                        : '2px solid #2d1f10',
                                    boxShadow: isCurrentUser
                                        ? '0 0 12px rgba(201, 166, 107, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                                        : 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
                                }}
                            >
                                {/* Rank */}
                                <div
                                    style={{
                                        width: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    {hasMedal ? (
                                        <span style={{ fontSize: '24px' }}>{RANK_MEDALS[rank - 1]}</span>
                                    ) : (
                                        <span
                                            style={{
                                                fontSize: '16px',
                                                fontWeight: 700,
                                                color: '#a08060',
                                                fontFamily: 'monospace',
                                            }}
                                        >
                                            {rank}
                                        </span>
                                    )}
                                </div>

                                {/* Avatar */}
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            border: '3px solid #c9a66b',
                                            background: 'linear-gradient(145deg, #5a4025 0%, #3d2814 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                                        }}
                                    >
                                        {player.avatarUrl && (player.avatarUrl.startsWith('http') || player.avatarUrl.startsWith('data:')) ? (
                                            <Image
                                                src={player.avatarUrl}
                                                alt={player.name}
                                                fill
                                                unoptimized
                                                sizes="44px"
                                                style={{ objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <span>{player.avatarUrl || player.name.charAt(0)}</span>
                                        )}
                                    </div>

                                    {/* "You" Badge */}
                                    {isCurrentUser && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: '-2px',
                                                right: '-2px',
                                                background: 'linear-gradient(145deg, #ffd700 0%, #daa520 100%)',
                                                color: '#3d2814',
                                                fontSize: '8px',
                                                fontWeight: 700,
                                                padding: '2px 5px',
                                                borderRadius: '6px',
                                                border: '1px solid #b8860b',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {t.me}
                                        </div>
                                    )}
                                </div>

                                {/* Name & Flats */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: isCurrentUser ? '#ffd700' : '#f5e6c8',
                                            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {player.name}
                                    </div>
                                    {player.collectedFlats && player.collectedFlats.length > 0 && (
                                        <div
                                            style={{
                                                fontSize: '11px',
                                                color: '#a08060',
                                                marginTop: '2px',
                                            }}
                                        >
                                            🏠 {player.collectedFlats.length} flat{player.collectedFlats.length > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>

                                {/* Score */}
                                <div
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 700,
                                        fontFamily: 'monospace',
                                        color: '#f5e6c8',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <span style={{ fontSize: '14px' }}>⭐</span>
                                    {player.score || 0}
                                </div>
                            </div>
                        );
                    })}

                    {/* Empty State */}
                    {sortedPlayers.length === 0 && (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '32px',
                                color: '#a08060',
                                fontSize: '14px',
                            }}
                        >
                            No players yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
