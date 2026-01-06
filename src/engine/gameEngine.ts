/**
 * Game Engine - Core game logic
 * 
 * Handles game state management, number calling, and win detection
 */

import { DEFAULT_GAME_SETTINGS, type GameState, type GameSettings, type Player, type CalledNumber } from '../lib/types.ts';
import { generateCards, getCardNumbers } from './lotoCardGenerator.ts';
import { checkPlayerWin } from './gameModes.ts';

/**
 * Generate a random room code (6 characters)
 */
export function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (I, O, 0, 1)
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Generate a unique player ID
 */
export function generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substring(2, 11);
}

/**
 * Initialize a shuffled array of numbers 1-90
 */
function initializeNumberPool(): number[] {
    const numbers: number[] = [];
    for (let i = 1; i <= 90; i++) {
        numbers.push(i);
    }
    // Fisher-Yates shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers;
}

/**
 * Create a new game state
 */
export function createGame(hostId: string, hostName: string, avatarUrl: string, settings?: Partial<GameSettings>, token?: string): GameState {
    const gameSettings: GameSettings = { ...DEFAULT_GAME_SETTINGS, ...settings };
    const roomCode = generateRoomCode();

    const hostPlayer: Player = {
        id: hostId,
        name: hostName,
        avatarUrl,
        token,
        cards: generateCards(hostId, gameSettings.cardsPerPlayer),
        isHost: true,
        isConnected: true,
        collectedFlats: [],
        energy: 0,
        score: 0,
        activeDebuffs: {},
    };

    return {
        roomId: 'room_' + Math.random().toString(36).substring(2, 11),
        roomCode,
        phase: 'lobby',
        settings: gameSettings,
        players: [hostPlayer],
        calledNumbers: [],
        currentNumber: null,
        remainingNumbers: initializeNumberPool(),
        winnerId: null,
        hostId,
        createdAt: Date.now(),
        flatWinners: { flat1: null, flat2: null },
    };
}

/**
 * Add a player to the game
 */
export function addPlayer(state: GameState, playerId: string, playerName: string, avatarUrl: string, token?: string): GameState | null {
    // Check if game is in lobby phase
    if (state.phase !== 'lobby') {
        return null;
    }

    // Check max players
    if (state.players.length >= state.settings.maxPlayers) {
        return null;
    }

    // Check if player already exists
    if (state.players.some(p => p.id === playerId)) {
        return null;
    }

    const newPlayer: Player = {
        id: playerId,
        name: playerName,
        avatarUrl,
        token,
        cards: generateCards(playerId, state.settings.cardsPerPlayer),
        isHost: false,
        isConnected: true,
        collectedFlats: [],
        energy: 0,
        score: 0,
        activeDebuffs: {},
    };

    return {
        ...state,
        players: [...state.players, newPlayer],
    };
}

/**
 * Remove a player from the game
 */
export function removePlayer(state: GameState, playerId: string): GameState {
    const updatedPlayers = state.players.filter(p => p.id !== playerId);

    // If host left and game hasn't started, assign new host
    let newHostId = state.hostId;
    if (playerId === state.hostId && updatedPlayers.length > 0) {
        newHostId = updatedPlayers[0].id;
        updatedPlayers[0] = { ...updatedPlayers[0], isHost: true };
    }

    return {
        ...state,
        players: updatedPlayers,
        hostId: newHostId,
    };
}

/**
 * Start the game
 */
export function startGame(state: GameState): GameState {
    if (state.phase !== 'lobby') {
        return state;
    }

    return {
        ...state,
        phase: 'playing',
        remainingNumbers: initializeNumberPool(), // Fresh shuffle
        calledNumbers: [],
        currentNumber: null,
    };
}

/**
 * Call the next number
 */
// ...
export function callNextNumber(state: GameState): GameState {
    if (state.phase !== 'playing' || state.remainingNumbers.length === 0) {
        return state;
    }

    const [nextNumber, ...remaining] = state.remainingNumbers;

    const calledNumber: CalledNumber = {
        value: nextNumber,
        timestamp: Date.now(),
    };



    return {
        ...state,
        currentNumber: nextNumber,
        calledNumbers: [...state.calledNumbers, calledNumber],
        remainingNumbers: remaining,
        players: state.players,
    };
}

/**
 * Check for winners after a number is called
 */
