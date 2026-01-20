/**
 * Engine Module Barrel Export
 * 
 * Provides a clean API for the game logic layer.
 */

// Card Generation
export {
    generateLotoCard,
    generateCards,
    markCell,
    hasNumber,
    getCardNumbers,
} from './lotoCardGenerator';

// Game Modes
export {
    type GameModeConfig,
    gameModes,
    getGameMode,
    checkPlayerWin,
} from './gameModes';

// Game Engine
export {
    generateRoomCode,
    generatePlayerId,
    createGame,
    addPlayer,
    removePlayer,
    startGame,
    callNextNumber,
    autoMarkBots,
    pauseGame,
    resumeGame,
    resetGame,
    checkForWinners,
    setWinner,
    claimFlat,
} from './gameEngine';
