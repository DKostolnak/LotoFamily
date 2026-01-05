'use client';

import React, { useEffect } from 'react';
import MainMenu from '@/components/MainMenu';
import WaitingLobby from '@/components/WaitingLobby';
import PlayerGameScreen from '@/components/PlayerGameScreen';
import HostCallerScreen from '@/components/HostCallerScreen';
import WinnerCelebration from '@/components/WinnerCelebration';
import GameAudioPlayer from '@/components/GameAudioPlayer';
import { useGame } from '@/lib/GameContext';

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
    useSabotage
  } = useGame();

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
        onUseSabotage={useSabotage}

        // Host Props
        isHost={isHost}
        onCallNumber={handleCallNumber}
        onPause={handlePauseGame}
        onResume={handleResumeGame}
        onEndGame={handleEndGame}
      />
    </>
  );
}
