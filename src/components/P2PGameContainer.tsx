'use client';

import React, { useMemo, useState } from 'react';
import { useP2PGame } from '@/lib/p2p/P2PContext';
import { translations } from '@/lib/translations';
import PlayerGameScreen from '@/components/PlayerGameScreen';
import WaitingLobby from '@/components/WaitingLobby';
import WinnerCelebration from '@/components/WinnerCelebration';
import GameAudioPlayer from '@/components/GameAudioPlayer';
import { useGame } from '@/lib/GameContext'; // Only for playerAvatar, coins etc if needed

export default function P2PGameContainer() {
    const {
        gameState,
        playerId,
        isHost,
        startGame,
        leaveRoom,
        markCell,
        claimWin,
        pauseGame,
        resumeGame,
        restartGame,
        // No claimFlat in P2P MVP yet
    } = useP2PGame();

    const { playerAvatar } = useGame(); // Use main context for avatar persistence

    // Translations
    const t = useMemo(() => {
        const lang = gameState?.settings?.language || 'en';
        return translations[lang] || translations.en;
    }, [gameState?.settings?.language]);

    // Handle winners
    const winner = gameState?.winnerId
        ? gameState.players.find(p => p.id === gameState.winnerId)
        : null;

    // Get current player
    const currentPlayer = gameState?.players.find(p => p.id === playerId);

    if (!gameState) return null;

    // Common audio player
    const audioPlayer = <GameAudioPlayer gameState={gameState} />;

    // 1. FINISHED SCREEN
    if (gameState.phase === 'finished' && winner) {
        return (
            <>
                {audioPlayer}
                <WinnerCelebration
                    winner={winner}
                    players={gameState.players}
                    isHost={isHost}
                    isPersonalBest={false} // No stats persist in P2P MVP
                    onNewGame={() => isHost && restartGame()}
                    onBackToLobby={leaveRoom}
                    currentUserId={playerId || ''}
                    t={t}
                />
            </>
        );
    }

    // 2. LOBBY SCREEN
    if (gameState.phase === 'lobby') {
        return (
            <>
                {audioPlayer}
                <WaitingLobby
                    gameState={gameState}
                    currentPlayerId={playerId || ''}
                    isHost={isHost}
                    onStartGame={() => isHost && startGame()}
                    onLeaveGame={leaveRoom}
                />
            </>
        );
    }

    // 3. PLAYING SCREEN
    return (
        <>
            {audioPlayer}
            <PlayerGameScreen
                gameState={gameState}
                playerId={playerId || ''}
                cards={currentPlayer?.cards || []}
                onMarkCell={markCell}
                onClaimWin={claimWin}
                onClaimFlat={() => { }} // Not implemented in P2P MVP

                // Host controls
                isHost={isHost}
                onCallNumber={() => { }} // Auto-caller handles this in P2P engine
                onPause={() => isHost && pauseGame()}
                onResume={() => isHost && resumeGame()}
                onEndGame={leaveRoom}
                onLeaveGame={leaveRoom}
            />
        </>
    );
}
