'use client';

import React, { useMemo, useCallback, useState, useEffect, memo } from 'react';
import { GameState, LotoCard as LotoCardType, SabotageType, Player } from '@/lib/types';
import { translations } from '@/lib/translations';
import GameHeader from './GameHeader';
import HostControls from './HostControls';
import { useWakeLock } from '@/hooks/useWakeLock';
import { playClickSound } from './GameAudioPlayer';
import SabotageOverlay from './SabotageOverlay';
import { useScreenShake } from './ScreenShakeProvider';
import LeaderboardModal from './LeaderboardModal';
import SabotageShop from './SabotageShop';
import GameProgress from './GameProgress';
import PlayerStatsModal from './PlayerStatsModal';
import GameCardWrapper from './GameCardWrapper';

interface PlayerGameScreenProps {
    gameState: GameState;
    playerId: string;
    cards: LotoCardType[];
    onMarkCell: (cardId: string, row: number, col: number) => void;
    onClaimWin: (cardId: string) => void;
    onClaimFlat: (flatType: number) => void;
    onUseSabotage: (targetId: string, type: SabotageType) => void;

    // Host Props
    isHost?: boolean;
    onCallNumber?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onEndGame?: () => void;
}

// GameCardWrapper extracted for SRP in ./GameCardWrapper

function PlayerGameScreen({
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
    // Memoize derived data
    const calledNumberValues = useMemo(
        () => gameState.calledNumbers.map(cn => cn.value),
        [gameState.calledNumbers]
    );

    const isPaused = gameState.phase === 'paused';
    const t = useMemo(
        () => translations[gameState.settings.language || 'en'],
        [gameState.settings.language]
    );

    const { shake } = useScreenShake();

    const otherPlayers = useMemo(
        () => gameState.players.filter(p => p.id !== playerId),
        [gameState.players, playerId]
    );

    const currentPlayer = useMemo(
        () => gameState.players.find(p => p.id === playerId),
        [gameState.players, playerId]
    );

    // State for targeting mode and modals
    const [targetingItem, setTargetingItem] = useState<SabotageType | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

    // Stable callbacks
    const handleUseItem = useCallback((type: SabotageType) => {
        setTargetingItem(prev => (prev === type ? null : type));
        playClickSound();
    }, []);

    const handleSelectTarget = useCallback((targetId: string) => {
        if (!targetingItem) return;
        playClickSound();
        onUseSabotage(targetId, targetingItem);
        setTargetingItem(null);
    }, [onUseSabotage, targetingItem]);

    const handleShowLeaderboard = useCallback(() => {
        setShowLeaderboard(true);
    }, []);

    const handleCloseLeaderboard = useCallback(() => {
        setShowLeaderboard(false);
    }, []);

    // Keep screen active during gameplay
    const { requestLock, releaseLock } = useWakeLock();
    useEffect(() => {
        if (gameState.phase === 'playing') {
            requestLock();
        } else {
            releaseLock();
        }
    }, [gameState.phase, requestLock, releaseLock]);

    return (
        <div className="flex flex-col overflow-hidden bg-[var(--color-bg)]" style={{ height: '100dvh', minHeight: '100vh' }}>
            {/* Game Header */}
            <GameHeader
                gameState={gameState}
                playerId={playerId}
                calledNumberValues={calledNumberValues}
                onShowLeaderboard={handleShowLeaderboard}
                onPlayerClick={setSelectedPlayer}
                leaveConfirmText={t.leaveConfirm}
            />

            {/* Player Stats Modal */}
            {selectedPlayer && (
                <PlayerStatsModal
                    player={selectedPlayer}
                    currentUserId={playerId}
                    onClose={() => setSelectedPlayer(null)}
                    t={t}
                />
            )}

            {/* Leaderboard Modal */}
            {showLeaderboard && (
                <LeaderboardModal
                    players={gameState.players}
                    currentUserId={playerId}
                    onClose={handleCloseLeaderboard}
                />
            )}

            {/* Paused Overlay */}
            {isPaused && (
                <div
                    className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                    <div className="text-center">
                        <div className="text-6xl mb-4">⏸️</div>
                        <div className="text-white text-2xl font-bold">{t.paused}</div>
                        <p className="text-white/60 text-sm mt-2">Game is paused by host</p>
                    </div>
                </div>
            )}

            {/* Main Content Area: Cards */}
            <div className="flex-1 relative w-full flex flex-col items-center overflow-y-auto overflow-x-hidden" style={{ padding: '8px 4px', minHeight: 0 }}>
                <div className="flex flex-col gap-2 w-full max-w-md h-full" style={{ maxHeight: '100%' }}>
                    {/* Sabotage Shop */}
                    {currentPlayer && (
                        <div className="shrink-0 px-2">
                            <SabotageShop
                                energy={currentPlayer.energy}
                                activeItem={targetingItem}
                                onUseItem={handleUseItem}
                                t={t}
                            />
                        </div>
                    )}

                    {/* Progress Indicator */}
                    <div className="shrink-0">
                        <GameProgress
                            cards={cards}
                            calledNumbers={calledNumberValues}
                            t={t}
                        />
                    </div>

                    {/* Cards Container - Responsive with flex-grow */}
                    <div
                        className="loto-cards-container flex-1 min-h-0 overflow-y-auto"
                        style={{
                            paddingBottom: '8px',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                    >
                        {cards.map((card) => {
                            // Create a fingerprint of the grid to detect shuffles
                            const gridFingerprint = card.grid.flat().map(c => c.value ?? 'x').join('');
                            return (
                                <GameCardWrapper
                                    key={`${card.id}-${gridFingerprint}`}
                                    card={card}
                                    gameState={gameState}
                                    playerId={playerId}
                                    calledNumberValues={calledNumberValues}
                                    onMarkCell={onMarkCell}
                                    onClaimWin={onClaimWin}
                                    onClaimFlat={onClaimFlat}
                                    t={t}
                                />
                            );
                        })}
                    </div>
                </div>
                {targetingItem && (
                    <div
                        className="fixed inset-0 z-[9998] bg-black/85 flex flex-col items-center justify-center p-4"
                        style={{ animation: 'fadeIn 0.2s ease-out' }}
                    >
                        <h2 className="text-white text-xl font-bold mb-4">Select Target 🎯</h2>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            {otherPlayers.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelectTarget(p.id)}
                                    className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 hover:border-white/50 hover:scale-105"
                                >
                                    <div className="w-12 h-12 rounded-full bg-[#D2B48C] flex items-center justify-center text-2xl border-2 border-white/30">
                                        {p.avatarUrl || '👤'}
                                    </div>
                                    <div className="text-white font-medium truncate text-left flex-1">{p.name}</div>
                                </button>
                            ))}
                        </div>
                        <button
                            className="mt-8 btn btn-secondary px-8"
                            onClick={() => setTargetingItem(null)}
                        >
                            ✕ Cancel
                        </button>
                        <style jsx>{`
                            @keyframes fadeIn {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                        `}</style>
                    </div>
                )}
            </div>

            {/* Footer / Mode Info */}
            <div className="text-center py-1 text-[10px] opacity-40 shrink-0">
                Mode: {gameState.settings.gameMode}
                {gameState.settings.crazyMode && ` 🎲 ${t.crazy}`}
            </div>
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

export default memo(PlayerGameScreen);
