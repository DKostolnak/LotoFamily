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
    onPlayerClick?: (player: Player) => void;
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
    onPlayerClick,
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
            className="wooden-panel flex flex-col shrink-0 z-50 shadow-xl relative"
            style={{
                borderRadius: '0 0 24px 24px',
                padding: '0',
                overflow: 'hidden',
                paddingTop: 'env(safe-area-inset-top, 0px)',
                width: '100%',
                backgroundImage: 'url(/assets/wood-pattern.png), linear-gradient(180deg, #8B4513 0%, #5c3a21 100%)',
                backgroundBlendMode: 'overlay',
                borderBottom: '2px solid rgba(0,0,0,0.3)'
            }}
        >
            {/* Row 1: Controls & Game State - Grid ensures perfect center for number */}
            <div
                className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 w-full"
                style={{
                    minHeight: '64px', // Taller header for better touch targets
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                {/* Left: Navigation & Settings */}
                <div className="flex items-center gap-3 justify-start">
                    <button
                        className="btn btn-circle btn-sm btn-wood shadow-lg active:scale-95 transition-transform"
                        onClick={handleLeaveClick}
                        aria-label="Leave game"
                        style={{ width: '40px', height: '40px' }}
                    >
                        {/* Back Arrow SVG */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-amber-100">
                            <path d="M19 12H5" />
                            <path d="M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        className="btn btn-circle btn-sm btn-wood shadow-lg active:scale-95 transition-transform"
                        onClick={() => { /* Sound placeholder */ }}
                        aria-label="Toggle sound"
                        style={{ width: '40px', height: '40px' }}
                    >
                        {/* Sound Icon SVG */}
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-100">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                    </button>
                </div>

                {/* Center: Current Number - Big and Bold */}
                <div className="flex justify-center shrink-0 z-10 relative">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full transform scale-150 animate-pulse" />
                    <div
                        className="rounded-full border-4 border-[#5c3a21] bg-[#DEB887] shadow-[0_4px_8px_rgba(0,0,0,0.4)] relative"
                        style={{ transform: 'scale(1)' }} // No scaling down!
                    >
                        <NumberMedallion number={gameState.currentNumber} size="md" />
                    </div>
                </div>

                {/* Right: History + Trophy */}
                <div className="flex items-center gap-2 justify-end">
                    <div className="hidden sm:block origin-right transform scale-75 lg:scale-90 opacity-90">
                        <NumberHistory numbers={calledNumberValues} maxVisible={3} />
                    </div>
                    {/* Mobile: Compact history showing just last number? Or rely on board? */}
                    {/* Let's show Trophy prominently */}
                    <button
                        onClick={handleShowLeaderboard}
                        className="btn btn-circle btn-sm btn-ghost text-yellow-400 hover:text-yellow-300 hover:bg-white/10 transition-all shadow-sm"
                        style={{ width: '40px', height: '40px' }}
                        aria-label="Show leaderboard"
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-md">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                            <path d="M4 22h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path fillRule="evenodd" d="M12 2L9 9H4l4 7-2 6 6-2 6 2-2-6 4-7h-5z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Row 2: Player Status (Me & Others) - Compact but clean */}
            <div className="flex items-center px-4 py-2 gap-3 w-full bg-black/20 backdrop-blur-sm">
                {/* Current Player Avatar */}
                {currentPlayer && (
                    <div
                        className="shrink-0 transform scale-100 hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => { playClickSound(); onPlayerClick?.(currentPlayer); }}
                    >
                        <PlayerAvatar player={currentPlayer} size="lg" heatLevel={currentPlayerHeat} />
                    </div>
                )}

                {/* Separator */}
                <div className="w-px h-10 bg-white/20 shrink-0 mx-1" />

                {/* Other Players: Horizontal Scroll */}
                <div className="flex-1 overflow-x-auto no-scrollbar mask-gradient-right flex items-center">
                    <PlayerList
                        players={otherPlayers}
                        currentPlayerId={playerId}
                        compact={true}
                        flatWinners={gameState.flatWinners}
                        onPlayerClick={(p) => { playClickSound(); onPlayerClick?.(p); }}
                    />
                </div>
            </div>
        </div>
    );
}

export default memo(GameHeader);
