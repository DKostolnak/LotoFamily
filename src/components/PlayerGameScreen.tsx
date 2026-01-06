'use client';

import React from 'react';
import { GameState, LotoCard as LotoCardType } from '@/lib/types';
import { translations } from '@/lib/translations';
import LotoCard from './LotoCard';
import NumberMedallion from './NumberMedallion';
import NumberHistory from './NumberHistory';
import PlayerList from './PlayerList';
import { useWakeLock } from '@/hooks/useWakeLock';
import { playClickSound, playErrorSound, playFreezeSound, playSplatSound, playBonusSound } from './GameAudioPlayer';
import SabotageOverlay from './SabotageOverlay';
import { useScreenShake } from './ScreenShakeProvider';
import CallerBoard from './CallerBoard';
// Leaderboard import
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

    // State for targeting mode
    const [targetingItem, setTargetingItem] = React.useState<import('@/lib/types').SabotageType | null>(null);
    const [isHostControlsExpanded, setHostControlsExpanded] = React.useState(false);
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
            {/* Top HUD: Current Number, History, stats */}
            <div className="wooden-panel grid grid-cols-3 items-center px-2 py-2 shrink-0 z-20 shadow-md relative" style={{ borderRadius: 0, minHeight: '60px' }}>
                {/* Left: Player Info (Compact) */}
                <div className="flex items-center justify-start min-w-0 gap-2">
                    <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full relative max-w-[70%]">
                        {/* Energy Bar Indicator */}
                        {(() => {
                            const me = gameState.players.find(p => p.id === playerId);
                            const energy = me?.energy || 0;
                            return (
                                <div
                                    className="absolute bottom-0 left-0 h-1 bg-yellow-400 transition-all duration-300 rounded-full"
                                    style={{ width: `${Math.min(100, energy)}%` }}
                                />
                            );
                        })()}

                        <div className="shrink-0" style={{ width: 24, height: 24, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-gold)', borderRadius: '50%' }}>
                            {(() => {
                                const me = gameState.players.find(p => p.id === playerId);
                                return me?.avatarUrl || me?.name.charAt(0).toUpperCase();
                            })()}
                        </div>
                        <span className="truncate" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {gameState.players.find(p => p.id === playerId)?.name}
                        </span>
                    </div>

                    {/* Leaderboard Toggle */}
                    <button
                        onClick={() => { playClickSound(); setShowLeaderboard(true); }}
                        className="btn btn-circle btn-xs btn-ghost text-yellow-400 hover:bg-white/10"
                    >
                        🏆
                    </button>
                </div>

                {/* Center: Current Number (The Star) */}
                <div className="flex justify-center items-center">
                    <div className="-mt-1">
                        <NumberMedallion number={gameState.currentNumber} size="md" />
                    </div>
                </div>

                {/* Right: History & Count */}
                <div className="flex flex-col items-end justify-center min-w-0">
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>
                        {gameState.calledNumbers.length}/90
                    </div>
                    <div className="scale-90 origin-right">
                        <NumberHistory numbers={calledNumberValues} maxVisible={3} />
                    </div>
                </div>
            </div>

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
            {/* Host Controls Fixed Bottom Bar */}
            {/* Host Controls Fixed Bottom Bar */}
            {isHost && (
                <>
                    {/* Collapsed Mode: Minimal FABs */}
                    {!isHostControlsExpanded && (
                        <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
                            {/* Call Next FAB */}
                            <button
                                className="btn btn-primary shadow-lg"
                                style={{
                                    width: 64, height: 64, borderRadius: '50%',
                                    fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '4px solid var(--color-bg-paper)'
                                }}
                                onClick={onCallNumber}
                                disabled={!gameState.remainingNumbers.length || isPaused}
                            >
                                🎲
                            </button>
                            {/* Expand Menu FAB */}
                            <button
                                className="btn btn-secondary shadow-lg"
                                style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                onClick={() => setHostControlsExpanded(true)}
                            >
                                ⚙️
                            </button>
                        </div>
                    )}

                    {/* Expanded Mode: Full Bar */}
                    {isHostControlsExpanded && (
                        <div className="fixed bottom-0 left-0 right-0 bg-black/90 p-3 pt-2 pb-safe z-50 border-t border-white/10 backdrop-blur-md animate-slide-up">
                            {/* Close Button */}
                            <button
                                className="absolute -top-10 right-4 bg-black/80 px-3 py-1 rounded-t-lg text-sm border-t border-x border-white/10"
                                onClick={() => setHostControlsExpanded(false)}
                            >
                                🔽 Hide
                            </button>

                            <div className="max-w-md mx-auto flex items-center justify-between gap-2">
                                {/* Pause/Resume */}
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.8rem', fontSize: '1.2rem' }}
                                    onClick={isPaused ? onResume : onPause}
                                >
                                    {isPaused ? '▶️' : '⏸️'}
                                </button>

                                {/* Call Next (Big Button) */}
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '0.8rem', fontSize: '1.1rem', fontWeight: 800 }}
                                    onClick={onCallNumber}
                                    disabled={!gameState.remainingNumbers.length || isPaused}
                                >
                                    🎲 {t.callNext}
                                </button>

                                {/* Show Board Button */}
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.8rem', fontSize: '1.2rem' }}
                                    onClick={() => (document.getElementById('callerBoardModal') as HTMLDialogElement)?.showModal()}
                                >
                                    📋
                                </button>

                                {/* End Game (Mini) */}
                                <button
                                    className="btn btn-danger"
                                    style={{ padding: '0.8rem', fontSize: '1.2rem' }}
                                    onClick={() => {
                                        if (confirm('End game?')) onEndGame?.();
                                    }}
                                >
                                    🛑
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Host Caller Board Modal */}
            <dialog id="callerBoardModal" className="modal modal-bottom sm:modal-middle bg-transparent backdrop:bg-black/80">
                <div className="modal-box bg-[var(--color-bg-paper)] text-[var(--color-text-primary)] border-2 border-[var(--color-gold)]">
                    <h3 className="font-bold text-lg mb-4 text-center">📋 {t.currentNumber}</h3>
                    <CallerBoard calledNumbers={calledNumberValues} currentNumber={gameState.currentNumber} />
                    <div className="modal-action justify-center mt-6">
                        <form method="dialog">
                            <button className="btn btn-primary">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>

            {/* Bottom Padding for Host to prevent overlap */}
            {isHost && <div style={{ height: '80px' }} />}
        </div>
    );
}
