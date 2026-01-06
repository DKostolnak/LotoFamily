'use client';

import React from 'react';
import { GameState, LotoCard as LotoCardType } from '@/lib/types';
import { translations } from '@/lib/translations';
import LotoCard from './LotoCard';
import GameHeader from './GameHeader';
import HostControls from './HostControls';
import { useWakeLock } from '@/hooks/useWakeLock';
import { playClickSound, playErrorSound, playFreezeSound, playSplatSound, playBonusSound } from './GameAudioPlayer';
import SabotageOverlay from './SabotageOverlay';
import { useScreenShake } from './ScreenShakeProvider';
import Leaderboard from './Leaderboard';

interface PlayerGameScreenProps {
    gameState: GameState;
    playerId: string;
    cards: LotoCardType[];
    onMarkCell: (cardId: string, row: number, col: number) => void;
    onClaimWin: (cardId: string) => void;
    onClaimFlat: (flatType: number) => void;
    onUseSabotage: (targetId: string, type: import('@/lib/types').SabotageType) => void;

    // Host Props
    isHost?: boolean;
    onCallNumber?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onEndGame?: () => void;
}

export default function PlayerGameScreen({
    // ... props
    gameState,
    playerId,
    cards,
    onMarkCell,
    onClaimWin,
    onClaimFlat,
    onUseSabotage,

    isHost = false,
    onCallNumber,
    onPause,
    onResume,
    onEndGame
}: PlayerGameScreenProps) {
    const calledNumberValues = gameState.calledNumbers.map(cn => cn.value);
    const isPaused = gameState.phase === 'paused';
    const t = translations[gameState.settings.language || 'en'];
    const { shake } = useScreenShake();

    // State for targeting mode and modals
    const [targetingItem, setTargetingItem] = React.useState<import('@/lib/types').SabotageType | null>(null);
    const [showLeaderboard, setShowLeaderboard] = React.useState(false);

    const handleUseItem = (type: import('@/lib/types').SabotageType) => {
        if (targetingItem === type) {
            setTargetingItem(null); // Toggle off
        } else {
            playClickSound();
            setTargetingItem(type);
        }
    };

    const handleSelectTarget = (targetId: string) => {
        if (targetingItem) {
            playClickSound();
            onUseSabotage(targetId, targetingItem);
            setTargetingItem(null);
        }
    };

    // Keep screen active during gameplay
    const { requestLock, releaseLock } = useWakeLock();
    React.useEffect(() => {
        if (gameState.phase === 'playing') {
            requestLock();
        } else {
            releaseLock();
        }
    }, [gameState.phase, requestLock, releaseLock]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-bg)]">
            {/* Game Header */}
            <GameHeader
                gameState={gameState}
                playerId={playerId}
                calledNumberValues={calledNumberValues}
                onShowLeaderboard={() => setShowLeaderboard(true)}
                leaveConfirmText={t.leaveConfirm}
            />

            {/* Leaderboard Modal */}
            {showLeaderboard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="relative w-full max-w-sm">
                        <Leaderboard players={gameState.players} currentUserId={playerId} />
                        <button
                            onClick={() => { playClickSound(); setShowLeaderboard(false); }}
                            className="absolute -top-3 -right-3 btn btn-circle btn-sm btn-error shadow-lg"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Paused Overlay */}
            {isPaused && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm text-white text-2xl font-bold"
                >
                    ⏸️ {t.paused}
                </div>
            )}

            {/* Main Content Area: Cards */}
            <div className="flex-1 relative w-full flex flex-col items-center justify-center overflow-hidden" style={{ padding: '8px' }}>
                <div className="flex flex-col gap-2 h-full justify-center" style={{ width: '100%', maxWidth: 'min(100%, 380px)' }}>
                    {/* Bonus Bar (Floating or just above cards? Let's put above) */}


                    {/* Sabotage Shop */}
                    {(() => {
                        const currentPlayer = gameState.players.find(p => p.id === playerId);
                        if (!currentPlayer) return null;
                        const energy = currentPlayer.energy || 0;

                        return (
                            <div className="flex justify-center gap-2 shrink-0 py-1 border-t border-white/10 mt-1">
                                <button
                                    className={`btn btn-xs tooltip tooltip-bottom ${energy >= 40 ? 'btn-info' : 'opacity-50 grayscale'}`}
                                    onClick={() => handleUseItem('snowball')}
                                    disabled={energy < 40}
                                    data-tip="Freeze 5s (40e)"
                                >
                                    ❄️ 40
                                </button>
                                <button
                                    className={`btn btn-xs tooltip tooltip-bottom ${energy >= 60 ? 'btn-purple hover:opacity-90' : 'opacity-50 grayscale'}`}
                                    onClick={() => handleUseItem('ink_splat')}
                                    disabled={energy < 60}
                                    data-tip="Ink Squirt (60e)"
                                >
                                    🐙 60
                                </button>
                                <button
                                    className={`btn btn-xs tooltip tooltip-bottom ${energy >= 90 ? 'btn-warning' : 'opacity-50 grayscale'}`}
                                    onClick={() => handleUseItem('swap_hand')}
                                    disabled={energy < 90}
                                    data-tip="Chaos Shuffle (90e)"
                                >
                                    🌀 90
                                </button>
                            </div>
                        );
                    })()}

                    {/* Progress Indicator */}
                    {(() => {
                        // Calculate total progress across all cards
                        let totalNumbers = 0;
                        let markedCorrectly = 0;
                        cards.forEach(card => {
                            card.grid.forEach(row => {
                                row.forEach(cell => {
                                    if (cell.value !== null) {
                                        totalNumbers++;
                                        if (cell.isMarked && calledNumberValues.includes(cell.value)) {
                                            markedCorrectly++;
                                        }
                                    }
                                });
                            });
                        });
                        const remaining = totalNumbers - markedCorrectly;
                        const progressPercent = totalNumbers > 0 ? Math.round((markedCorrectly / totalNumbers) * 100) : 0;

                        return (
                            <div className="shrink-0 text-center" style={{ marginBottom: '4px' }}>
                                {remaining <= 5 && remaining > 0 ? (
                                    <div style={{
                                        color: 'var(--color-gold)',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        animation: 'pulse 1s infinite'
                                    }}>
                                        🔥 Almost there! {remaining} left!
                                    </div>
                                ) : (
                                    <div style={{
                                        color: 'var(--color-text-light)',
                                        fontSize: '0.75rem',
                                        opacity: 0.7
                                    }}>
                                        Progress: {markedCorrectly}/{totalNumbers} ({progressPercent}%)
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Cards Container - Significant separation */}
                    <div className="flex-1 flex flex-col gap-8 justify-center min-h-0 px-2" style={{ paddingBottom: '16px' }}>
                        {cards.map((card) => {
                            // Local win check logic
                            let completedRows = 0;
                            card.grid.forEach(row => {
                                if (row.every(cell => cell.value === null || cell.isMarked)) {
                                    completedRows++;
                                }
                            });

                            const currentPlayer = gameState.players.find(p => p.id === playerId);
                            const collectedFlats = currentPlayer?.collectedFlats || [];

                            const canClaimFlat1 = completedRows >= 1 && !collectedFlats.includes(1);
                            const canClaimFlat2 = completedRows >= 2 && !collectedFlats.includes(2);

                            return (
                                <div key={card.id} className="flex flex-col relative shrink-1 min-h-0">
                                    {/* Overlay Buttons for claiming */}
                                    <div className="absolute top-0 left-0 right-0 z-10 flex justify-center -translate-y-1/2 pointer-events-none">
                                        <div className="pointer-events-auto flex gap-1">
                                            {canClaimFlat1 && (
                                                <button
                                                    className="btn btn-secondary btn-xs shadow-lg animate-bounce"
                                                    onClick={() => {
                                                        playClickSound();
                                                        onClaimFlat(1);
                                                    }}
                                                >
                                                    🏠 Claim 1
                                                </button>
                                            )}
                                            {canClaimFlat2 && (
                                                <button
                                                    className="btn btn-secondary btn-xs shadow-lg animate-bounce"
                                                    onClick={() => {
                                                        playClickSound();
                                                        onClaimFlat(2);
                                                    }}
                                                >
                                                    🏠🏠 Claim 2
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* The Card - Compact Mode Forced? No, let css handle size via flex */}
                                    <div className="flex-1 flex items-center justify-center min-h-0" style={{ width: '100%' }}>
                                        {/* Card container - full width for mobile */}
                                        <div style={{ width: '100%' }}>
                                            <LotoCard
                                                card={card}
                                                onCellClick={(row, col) => {
                                                    // Visual feedback for marking
                                                    const cell = card.grid[row][col];
                                                    if (cell.value !== null && !cell.isMarked) {
                                                        const isCorrect = gameState.currentNumber === cell.value || gameState.calledNumbers.some(cn => cn.value === cell.value);

                                                        if (isCorrect) {
                                                            playClickSound();
                                                            shake('light');
                                                        } else {
                                                            // Logic for mistake handled by game engine (sabotage?), 
                                                            // but we can give bad feedback here too.
                                                            playErrorSound();
                                                            shake('medium');
                                                        }
                                                    }
                                                    onMarkCell(card.id, row, col);
                                                }}
                                                calledNumbers={calledNumberValues}
                                                highlightedNumber={gameState.currentNumber}
                                                highlightAllCalled={true}
                                                compact={true}
                                            />
                                        </div>
                                    </div>

                                    {/* Win Button Overlay */}
                                    {card.grid.every(row => row.every(cell => cell.value === null || cell.isMarked)) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 rounded-lg">
                                            <button
                                                className="btn btn-primary btn-lg animate-pulse shadow-xl border-4 border-white"
                                                onClick={() => {
                                                    playClickSound();
                                                    onClaimWin(card.id);
                                                }}
                                            >
                                                🎉 {t.claimBingo}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer / Mode Info */}
            <div className="text-center py-1 text-[10px] opacity-40 shrink-0">
                Mode: {gameState.settings.gameMode}
                {gameState.settings.crazyMode && ` 🎲 ${t.crazy}`}
            </div>
            {/* Targeting Overlay */}
            {targetingItem && (
                <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center animate-in fade-in p-4">
                    <h2 className="text-white text-xl font-bold mb-4">Select Target 🎯</h2>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        {gameState.players.filter(p => p.id !== playerId).map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleSelectTarget(p.id)}
                                className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/10 hover:border-white/50"
                            >
                                <div className="text-2xl">{p.avatarUrl || '👤'}</div>
                                <div className="text-white font-medium truncate">{p.name}</div>
                            </button>
                        ))}
                    </div>
                    <button
                        className="mt-8 btn btn-secondary"
                        onClick={() => setTargetingItem(null)}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Sabotage Effects Overlay */}
            {(() => {
                const me = gameState.players.find(p => p.id === playerId);
                if (!me?.activeDebuffs) return null;
                return (
                    <SabotageOverlay
                        frozenUntil={me.activeDebuffs.frozenUntil}
                        inkSplats={me.activeDebuffs.inkSplats}
                    />
                );
            })()}
            {/* Host Controls */}
            {isHost && (
                <HostControls
                    remainingCount={gameState.remainingNumbers.length}
                    currentNumber={gameState.currentNumber}
                    calledNumbers={calledNumberValues}
                    isPaused={isPaused}
                    language={gameState.settings.language}
                    onCallNumber={onCallNumber}
                    onPause={onPause}
                    onResume={onResume}
                    onEndGame={onEndGame}
                />
            )}
        </div>
    );
}
