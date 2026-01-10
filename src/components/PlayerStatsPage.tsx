'use client';

/**
 * PlayerStatsPage Component
 * 
 * Displays the player's statistics and match history.
 * Uses the Royal Wooden theme consistent with the rest of the app.
 */

import React, { useMemo } from 'react';
import { useGame } from '@/lib/GameContext';
import {
    getPlayerStats,
    getMatchHistory,
    getWinRate,
    formatDuration,
    formatMatchDate,
    type PlayerStats,
    type MatchRecord
} from '@/lib/stats';
import { playClickSound } from '@/lib/audio';
import { ACHIEVEMENTS, type Achievement } from '@/lib/achievements';
import type { TranslationDictionary } from '@/lib/translations';

interface PlayerStatsPageProps {
    onClose: () => void;
    t: TranslationDictionary;
}

export default function PlayerStatsPage({ onClose, t }: PlayerStatsPageProps) {
    const { rp, tier, achievements } = useGame();
    // ...
    // Main Stats Grid
    // ...
    const stats = useMemo(() => getPlayerStats(), []);
    const history = useMemo(() => getMatchHistory(), []);
    const winRate = useMemo(() => getWinRate(stats), [stats]);

    // ========================================================================
    // STYLES (Royal Wooden Theme)
    // ========================================================================

    const overlayStyle: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
    };

    const cardStyle: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: 'rgba(26, 17, 9, 0.98)',
        border: '4px solid #8b6b4a',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        padding: '24px',
    };

    const statBoxStyle: React.CSSProperties = {
        background: 'linear-gradient(135deg, rgba(90, 64, 37, 0.6) 0%, rgba(61, 40, 20, 0.6) 100%)',
        borderRadius: '16px',
        padding: '16px',
        textAlign: 'center',
        border: '1px solid #5a4025',
    };

    const goldStatBoxStyle: React.CSSProperties = {
        ...statBoxStyle,
        background: 'linear-gradient(135deg, #ffd700 0%, #daa520 100%)',
        border: '2px solid #b8860b',
        color: '#3d2814',
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
    };

    const closeButtonStyle: React.CSSProperties = {
        width: '40px',
        height: '40px',
        background: 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)',
        borderRadius: '8px',
        border: '2px solid #5a4025',
        boxShadow: '0 2px 0 #3d2814',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#3d2814',
        fontSize: '1.5rem',
    };

    return (
        <div style={overlayStyle} onClick={() => { playClickSound(); onClose(); }}>
            <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={headerStyle}>
                    <h2 style={{
                        color: '#ffd700',
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        margin: 0,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        📊 {t.score || 'Statistics'}
                    </h2>
                    <button
                        style={closeButtonStyle}
                        onClick={() => { playClickSound(); onClose(); }}
                    >
                        ✕
                    </button>
                </div>

                {/* Main Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    {/* Games Played */}
                    {/* Rank Tier */}
                    <div style={statBoxStyle}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#b9f2ff' }}>
                            {tier || 'Bronze'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8b6b4a', textTransform: 'uppercase', fontWeight: 700 }}>
                            {rp || 0} RP
                        </div>
                    </div>

                    <div style={statBoxStyle}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ffd700' }}>
                            {stats.gamesPlayed}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8b6b4a', textTransform: 'uppercase', fontWeight: 700 }}>
                            Games Played
                        </div>
                    </div>

                    {/* Wins */}
                    <div style={statBoxStyle}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4ade80' }}>
                            {stats.gamesWon}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8b6b4a', textTransform: 'uppercase', fontWeight: 700 }}>
                            Wins
                        </div>
                    </div>

                    {/* Win Rate */}
                    <div style={goldStatBoxStyle}>
                        <div style={{ fontSize: '2rem', fontWeight: 900 }}>
                            {winRate}%
                        </div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>
                            Win Rate
                        </div>
                    </div>

                    {/* Current Streak */}
                    <div style={statBoxStyle}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: stats.currentStreak > 0 ? '#f97316' : '#e8d4b8' }}>
                            {stats.currentStreak} 🔥
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8b6b4a', textTransform: 'uppercase', fontWeight: 700 }}>
                            Current Streak
                        </div>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '24px',
                    flexWrap: 'wrap'
                }}>
                    {/* Best Streak */}
                    <div style={{
                        ...statBoxStyle,
                        flex: 1,
                        minWidth: '100px',
                        padding: '12px'
                    }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#e8d4b8' }}>
                            {stats.bestStreak}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#8b6b4a', textTransform: 'uppercase', fontWeight: 700 }}>
                            Best Streak
                        </div>
                    </div>

                    {/* Fastest Win */}
                    <div style={{
                        ...statBoxStyle,
                        flex: 1,
                        minWidth: '100px',
                        padding: '12px'
                    }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#e8d4b8' }}>
                            {stats.fastestWinMs ? formatDuration(stats.fastestWinMs) : '—'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#8b6b4a', textTransform: 'uppercase', fontWeight: 700 }}>
                            Fastest Win
                        </div>
                    </div>
                </div>

                {/* Achievements Section */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{
                        color: '#8b6b4a',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '12px'
                    }}>
                        🏆 Achievements ({achievements.length}/{ACHIEVEMENTS.length})
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                    }}>
                        {ACHIEVEMENTS.map((achievement) => {
                            const isUnlocked = achievements.includes(achievement.id);
                            return (
                                <div
                                    key={achievement.id}
                                    title={`${achievement.name}: ${achievement.description}`}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '8px 4px',
                                        borderRadius: '8px',
                                        background: isUnlocked
                                            ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(139, 107, 74, 0.2) 100%)'
                                            : 'rgba(0, 0, 0, 0.2)',
                                        border: isUnlocked
                                            ? '1px solid rgba(255, 215, 0, 0.4)'
                                            : '1px solid rgba(90, 64, 37, 0.3)',
                                        opacity: isUnlocked ? 1 : 0.5,
                                        filter: isUnlocked ? 'none' : 'grayscale(0.8)',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                                        {achievement.icon}
                                    </div>
                                    <div style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: isUnlocked ? '#ffd700' : '#5a4025',
                                        textAlign: 'center',
                                        lineHeight: 1.2,
                                    }}>
                                        {achievement.name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Match History */}
                <div>
                    <h3 style={{
                        color: '#8b6b4a',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '12px'
                    }}>
                        Recent Games
                    </h3>

                    {history.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            color: '#5a4025',
                            padding: '24px',
                            fontStyle: 'italic'
                        }}>
                            No games played yet
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            paddingRight: '4px' // Space for scrollbar
                        }}>
                            {history.slice(0, 10).map((match) => (
                                <MatchHistoryItem key={match.id} match={match} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MATCH HISTORY ITEM
// ============================================================================

function MatchHistoryItem({ match }: { match: MatchRecord }) {
    const itemStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        background: match.isWin
            ? 'rgba(74, 222, 128, 0.1)'
            : 'rgba(26, 17, 9, 0.6)',
        borderRadius: '12px',
        border: match.isWin
            ? '1px solid rgba(74, 222, 128, 0.3)'
            : '1px solid #3d2814',
    };

    return (
        <div style={itemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Result Icon */}
                <div style={{ fontSize: '1.5rem' }}>
                    {match.isWin ? '🏆' : (match.position === 2 ? '🥈' : (match.position === 3 ? '🥉' : '📋'))}
                </div>

                {/* Details */}
                <div>
                    <div style={{
                        color: match.isWin ? '#4ade80' : '#e8d4b8',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                    }}>
                        {match.isWin ? 'Victory!' : `#${match.position} of ${match.playerCount}`}
                    </div>
                    <div style={{ color: '#5a4025', fontSize: '0.75rem' }}>
                        {formatMatchDate(match.date)} • {formatDuration(match.durationMs)}
                    </div>
                </div>
            </div>

            {/* Score */}
            <div style={{
                color: '#ffd700',
                fontWeight: 900,
                fontSize: '1.1rem'
            }}>
                {match.score}
            </div>
        </div>
    );
}
