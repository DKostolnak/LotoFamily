'use client';

import React, { useCallback, memo } from 'react';
import { GameState, Player } from '@/lib/types';
import { playClickSound } from './GameAudioPlayer';
import GameNumbersDisplay from './GameNumbersDisplay';
import HeaderPlayerList from './HeaderPlayerList';

interface GameHeaderProps {
    gameState: GameState;
    playerId: string;
    calledNumberValues: number[];
    onShowLeaderboard: () => void;
    onPlayerClick?: (player: Player) => void;
    leaveConfirmText?: string;
}

/**
 * GameHeader Component
 * Displays the top HUD with current number, history, and player avatars.
 * Handles safe-area insets for iPhone notch/Dynamic Island.
 * Refactored to use sub-components for better maintainability.
 */
function GameHeader({
    gameState,
    playerId,
    calledNumberValues,
    onShowLeaderboard,
    onPlayerClick,
    leaveConfirmText = "Leave game?",
}: GameHeaderProps) {

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
            className="flex flex-col shrink-0 z-50 shadow-xl relative"
            style={{
                borderRadius: '0 0 16px 16px',
                padding: '0',
                overflow: 'hidden',
                paddingTop: 'env(safe-area-inset-top, 0px)',
                width: '100%',
                backgroundImage: 'url(/assets/wood-seamless.png)',
                backgroundSize: '256px 256px',
                backgroundRepeat: 'repeat',
                borderBottom: '3px solid #2d1f10',
                position: 'relative',
            }}
        >
            {/* Row 1: Sound, Current Number and History centered */}
            <div
                className="relative w-full"
                style={{
                    height: '130px', // Fixed height for stability
                    borderBottom: '2px solid rgba(0,0,0,0.4)',
                }}
            >
                {/* Left: Back & Sound Buttons - Absolute positioned Group */}
                <div
                    className="absolute z-20 flex items-center gap-2"
                    style={{
                        left: '12px',
                        top: '34px',
                    }}
                >
                    {/* Back Button */}
                    <button
                        className="active:scale-95 transition-transform"
                        onClick={handleLeaveClick}
                        aria-label="Leave game"
                        style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)',
                            borderRadius: '8px',
                            border: '2px solid #5a4025',
                            boxShadow: '0 2px 0 #3d2814, inset 0 1px 0 rgba(255,255,255,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3d2814" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Sound Button */}
                    <button
                        className="active:scale-95 transition-transform"
                        onClick={() => { /* Sound placeholder */ }}
                        aria-label="Toggle sound"
                        style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)',
                            borderRadius: '8px',
                            border: '2px solid #5a4025',
                            boxShadow: '0 2px 0 #3d2814, inset 0 1px 0 rgba(255,255,255,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#3d2814" stroke="#3d2814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" />
                        </svg>
                    </button>
                </div>

                {/* Center: Game Numbers (Main Chip + History) */}
                {/* Absolutely positioned to be dead center of the panel */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <GameNumbersDisplay
                        currentNumber={gameState.currentNumber}
                        history={calledNumberValues}
                    />
                </div>
            </div>

            {/* Row 2: Player Avatars with Names - Horizontal Scroll */}
            <HeaderPlayerList
                players={gameState.players}
                currentPlayerId={playerId}
                onPlayerClick={onPlayerClick}
            />

            {/* Bottom Right: Leaderboard Button - Absolute positioned in the corner */}
            <button
                className="absolute active:scale-95 transition-transform z-20"
                onClick={handleShowLeaderboard}
                aria-label="Show leaderboard"
                style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    width: '44px',
                    height: '44px',
                    background: 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)',
                    borderRadius: '8px',
                    border: '2px solid #5a4025',
                    boxShadow: '0 3px 0 #3d2814, inset 0 1px 0 rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3d2814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
            </button>
        </div>
    );
}

export default memo(GameHeader);