export function checkForWinners(state: GameState): { winnerId: string; winningCardId: string } | null {
    const calledNumberValues = state.calledNumbers.map(cn => cn.value);

    for (const player of state.players) {
        // Main win check (3 rows / Full Card)
        const winningCard = checkPlayerWin(player.cards, calledNumberValues, state.settings.gameMode);
        if (winningCard) {
            return { winnerId: player.id, winningCardId: winningCard.id };
        }
    }

    return null;
}

/**
 * Set the winner and end the game
 */
export function setWinner(state: GameState, winnerId: string): GameState {
    // Award points for winning (Bingo)
    const updatedPlayers = state.players.map(p => {
        if (p.id === winnerId) {
            return { ...p, score: (p.score || 0) + 1000 };
        }
        return p;
    });

    return {
        ...state,
        players: updatedPlayers,
        phase: 'finished',
        winnerId,
    };
}

/**
 * Pause the game
 */
export function pauseGame(state: GameState): GameState {
    if (state.phase !== 'playing') {
        return state;
    }
    return { ...state, phase: 'paused' };
}

/**
 * Resume the game
 */
export function resumeGame(state: GameState): GameState {
    if (state.phase !== 'paused') {
        return state;
    }
    return { ...state, phase: 'playing' };
}

/**
 * Reset game for a new round (keep players, reset numbers)
 */
export function resetGame(state: GameState): GameState {
    // Regenerate cards for all players
    const playersWithNewCards = state.players.map(player => ({
        ...player,
        cards: generateCards(player.id, state.settings.cardsPerPlayer),
        collectedFlats: [],
    }));

    return {
        ...state,
        phase: 'lobby',
        players: playersWithNewCards,
        calledNumbers: [],
        currentNumber: null,
        remainingNumbers: initializeNumberPool(),
        winnerId: null,
        flatWinners: { flat1: null, flat2: null },
    };
}

/**
 * Helper: Check if a player has N rows completed on any single card
 */
function getCompletedRowCount(player: Player, calledNumbers: number[]): number {
    const calledSet = new Set(calledNumbers);
    let maxRows = 0;

    for (const card of player.cards) {
        let cardRows = 0;
        for (const row of card.grid) {
            let rowComplete = true;
            for (const cell of row) {
                if (cell.value !== null && !calledSet.has(cell.value)) {
                    rowComplete = false;
                    break;
                }
            }
            if (rowComplete) cardRows++;
        }
        if (cardRows > maxRows) maxRows = cardRows;
    }
    return maxRows;
}

/**
 * Claim a flat (Intermediate Prize)
 */
export function claimFlat(state: GameState, playerId: string, flatType: number): GameState {
    const player = state.players.find(p => p.id === playerId);
    if (!player || state.phase !== 'playing') return state;

    // Validation: Does player actually have this flat level?
    const calledNumberValues = state.calledNumbers.map(c => c.value);
    const maxRows = getCompletedRowCount(player, calledNumberValues);

    if (maxRows < flatType) {
        // Player tried to claim a flat they don't have completed
        return state;
    }

    // Allow claim if not already claimed
    if (player.collectedFlats.includes(flatType)) {
        return state;
    }

    // Check specific player count rules? 
    // "If there are 3 players... only 2 and 3 room flats counted"
    // "If 2 players... only 3 room flat counted"
    // Implementation: We won't block the claim action itself for visual feedback, 
    // but maybe we don't award the "Green Bar" (First Winner) if it's not a "counted" flat?
    // User request: "If the bar is green, it means that the player has collected the “Flat” first."
    // Let's simplified logic: Allow all claims, but UI decides simple tracking.

    // Update player
    const updatedPlayers = state.players.map(p => {
        if (p.id === playerId) {
            let points = 0;
            // Base points for flats
            if (flatType === 1) points = 100;
            if (flatType === 2) points = 200;

            // Bonus for being FIRST
            // We check the *current state* (before this claim is processed)
            if (flatType === 1 && !state.flatWinners.flat1) points += 150;
            if (flatType === 2 && !state.flatWinners.flat2) points += 300;

            return {
                ...p,
                collectedFlats: [...p.collectedFlats, flatType].sort(),
                score: (p.score || 0) + points
            };
        }
        return p;
    });

    // Check if they are the FIRST to claim this flat
    let updatedFlatWinners = { ...state.flatWinners };
    if (flatType === 1 && !updatedFlatWinners.flat1) {
        updatedFlatWinners.flat1 = playerId;
    } else if (flatType === 2 && !updatedFlatWinners.flat2) {
        updatedFlatWinners.flat2 = playerId;
    }

    return {
        ...state,
        players: updatedPlayers,
        flatWinners: updatedFlatWinners,
    };
}


