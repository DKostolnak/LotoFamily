'use client';

/**
 * PlayerStatsModal Component
 * 
 * Displays player statistics and info when clicking on a player's avatar.
 * Styled with the wooden game theme for visual consistency.
 * 
 * Features:
 * - Player avatar and name display
 * - Score, flats, and cards statistics
 * - Host/Online status badges
 * - Kick player action (for hosts)
 */

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Player } from '@/lib/types';
import { playClickSound } from '@/lib/audio';
import Image from 'next/image';
import type { TranslationDictionary } from '@/lib/translations';

// ============================================================================
// TYPES
// ============================================================================

interface PlayerStatsModalProps {
    /** Player data to display */
    player: Player;
    /** Callback to close the modal */
    onClose: () => void;
    /** Current user's player ID (to show "You" badge) */
    currentUserId: string;
    /** Optional callback to kick player (only shown for hosts) */
    onKick?: (playerId: string) => void;
    /** Translation dictionary */
    t: TranslationDictionary;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PlayerStatsModal({
    player,
    onClose,
    currentUserId,
    onKick,
    t
}: PlayerStatsModalProps) {
    const isCurrentUser = player.id === currentUserId;

    // Calculate stats
    const scoreValue = player.score || 0;
    const flatCount = player.collectedFlats?.length || 0;
    const cardsCount = player.cards?.length || 0;

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

    // Handle kick action
    const handleKick = useCallback(() => {
        playClickSound();
        onKick?.(player.id);
    }, [onKick, player.id]);

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
                    maxWidth: '340px',
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
                aria-labelledby="player-stats-title"
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="active:scale-90 transition-transform"
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '50%',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        color: '#f5e6c8',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        zIndex: 10,
                    }}
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* Content */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Avatar */}
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <div
                            style={{
                                width: '88px',
                                height: '88px',
                                borderRadius: '50%',
                                border: '4px solid #c9a66b',
                                background: 'linear-gradient(145deg, #5a4025 0%, #3d2814 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '40px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.3)',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            {player.avatarUrl && (player.avatarUrl.startsWith('http') || player.avatarUrl.startsWith('data:')) ? (
                                <Image
                                    src={player.avatarUrl}
                                    alt={player.name}
                                    fill
                                    unoptimized
                                    sizes="88px"
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
                                    bottom: '-4px',
                                    right: '-4px',
                                    background: 'linear-gradient(145deg, #4a90d9 0%, #2e6bb4 100%)',
                                    color: '#fff',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: '10px',
                                    border: '2px solid #1e4b7a',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {t.me}
                            </div>
                        )}
                    </div>

                    {/* Player Name */}
                    <h2
                        id="player-stats-title"
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            textAlign: 'center',
                            margin: '0 0 12px 0',
                            color: '#f5e6c8',
                            textShadow: '1px 1px 0 #3d2814, -1px -1px 0 #3d2814, 1px -1px 0 #3d2814, -1px 1px 0 #3d2814, 0 2px 4px rgba(0,0,0,0.6)',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {player.name}
                    </h2>

                    {/* Status Badges */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {player.isHost && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    background: 'linear-gradient(145deg, #ffd700 0%, #daa520 100%)',
                                    color: '#3d2814',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    border: '2px solid #b8860b',
                                    boxShadow: '0 2px 0 #8b6914',
                                }}
                            >
                                👑 {t.host}
                            </span>
                        )}
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                background: player.isConnected
                                    ? 'linear-gradient(145deg, #4ade80 0%, #22c55e 100%)'
                                    : 'linear-gradient(145deg, #f87171 0%, #ef4444 100%)',
                                color: '#fff',
                                borderRadius: '12px',
                                fontSize: '13px',
                                fontWeight: 700,
                                border: player.isConnected ? '2px solid #16a34a' : '2px solid #dc2626',
                                boxShadow: player.isConnected ? '0 2px 0 #15803d' : '0 2px 0 #b91c1c',
                                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            }}
                        >
                            {player.isConnected ? '🟢' : '🔴'} {player.isConnected ? t.online : t.offline}
                        </span>
                    </div>

                    {/* Stats Grid - Wooden Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%', marginBottom: '20px' }}>
                        {/* Score */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '14px 8px',
                                background: 'linear-gradient(145deg, #5a4025 0%, #3d2814 100%)',
                                borderRadius: '12px',
                                border: '2px solid #2d1f10',
                                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <span style={{ fontSize: '24px', marginBottom: '4px' }}>⭐</span>
                            <span
                                style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: '#f5e6c8',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                                }}
                            >
                                {scoreValue}
                            </span>
                            <span
                                style={{
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    color: '#a08060',
                                    fontWeight: 600,
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {t.score}
                            </span>
                        </div>

                        {/* Flats */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '14px 8px',
                                background: 'linear-gradient(145deg, #5a4025 0%, #3d2814 100%)',
                                borderRadius: '12px',
                                border: '2px solid #2d1f10',
                                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
                            <span
                                style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: '#f5e6c8',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                                }}
                            >
                                {flatCount}
                            </span>
                            <span
                                style={{
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    color: '#a08060',
                                    fontWeight: 600,
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {t.flats}
                            </span>
                        </div>

                        {/* Cards */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '14px 8px',
                                background: 'linear-gradient(145deg, #5a4025 0%, #3d2814 100%)',
                                borderRadius: '12px',
                                border: '2px solid #2d1f10',
                                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <span style={{ fontSize: '24px', marginBottom: '4px' }}>🃏</span>
                            <span
                                style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: '#f5e6c8',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                                }}
                            >
                                {cardsCount}
                            </span>
                            <span
                                style={{
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    color: '#a08060',
                                    fontWeight: 600,
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {t.cards}
                            </span>
                        </div>
                    </div>

                    {/* Kick Button (for hosts only) */}
                    {onKick && !isCurrentUser && (
                        <button
                            type="button"
                            onClick={handleKick}
                            className="active:scale-95 transition-transform"
                            style={{
                                width: '100%',
                                padding: '14px 20px',
                                background: 'linear-gradient(145deg, #e85d5d 0%, #c23a3a 100%)',
                                borderRadius: '12px',
                                border: '3px solid #8b2020',
                                boxShadow: '0 4px 0 #6b1515, inset 0 1px 0 rgba(255,255,255,0.3)',
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: '#fff',
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            👞 {t.kickPlayer}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
