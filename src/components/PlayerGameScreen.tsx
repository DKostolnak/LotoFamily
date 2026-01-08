'use client';

import React, { useMemo, useCallback, useState, useEffect, memo } from 'react';
import { GameState, LotoCard as LotoCardType, Player } from '@/lib/types';
import { translations } from '@/lib/translations';
import GameHeader from './GameHeader';

import { useWakeLock } from '@/hooks/useWakeLock';
import { playClickSound } from '@/lib/audio';
import { useScreenShake } from './ScreenShakeProvider';
import LeaderboardModal from './LeaderboardModal';
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

    // Host Props
    isHost?: boolean;
    onCallNumber?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onEndGame?: () => void;
    onLeaveGame?: () => void;
}

// GameCardWrapper extracted for SRP in ./GameCardWrapper

function PlayerGameScreen({
    gameState,
    playerId,
    cards,
    onMarkCell,
    onClaimWin,
    onClaimFlat,

    isHost = false,
    onCallNumber,
    onPause,
    onResume,
    onEndGame,
    onLeaveGame
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
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

    // Stable callbacks
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
                onLeaveGame={onLeaveGame}
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
                    t={t}
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
                        <p className="text-white/60 text-sm mt-2">{t.pausedByHost}</p>
                    </div>
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
            {/* Footer / Mode Info */}
            <div className="text-center py-1 text-[10px] opacity-40 shrink-0">
                {t.mode}: {gameState.settings.gameMode}
                {gameState.settings.crazyMode && ` 🎲 ${t.crazy}`}
            </div>
        </div>
    );
}

export default memo(PlayerGameScreen);
