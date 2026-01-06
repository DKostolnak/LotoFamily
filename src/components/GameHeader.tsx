'use client';

import React from 'react';
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
 * GameHeader Component
 * Displays the top HUD with current number, history, and player avatars.
 * Handles safe-area insets for iPhone notch/Dynamic Island.
 */
export default function GameHeader({
    gameState,
    playerId,
    calledNumberValues,
    onShowLeaderboard,
    leaveConfirmText = "Leave game?",
}: GameHeaderProps) {
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    const otherPlayers = gameState.players.filter(p => p.id !== playerId);

    const handleLeaveClick = () => {
        if (confirm(leaveConfirmText)) {
            window.location.href = '/';
        }
    };

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
                        onClick={() => { playClickSound(); onShowLeaderboard(); }}
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
                    <PlayerAvatar player={currentPlayer} size="lg" />
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

/**
 * PlayerAvatar Component
 * Displays a single player's avatar with name.
 */
interface PlayerAvatarProps {
    player: Player;
    size?: 'sm' | 'lg';
}

function PlayerAvatar({ player, size = 'lg' }: PlayerAvatarProps) {
    const isImageUrl = player.avatarUrl &&
        (player.avatarUrl.startsWith('http') || player.avatarUrl.startsWith('data:'));

    const sizeClasses = size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
    const textSize = size === 'lg' ? 'text-xl' : 'text-base';

    return (
        <div className="flex items-center gap-2 shrink-0">
            <div
                className={`${sizeClasses} rounded-lg border-2 border-[#8B4513] bg-[#D2B48C] flex items-center justify-center shadow-md overflow-hidden`}
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
            <span className="text-xs font-bold text-[#5c3a21] max-w-[60px] truncate">
                {player.name}
            </span>
        </div>
    );
}
