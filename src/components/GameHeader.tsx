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
import { playClickSound, toggleMute, isMuted, toggleVoiceMute, isVoiceMuted } from '@/lib/audio';
import {
    k_headerHeight,
    k_buttonSize,
    k_leaderboardButtonSize,
    k_zIndexHeaderControls,
    k_gradientWoodenButton,
    k_colorWoodDark,
    k_colorWoodDarkest,
    k_shadowButton,
    k_colorSuccess,
    k_colorError,
    k_colorGold,
} from '@/lib/constants';
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
    /** Current coin balance */
    coins: number;
    /** Whether socket is connected */
    isConnected?: boolean;
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
    size = k_buttonSize,
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
                background: k_gradientWoodenButton,
                borderRadius: '8px',
                border: `2px solid ${k_colorWoodDark}`,
                boxShadow: k_shadowButton,
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

const MicOnIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#3d2814" stroke="#3d2814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

const MicOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#3d2814" stroke="#3d2814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
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
    isConnected = true,
    calledNumberValues,
    onShowLeaderboard,
    onPlayerClick,
    onLeaveGame,
    leaveConfirmText = "Leave game?",
    coins,
}: GameHeaderProps) {
    // State
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

    // Use ref for modal state to prevent reset on parent re-renders (auto-call updates)
    const isLeaveModalOpenRef = useRef(false);
    const [, triggerRender] = useState(0);

    // Initialize sound state from storage
    useEffect(() => {
        setIsSoundEnabled(!isMuted());
        setIsVoiceEnabled(!isVoiceMuted());
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

    const handleVoiceToggle = useCallback(() => {
        const isNowMuted = toggleVoiceMute();
        setIsVoiceEnabled(!isNowMuted);
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
                    borderBottom: `3px solid ${k_colorWoodDarkest}`,
                    position: 'relative',
                }}
            >
                {/* Row 1: Controls & Current Number */}
                {/* Left Controls: Back & Sound - ABSOLUTE POSITIONED */}
                <div
                    className="absolute z-[100] flex items-center gap-3"
                    style={{
                        top: 'max(12px, env(safe-area-inset-top))',
                        left: 'max(12px, env(safe-area-inset-left))',
                    }}
                >
                    <HeaderButton onClick={handleLeaveButtonClick} ariaLabel="Leave game">
                        <BackArrowIcon />
                    </HeaderButton>

                    <HeaderButton onClick={handleSoundToggle} ariaLabel="Toggle sound">
                        {isSoundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
                    </HeaderButton>

                    <HeaderButton onClick={handleVoiceToggle} ariaLabel="Toggle voice announcer">
                        {isVoiceEnabled ? <MicOnIcon /> : <MicOffIcon />}
                    </HeaderButton>
                </div>

                {/* Right Controls: Connection & Coins - ABSOLUTE POSITIONED */}
                <div
                    className="z-[100] flex items-center gap-3"
                    style={{
                        position: 'absolute',
                        top: 'max(12px, env(safe-area-inset-top))',
                        right: 'max(12px, env(safe-area-inset-right))',
                    }}
                >
                    {/* Connection Status Indicator */}
                    <div
                        title={isConnected ? 'Connected' : 'Reconnecting...'}
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: isConnected ? k_colorSuccess : k_colorError,
                            border: '1px solid rgba(0,0,0,0.2)',
                            boxShadow: isConnected
                                ? '0 0 10px rgba(74, 222, 128, 0.8)'
                                : '0 0 10px rgba(239, 68, 68, 0.8)',
                            transition: 'background-color 0.3s, box-shadow 0.3s',
                            animation: isConnected ? undefined : 'pulse 1.5s ease-in-out infinite',
                        }}
                    />

                    {/* Coin Badge */}
                    <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        height: 40,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>💰</span>
                        <span style={{ color: k_colorGold, fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.1rem' }}>{coins}</span>
                    </div>
                </div>

                {/* Row 1: Spacer for Height & Current Number */}
                <div
                    className="relative w-full"
                    style={{
                        height: k_headerHeight,
                        borderBottom: '2px solid rgba(0,0,0,0.4)',
                    }}
                >
                    {/* Center: Game Numbers Display */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <GameNumbersDisplay
                            currentNumber={gameState.currentNumber}
                            history={calledNumberValues}
                        />
                    </div>
                </div>

                {/* Row 2: Player List */}
                <div className="flex items-end py-2 gap-3 w-full overflow-x-auto no-scrollbar">
                    <HeaderPlayerList
                        players={gameState.players}
                        currentPlayerId={playerId}
                        onPlayerClick={onPlayerClick}
                    />
                </div>

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
                        width: k_leaderboardButtonSize,
                        height: k_leaderboardButtonSize,
                        background: k_gradientWoodenButton,
                        borderRadius: '8px',
                        border: `2px solid ${k_colorWoodDark}`,
                        boxShadow: k_shadowButton,
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
