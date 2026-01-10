'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic'
import MainMenu from '@/components/MainMenu';
import { useGame } from '@/lib/GameContext';
import { useP2PGame } from '@/lib/p2p/P2PContext';
import { translations } from '@/lib/translations';
import { recordGameResult } from '@/lib/stats';

// Statically import components to avoid loading delays
import WaitingLobby from '@/components/WaitingLobby';
import PlayerGameScreen from '@/components/PlayerGameScreen';
import WinnerCelebration from '@/components/WinnerCelebration';
import GameAudioPlayer from '@/components/GameAudioPlayer';
import P2PGameContainer from '@/components/P2PGameContainer';

/*
 * LoadingSpinner kept for potential future use
 */
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

  // P2P Context
  const { isConnected: isP2PConnected, gameState: p2pGameState } = useP2PGame();

  // Prefetch components for faster transitions
  usePrefetchComponents(gameState?.phase);

  // ========================================================================
  // STATS TRACKING
  // ========================================================================
  const gameStartTimeRef = useRef<number | null>(null);
  const statsRecordedRef = useRef<string | null>(null); // Track which game we recorded
  const [isPersonalBest, setIsPersonalBest] = useState(false);

  // Track when game starts
  useEffect(() => {
    if (gameState?.phase === 'playing' && !gameStartTimeRef.current) {
      gameStartTimeRef.current = Date.now();
    }
    // Reset when back to lobby
    if (gameState?.phase === 'lobby') {
      gameStartTimeRef.current = null;
      statsRecordedRef.current = null;
      setIsPersonalBest(false);
    }
  }, [gameState?.phase]);

  // Record stats when game finishes
  useEffect(() => {
    if (gameState?.phase !== 'finished') return;
    if (!gameState.winnerId || !playerId) return;

    // Prevent duplicate recording (same game)
    const gameKey = `${gameState.roomCode}-${gameState.winnerId}`;
    if (statsRecordedRef.current === gameKey) return;
    statsRecordedRef.current = gameKey;

    const durationMs = gameStartTimeRef.current
      ? Date.now() - gameStartTimeRef.current
      : 0;

    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    const myPosition = sortedPlayers.findIndex(p => p.id === playerId) + 1;
    const myScore = sortedPlayers.find(p => p.id === playerId)?.score ?? 0;
    const winner = sortedPlayers[0];

    const { isPersonalBest: isPB } = recordGameResult({
      isWin: gameState.winnerId === playerId,
      durationMs,
      score: myScore,
      position: myPosition,
      playerCount: gameState.players.length,
      winnerId: winner?.id ?? '',
      winnerName: winner?.name ?? '',
    });

    if (isPB) {
      setIsPersonalBest(true);
    }
  }, [gameState?.phase, gameState?.winnerId, playerId, gameState?.roomCode, gameState?.players]);

  // ========================================================================
  // TRANSLATIONS & DERIVED STATE
  // ========================================================================

  // Get translations based on game settings or browser default
  const t = useMemo(() => {
    const lang = gameState?.settings?.language || 'en';
    return translations[lang] || translations.en;
  }, [gameState?.settings?.language]);

  // Handle winners
  const winner = gameState?.winnerId
    ? gameState.players.find(p => p.id === gameState.winnerId)
    : null;

  // Calculate winning card for display
  const winningCard = useMemo(() => {
    if (!winner || !gameState?.calledNumbers) return undefined;
    const calledValues = new Set(gameState.calledNumbers.map(cn => cn.value));
    // Find card with most matches (the winning one)
    return winner.cards.slice().sort((a, b) => {
      const countA = a.grid.flat().filter(cell => cell && cell !== 0 && calledValues.has(cell)).length;
      const countB = b.grid.flat().filter(cell => cell && cell !== 0 && calledValues.has(cell)).length;
      return countB - countA;
    })[0];
  }, [winner, gameState?.calledNumbers]);

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

  // Render based on game state

  // 1. Check for P2P Game First
  if (isP2PConnected && p2pGameState) {
    return <P2PGameContainer />;
  }

  // 2. Regular Server Game
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
          winningCard={winningCard}
          players={gameState.players}
          isHost={isHost}
          isPersonalBest={isPersonalBest}
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
