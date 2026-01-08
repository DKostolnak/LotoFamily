'use client';

import React, { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import MainMenu from '@/components/MainMenu';
import { useGame } from '@/lib/GameContext';
import { translations } from '@/lib/translations';

// Dynamically import heavy components to reduce initial bundle
const WaitingLobby = dynamic(() => import('@/components/WaitingLobby'), {
  loading: () => <LoadingSpinner />,
});
const PlayerGameScreen = dynamic(() => import('@/components/PlayerGameScreen'), {
  loading: () => <LoadingSpinner />,
});
const WinnerCelebration = dynamic(() => import('@/components/WinnerCelebration'), {
  loading: () => <LoadingSpinner />,
});
const GameAudioPlayer = dynamic(() => import('@/components/GameAudioPlayer'), {
  ssr: false, // Audio doesn't need SSR
});

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-[var(--color-bg)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-gold)]" />
    </div>
  );
}

/**
 * Prefetch components based on likely next phase
 */
function usePrefetchComponents(phase: string | undefined) {
  useEffect(() => {
    if (phase === 'lobby') {
      // Prefetch game screen when in lobby
      import('@/components/PlayerGameScreen');
    } else if (phase === 'playing' || phase === 'paused') {
      // Prefetch winner celebration during gameplay
      import('@/components/WinnerCelebration');
    }
  }, [phase]);
}

/**
 * Main App Page
 * 
 * Updated for Phase 2: Uses real multiplayer WebSocket connection via GameContext
 */
export default function Home() {
  const {
    gameState,
    playerId,
    isHost,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    callNextNumber,
    markCell,
    claimWin,
    pauseGame,
    resumeGame,
    restartGame,
    error,
    claimFlat,

  } = useGame();

  // Prefetch components for faster transitions
  usePrefetchComponents(gameState?.phase);

  // Get translations based on game settings or browser default
  const t = useMemo(() => {
    const lang = gameState?.settings?.language || 'en';
    return translations[lang] || translations.en;
  }, [gameState?.settings?.language]);

  // Handle winners
  const winner = gameState?.winnerId
    ? gameState.players.find(p => p.id === gameState.winnerId)
    : null;

  // Get current player from state (might have more info than just ID)
  const currentPlayer = gameState?.players.find(p => p.id === playerId);

  const handleCreateGame = (name: string, settings?: Partial<import('@/lib/types').GameSettings>) => {
    createRoom(name, settings);
  };

  const handleJoinGame = (roomCode: string, name: string) => {
    joinRoom(roomCode, name);
  };

  const handleLeaveGame = () => {
    leaveRoom();
  };

  const handleStartGame = () => {
    startGame();
  };

  const handleCallNumber = () => {
    callNextNumber();
  };

  const handleMarkCell = (cardId: string, row: number, col: number) => {
    markCell(cardId, row, col);
  };

  const handleClaimWin = (cardId: string) => {
    claimWin(cardId);
  };

  const handlePauseGame = () => {
    pauseGame();
  };

  const handleResumeGame = () => {
    resumeGame();
  };

  const handleNewGame = () => {
    if (isHost) {
      restartGame();
    }
  };

  const handleBackToLobby = () => {
    leaveRoom();
  };

  const handleEndGame = () => {
    leaveRoom();
  };

  // Common render elements
  const audioPlayer = <GameAudioPlayer gameState={gameState} />;

  // Render based on game state
  if (!gameState) {
    return (
      <>
        {audioPlayer}
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            {error}
          </div>
        )}
        <MainMenu
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
        />
      </>
    );
  }

  if (gameState.phase === 'finished' && winner) {
    return (
      <>
        {audioPlayer}
        <WinnerCelebration
          winner={winner}
          isHost={isHost}
          onNewGame={handleNewGame}
          onBackToLobby={handleBackToLobby}
          currentUserId={playerId || ''}
          t={t}
        />
      </>
    );
  }

  if (gameState.phase === 'lobby') {
    return (
      <>
        {audioPlayer}
        <WaitingLobby
          gameState={gameState}
          currentPlayerId={playerId || ''}
          isHost={isHost}
          onStartGame={handleStartGame}
          onLeaveGame={handleLeaveGame}
        />
      </>
    );
  }

  // Game is playing or paused
  // Game is playing or paused
  // Unified View: Host plays as a player but with extra controls
  return (
    <>
      {audioPlayer}
      <PlayerGameScreen
        gameState={gameState}
        playerId={playerId || ''}
        cards={currentPlayer?.cards || []}
        onMarkCell={handleMarkCell}
        onClaimWin={handleClaimWin}
        onClaimFlat={claimFlat}


        // Host Props
        isHost={isHost}
        onCallNumber={handleCallNumber}
        onPause={handlePauseGame}
        onResume={handleResumeGame}
        onEndGame={handleEndGame}
        onLeaveGame={handleLeaveGame}
      />
    </>
  );
}
