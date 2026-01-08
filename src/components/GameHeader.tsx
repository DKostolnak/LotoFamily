'use client';

/**
 * GameHeader Component
 * 
 * Displays the top HUD with:
 * - Back button (leave game)
 * - Sound toggle
 * - Current called number with history
 * - Player avatars (horizontal scrollable list)
 * - Leaderboard button
 * 
 * Handles safe-area insets for iPhone notch/Dynamic Island.
 */

import React, { useCallback, useState, useEffect, useRef, memo } from 'react';
import { GameState, Player } from '@/lib/types';
import { playClickSound, toggleMute, isMuted } from '@/lib/audio';
import GameNumbersDisplay from './GameNumbersDisplay';
import HeaderPlayerList from './HeaderPlayerList';
import { ConfirmModal } from './common';

// ============================================================================
// TYPES
// ============================================================================

interface GameHeaderProps {
    /** Current game state */
    gameState: GameState;
    /** Current player's ID */
    playerId: string;
    /** Array of called number values for history display */
    calledNumberValues: number[];
    /** Callback to show the leaderboard modal */
    onShowLeaderboard: () => void;
    /** Callback when a player avatar is clicked */
    onPlayerClick?: (player: Player) => void;
    /** Callback when user confirms leaving the game */
    onLeaveGame?: () => void;
    /** Custom text for leave confirmation dialog */
    leaveConfirmText?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const HEADER_HEIGHT = 130;
const BUTTON_SIZE = 40;
const LEADERBOARD_BUTTON_SIZE = 44;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface HeaderButtonProps {
    onClick: () => void;
    ariaLabel: string;
    children: React.ReactNode;
    size?: number;
}

/**
 * HeaderButton - Wooden styled button for header actions
 */
const HeaderButton = memo(function HeaderButton({
    onClick,
    ariaLabel,
    children,
    size = BUTTON_SIZE,
}: HeaderButtonProps) {
    return (
        <button
            type="button"
            className="active:scale-95 transition-transform"
            onClick={onClick}
            aria-label={ariaLabel}
            style={{
                width: size,
                height: size,
                background: 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)',
                borderRadius: '8px',
                border: '2px solid #5a4025',
                boxShadow: '0 2px 0 #3d2814, inset 0 1px 0 rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
            }}
        >
            {children}
        </button>
    );
});

// ============================================================================
// ICONS
// ============================================================================

const BackArrowIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3d2814" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

const SoundOnIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#3d2814" stroke="#3d2814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" />
    </svg>
);

const SoundOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#3d2814" stroke="#3d2814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
);

const TrophyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3d2814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function GameHeader({
    gameState,
    playerId,
    calledNumberValues,
    onShowLeaderboard,
    onPlayerClick,
    onLeaveGame,
    leaveConfirmText = "Leave game?",
}: GameHeaderProps) {
    // State
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);

    // Use ref for modal state to prevent reset on parent re-renders (auto-call updates)
    const isLeaveModalOpenRef = useRef(false);
    const [, triggerRender] = useState(0);

    // Initialize sound state from storage
    useEffect(() => {
        setIsSoundEnabled(!isMuted());
    }, []);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    const handleLeaveButtonClick = useCallback(() => {
        playClickSound();
        isLeaveModalOpenRef.current = true;
        triggerRender(n => n + 1);
    }, []);

    const handleLeaveConfirm = useCallback(() => {
        isLeaveModalOpenRef.current = false;
        triggerRender(n => n + 1);

        if (onLeaveGame) {
            onLeaveGame();
        } else {
            window.location.href = '/';
        }
    }, [onLeaveGame]);

    const handleLeaveCancel = useCallback(() => {
        isLeaveModalOpenRef.current = false;
        triggerRender(n => n + 1);
    }, []);

    const handleSoundToggle = useCallback(() => {
        const isNowMuted = toggleMute();
        setIsSoundEnabled(!isNowMuted);
        if (!isNowMuted) {
            playClickSound();
        }
    }, []);

    const handleLeaderboardClick = useCallback(() => {
        playClickSound();
        onShowLeaderboard();
    }, [onShowLeaderboard]);

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <>
            <header
                className="flex flex-col shrink-0 z-50 shadow-xl"
                style={{
                    borderRadius: '0 0 16px 16px',
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
                {/* Row 1: Controls & Current Number */}
                <div
                    className="relative w-full"
                    style={{
                        height: HEADER_HEIGHT,
                        borderBottom: '2px solid rgba(0,0,0,0.4)',
                    }}
                >
                    {/* Left Controls: Back & Sound */}
                    <div
                        className="absolute z-[100] flex items-center gap-3"
                        style={{
                            left: 'max(12px, env(safe-area-inset-left))',
                            top: '12px',
                        }}
                    >
                        <HeaderButton onClick={handleLeaveButtonClick} ariaLabel="Leave game">
                            <BackArrowIcon />
                        </HeaderButton>

                        <HeaderButton onClick={handleSoundToggle} ariaLabel="Toggle sound">
                            {isSoundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
                        </HeaderButton>
                    </div>

                    {/* Center: Game Numbers Display */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <GameNumbersDisplay
                            currentNumber={gameState.currentNumber}
                            history={calledNumberValues}
                        />
                    </div>
                </div>

                {/* Row 2: Player List */}
                <HeaderPlayerList
                    players={gameState.players}
                    currentPlayerId={playerId}
                    onPlayerClick={onPlayerClick}
                />

                {/* Leaderboard Button (Bottom Right) */}
                <button
                    type="button"
                    className="absolute active:scale-95 transition-transform z-[100]"
                    onClick={handleLeaderboardClick}
                    aria-label="Show leaderboard"
                    style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: 'max(12px, env(safe-area-inset-right))',
                        width: LEADERBOARD_BUTTON_SIZE,
                        height: LEADERBOARD_BUTTON_SIZE,
                        background: 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)',
                        borderRadius: '8px',
                        border: '2px solid #5a4025',
                        boxShadow: '0 3px 0 #3d2814, inset 0 1px 0 rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <TrophyIcon />
                </button>
            </header>

            {/* Leave Confirmation Modal */}
            <ConfirmModal
                isOpen={isLeaveModalOpenRef.current}
                title={leaveConfirmText}
                onConfirm={handleLeaveConfirm}
                onCancel={handleLeaveCancel}
                confirmText="Yes"
                cancelText="No"
                variant="danger"
            />
        </>
    );
}

export default memo(GameHeader);
