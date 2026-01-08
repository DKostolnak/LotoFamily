'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GameState, Player } from '@/lib/types';
import { playClickSound, toggleMute, isMuted } from '@/lib/audio';
import GameNumbersDisplay from './GameNumbersDisplay';
import HeaderPlayerList from './HeaderPlayerList';

interface GameHeaderProps {
    gameState: GameState;
    playerId: string;
    calledNumberValues: number[];
    onShowLeaderboard: () => void;
    onPlayerClick?: (player: Player) => void;
    onLeaveGame?: () => void;
    leaveConfirmText?: string;
}

/**
 * GameHeader Component
 * Displays the top HUD with current number, history, and player avatars.
 * Handles safe-area insets for iPhone notch/Dynamic Island.
 * Uses useRef for modal state to prevent reset during frequent re-renders.
 */
function GameHeader({
    gameState,
    playerId,
    calledNumberValues,
    onShowLeaderboard,
    onPlayerClick,
    onLeaveGame,
    leaveConfirmText = "Leave game?",
}: GameHeaderProps) {
    const [soundEnabled, setSoundEnabled] = useState(true);
    // Use ref + forceUpdate pattern for modal to prevent reset on parent re-renders
    const showLeaveConfirmRef = useRef(false);
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        setSoundEnabled(!isMuted());
    }, []);

    // Stable callbacks
    const handleLeaveClick = useCallback(() => {
        playClickSound();
        showLeaveConfirmRef.current = true;
        forceUpdate(n => n + 1);
    }, []);

    const confirmLeave = useCallback(() => {
        playClickSound();
        showLeaveConfirmRef.current = false;
        forceUpdate(n => n + 1);
        if (onLeaveGame) {
            onLeaveGame();
        } else {
            window.location.href = '/';
        }
    }, [onLeaveGame]);

    const cancelLeave = useCallback(() => {
        playClickSound();
        showLeaveConfirmRef.current = false;
        forceUpdate(n => n + 1);
    }, []);

    const handleSoundToggle = useCallback(() => {
        const isNowMuted = toggleMute();
        setSoundEnabled(!isNowMuted);
        if (!isNowMuted) {
            playClickSound();
        }
    }, []);

    const handleShowLeaderboard = useCallback(() => {
        playClickSound();
        onShowLeaderboard();
    }, [onShowLeaderboard]);

    return (
        <>
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
                        className="absolute z-[100] flex items-center gap-2 pointer-events-auto"
                        style={{
                            position: 'absolute',
                            left: 'max(12px, env(safe-area-inset-left))',
                            top: '12px',
                        }}
                    >
                        {/* Back Button */}
                        <button
                            className="active:scale-95 transition-transform z-[101] pointer-events-auto"
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
                                cursor: 'pointer', // Ensure cursor pointer
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3d2814" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Sound Button */}
                        <button
                            className="active:scale-95 transition-transform z-[101] pointer-events-auto"
                            onClick={handleSoundToggle}
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
                                cursor: 'pointer',
                            }}
                        >
                            {soundEnabled ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#3d2814" stroke="#3d2814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#3d2814" stroke="#3d2814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <line x1="23" y1="9" x2="17" y2="15" />
                                    <line x1="17" y1="9" x2="23" y2="15" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Center: Game Numbers (Main Chip + History) */}
                    {/* Absolutely positioned to be dead center of the panel */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
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
                    className="absolute active:scale-95 transition-transform z-[100] pointer-events-auto"
                    onClick={handleShowLeaderboard}
                    aria-label="Show leaderboard"
                    style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: 'max(12px, env(safe-area-inset-right))',
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

            {/* Leave Confirmation Modal - Portaled to body for correct stacking */}
            {showLeaveConfirmRef.current && typeof document !== 'undefined' && createPortal(
                <div
                    className="animate-fadeIn"
                    style={{
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)',
                        padding: '16px',
                    }}
                >
                    {/* Modal Card - Wooden Theme */}
                    <div
                        style={{
                            backgroundImage: 'url(/assets/wood-seamless.png)',
                            backgroundSize: '256px 256px',
                            backgroundRepeat: 'repeat',
                            borderRadius: '20px',
                            border: '4px solid #2d1f10',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.1)',
                            padding: '24px',
                            width: '100%',
                            maxWidth: '320px',
                        }}
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Title */}
                        <h3
                            style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                marginBottom: '20px',
                                color: '#f5e6c8',
                                textShadow: '1px 1px 0 #3d2814, -1px -1px 0 #3d2814, 1px -1px 0 #3d2814, -1px 1px 0 #3d2814, 0 2px 4px rgba(0,0,0,0.6)',
                            }}
                        >
                            {leaveConfirmText}
                        </h3>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            {/* No Button */}
                            <button
                                onClick={cancelLeave}
                                className="active:scale-95 transition-transform"
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    background: 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)',
                                    borderRadius: '12px',
                                    border: '3px solid #5a4025',
                                    boxShadow: '0 4px 0 #3d2814, inset 0 1px 0 rgba(255,255,255,0.3)',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    color: '#3d2814',
                                    cursor: 'pointer',
                                }}
                            >
                                No
                            </button>

                            {/* Yes Button */}
                            <button
                                onClick={confirmLeave}
                                className="active:scale-95 transition-transform"
                                style={{
                                    flex: 1,
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
                                }}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default GameHeader;

