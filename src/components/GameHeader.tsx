'use client';

import React, { useMemo, useCallback, memo } from 'react';
import { GameState, Player, FlatWinners } from '@/lib/types';
import NumberMedallion from './NumberMedallion';
import NumberHistory from './NumberHistory';
import PlayerList from './PlayerList';
import { playClickSound } from './GameAudioPlayer';

interface GameHeaderProps {
    gameState: GameState;
    playerId: string;
    calledNumberValues: number[];
    onShowLeaderboard: () => void;
    leaveConfirmText?: string;
}

/**
 * PlayerAvatar Component (Memoized)
 * Displays a single player's avatar with name.
 */
interface PlayerAvatarProps {
    player: Player;
    size?: 'sm' | 'lg';
    heatLevel?: number;
}

const PlayerAvatar = memo(function PlayerAvatar({ player, size = 'lg', heatLevel = 0 }: PlayerAvatarProps) {
    const isImageUrl = player.avatarUrl &&
        (player.avatarUrl.startsWith('http') || player.avatarUrl.startsWith('data:'));

    const sizeClasses = size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
    const textSize = size === 'lg' ? 'text-xl' : 'text-base';

    // Heat Styles
    const borderColor = heatLevel === 1 ? 'border-red-500' : heatLevel === 2 ? 'border-orange-500' : 'border-[#8B4513]';
    const shadowClass = heatLevel === 1 ? 'shadow-[0_0_15px_rgba(239,68,68,0.8)]' : heatLevel === 2 ? 'shadow-[0_0_10px_rgba(249,115,22,0.6)]' : 'shadow-md';
    const animationClass = heatLevel === 1 ? 'animate-pulse' : '';

    return (
        <div className="flex items-center gap-2 shrink-0 relative group">
            {/* Heat Emoji */}
            {heatLevel > 0 && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-lg z-20 ${heatLevel === 1 ? 'animate-bounce' : ''}`}>
                    {heatLevel === 1 ? '🔥' : '⚠️'}
                </div>
            )}

            <div
                className={`${sizeClasses} rounded-lg border-2 ${borderColor} bg-[#D2B48C] flex items-center justify-center ${shadowClass} overflow-hidden ${animationClass} transition-all duration-300`}
            >
                {isImageUrl ? (
                    <img
                        src={player.avatarUrl}
                        alt={player.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className={textSize}>
                        {player.avatarUrl || player.name.charAt(0)}
                    </span>
                )}
            </div>
            <span className={`text-xs font-bold ${heatLevel === 1 ? 'text-red-500' : 'text-[#5c3a21]'} max-w-[60px] truncate`}>
                {player.name}
            </span>
        </div>
    );
});

/**
 * GameHeader Component
 * Displays the top HUD with current number, history, and player avatars.
 * Handles safe-area insets for iPhone notch/Dynamic Island.
 */
function GameHeader({
    gameState,
    playerId,
    calledNumberValues,
    onShowLeaderboard,
    leaveConfirmText = "Leave game?",
}: GameHeaderProps) {
    // Memoize derived data
    const currentPlayer = useMemo(
        () => gameState.players.find(p => p.id === playerId),
        [gameState.players, playerId]
    );

    const currentPlayerHeat = useMemo(() => {
        if (!currentPlayer?.cards) return 0;
        let minLeft = 999;
        currentPlayer.cards.forEach(c => {
            let count = 0;
            c.grid.forEach(row => row.forEach(cell => {
                if (cell.value !== null && !cell.isMarked) count++;
            }));
            if (count < minLeft) minLeft = count;
        });
        return minLeft <= 1 ? 1 : minLeft <= 2 ? 2 : 0;
    }, [currentPlayer]);

    const otherPlayers = useMemo(
        () => gameState.players.filter(p => p.id !== playerId),
        [gameState.players, playerId]
    );

    // Stable callbacks
    const handleLeaveClick = useCallback(() => {
        if (confirm(leaveConfirmText)) {
            window.location.href = '/';
        }
    }, [leaveConfirmText]);

    const handleShowLeaderboard = useCallback(() => {
        playClickSound();
        onShowLeaderboard();
    }, [onShowLeaderboard]);

    return (
        <div
            className="wooden-panel flex flex-col shrink-0 z-20 shadow-md relative"
            style={{
                borderRadius: '0 0 16px 16px',
                padding: '0',
                overflow: 'hidden',
                paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
        >
            {/* Row 1: Controls & Game State */}
            <div
                className="flex items-center justify-between px-2 py-1 w-full"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', minHeight: '48px' }}
            >
                {/* Left: Navigation & Settings */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        className="btn btn-square btn-xs btn-wood"
                        onClick={handleLeaveClick}
                        aria-label="Leave game"
                    >
                        ⬅️
                    </button>
                    <button
                        className="btn btn-square btn-xs btn-wood"
                        onClick={() => { /* Sound toggle placeholder */ }}
                        aria-label="Toggle sound"
                    >
                        🔊
                    </button>
                </div>

                {/* Center: Current Number */}
                <div className="flex-1 flex justify-center">
                    <div
                        className="rounded-full border-2 border-[#8B4513] bg-[#DEB887] shadow-md"
                        style={{ transform: 'scale(0.85)' }}
                    >
                        <NumberMedallion number={gameState.currentNumber} size="md" />
                    </div>
                </div>

                {/* Right: History + Trophy */}
                <div className="flex items-center gap-1 shrink-0">
                    <div className="scale-[0.6] origin-right">
                        <NumberHistory numbers={calledNumberValues} maxVisible={4} />
                    </div>
                    <button
                        onClick={handleShowLeaderboard}
                        className="btn btn-circle btn-xs btn-ghost text-yellow-500"
                        style={{ fontSize: '1rem' }}
                        aria-label="Show leaderboard"
                    >
                        🏆
                    </button>
                </div>
            </div>

            {/* Row 2: Player Status (Me & Others) */}
            <div className="flex items-center px-2 py-1 gap-2 w-full bg-black/5">
                {/* Current Player Avatar */}
                {currentPlayer && (
                    <PlayerAvatar player={currentPlayer} size="lg" heatLevel={currentPlayerHeat} />
                )}

                {/* Separator */}
                <div className="w-px h-8 bg-[#8B4513] opacity-30 shrink-0" />

                {/* Other Players: Horizontal Scroll */}
                <div className="flex-1 overflow-x-auto no-scrollbar">
                    <PlayerList
                        players={otherPlayers}
                        currentPlayerId={playerId}
                        compact={true}
                        flatWinners={gameState.flatWinners}
                    />
                </div>
            </div>
        </div>
    );
}

export default memo(GameHeader);
