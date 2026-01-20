/**
 * Game Engine - Core game logic for Loto 90
 *
 * Handles:
 * - Game state management
 * - Player management
 * - Number calling
 * - Win detection
 * - Flat (intermediate prize) claiming
 * 
 * This is a pure logic module with no platform-specific dependencies.
 */

import {
    DEFAULT_GAME_SETTINGS,
    type GameState,
    type GameSettings,
    type Player,
    type CalledNumber,
} from '@/lib/types';
import { ROOM_CODE_CHARS, ROOM_CODE_LENGTH, POINTS } from '@/lib/constants';
import { generateCards, markCell } from './lotoCardGenerator';
import { checkPlayerWin } from './gameModes';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a random room code
 * @returns 6-character alphanumeric code
 */
export function generateRoomCode(): string {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length));
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
 * Initialize a shuffled array of numbers 1-90 using Fisher-Yates
 */
function initializeNumberPool(): number[] {
    const numbers: number[] = Array.from({ length: 90 }, (_, i) => i + 1);

    // Fisher-Yates shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    return numbers;
}

/**
 * Create a new player object
 */
function createPlayer(
    id: string,
    name: string,
    avatar: string,
    cardsPerPlayer: number,
    isHost: boolean,
    token?: string
): Player {
    return {
        id,
        name,
        avatar,
        token,
        cards: generateCards(id, cardsPerPlayer),
        isHost,
        isConnected: true,
        collectedFlats: [],
        score: 0,
    };
}

// ============================================================================
// GAME STATE FUNCTIONS
// ============================================================================

/**
 * Create a new game state
 */
export function createGame(
    hostId: string,
    hostName: string,
    avatar: string,
    settings?: Partial<GameSettings>,
    token?: string
): GameState {
    const gameSettings: GameSettings = { ...DEFAULT_GAME_SETTINGS, ...settings };
    const hostPlayer = createPlayer(hostId, hostName, avatar, gameSettings.cardsPerPlayer, true, token);

    return {
        roomId: 'room_' + Math.random().toString(36).substring(2, 11),
        roomCode: generateRoomCode(),
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
 * @returns Updated state or null if player cannot join
 */
export function addPlayer(
    state: GameState,
    playerId: string,
    playerName: string,
    avatar: string,
    token?: string
): GameState | null {
    // Validate game phase
    if (state.phase !== 'lobby') return null;

    // Check max players
    if (state.players.length >= state.settings.maxPlayers) return null;

    // Check for duplicate player
    if (state.players.some(p => p.id === playerId)) return null;

    const newPlayer = createPlayer(
        playerId,
        playerName,
        avatar,
        state.settings.cardsPerPlayer,
        false,
        token
    );

    return {
        ...state,
        players: [...state.players, newPlayer],
    };
}

/**
 * Remove a player from the game
 * Automatically assigns new host if host leaves
 */
export function removePlayer(state: GameState, playerId: string): GameState {
    const updatedPlayers = state.players.filter(p => p.id !== playerId);

    // Assign new host if needed
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

// ============================================================================
// GAME FLOW FUNCTIONS
// ============================================================================

/**
 * Start the game (transition from lobby to playing)
 */
export function startGame(state: GameState): GameState {
    if (state.phase !== 'lobby') return state;

    return {
        ...state,
        phase: 'playing',
        startedAt: Date.now(),
        remainingNumbers: initializeNumberPool(),
        calledNumbers: [],
        currentNumber: null,
    };
}

/**
 * Call the next number from the pool
 */
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
    };
}

/**
 * Automatically mark cards for bot players
 */
export function autoMarkBots(state: GameState): GameState {
    if (state.phase !== 'playing' || !state.currentNumber) {
        return state;
    }

    const currentNum = state.currentNumber;
    let hasUpdates = false;

    const updatedPlayers = state.players.map(player => {
        if (!player.isBot) return player;

        let playerUpdated = false;
        const newCards = player.cards.map(card => {
            for (let r = 0; r < card.grid.length; r++) {
                for (let c = 0; c < card.grid[r].length; c++) {
                    const cell = card.grid[r][c];
                    if (cell.value === currentNum && !cell.isMarked) {
                        playerUpdated = true;
                        hasUpdates = true;
                        return markCell(card, r, c);
                    }
                }
            }
            return card;
        });

        if (playerUpdated) {
            return { ...player, cards: newCards };
        }
        return player;
    });

    if (!hasUpdates) {
        return state;
    }

    return {
        ...state,
        players: updatedPlayers
    };
}

/**
 * Pause the game
 */
export function pauseGame(state: GameState): GameState {
    if (state.phase !== 'playing') return state;
    return { ...state, phase: 'paused' };
}

/**
 * Resume a paused game
 */
export function resumeGame(state: GameState): GameState {
    if (state.phase !== 'paused') return state;
    return { ...state, phase: 'playing' };
}

/**
 * Reset game for a new round (keep players, reset board)
 */
export function resetGame(state: GameState): GameState {
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

// ============================================================================
// WIN DETECTION
// ============================================================================

/**
 * Check for winners after a number is called
 * @returns Winner info or null if no winner
 */
export function checkForWinners(state: GameState): { winnerId: string; winningCardId: string } | null {
    const calledNumberValues = state.calledNumbers.map(cn => cn.value);

    for (const player of state.players) {
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
    const updatedPlayers = state.players.map(p => {
        if (p.id === winnerId) {
            return { ...p, score: (p.score || 0) + POINTS.WIN };
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

// ============================================================================
// FLAT CLAIMING
// ============================================================================

/**
 * Count completed rows for a player across all cards
 */
function getCompletedRowCount(player: Player, calledNumbers: number[]): number {
    const calledSet = new Set(calledNumbers);
    let maxRows = 0;

    for (const card of player.cards) {
        let cardRows = 0;
        for (const row of card.grid) {
            const isRowComplete = row.every(
                cell => cell.value === null || calledSet.has(cell.value)
            );
            if (isRowComplete) cardRows++;
        }
        maxRows = Math.max(maxRows, cardRows);
    }

    return maxRows;
}

/**
 * Claim a flat (intermediate prize for completing rows)
 */
export function claimFlat(state: GameState, playerId: string, flatType: number): GameState {
    const player = state.players.find(p => p.id === playerId);
    if (!player || state.phase !== 'playing') return state;

    // Validate player has completed required rows
    const calledNumberValues = state.calledNumbers.map(c => c.value);
    const maxRows = getCompletedRowCount(player, calledNumberValues);

    if (maxRows < flatType) return state;

    // Check if already claimed
    if (player.collectedFlats.includes(flatType)) return state;

    // Calculate points
    const isFirst = flatType === 1 ? !state.flatWinners.flat1 : !state.flatWinners.flat2;
    let points = flatType === 1 ? POINTS.FLAT_1 : POINTS.FLAT_2;
    if (isFirst) {
        points += flatType === 1 ? POINTS.FLAT_1_FIRST_BONUS : POINTS.FLAT_2_FIRST_BONUS;
    }

    // Update player
    const updatedPlayers = state.players.map(p => {
        if (p.id === playerId) {
            return {
                ...p,
                collectedFlats: [...p.collectedFlats, flatType].sort(),
                score: (p.score || 0) + points,
            };
        }
        return p;
    });

    // Update flat winners
    const updatedFlatWinners = { ...state.flatWinners };
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
