/**
 * Game Modes - Pluggable win condition system
 * 
 * Each game mode defines how to check for a win condition.
 * Modes are pure functions with no side effects.
 */

import type { LotoCard, GameModeType } from '@/lib/types';

export interface GameModeConfig {
    type: GameModeType;
    name: string;
    description: string;
    checkWin: (card: LotoCard, calledNumbers: number[]) => boolean;
}

/**
 * Classic Mode - Full card must be marked
 */
const classicMode: GameModeConfig = {
    type: 'classic',
    name: 'Classic',
    description: 'Mark all numbers on your card to win',
    checkWin: (card: LotoCard, calledNumbers: number[]): boolean => {
        const calledSet = new Set(calledNumbers);

        for (const row of card.grid) {
            for (const cell of row) {
                if (cell.value !== null && !calledSet.has(cell.value)) {
                    return false;
                }
            }
        }
        return true;
    },
};

/**
 * Row Mode - Complete any single row to win
 */
const rowMode: GameModeConfig = {
    type: 'row',
    name: 'Single Row',
    description: 'Complete any row to win',
    checkWin: (card: LotoCard, calledNumbers: number[]): boolean => {
        const calledSet = new Set(calledNumbers);

        for (const row of card.grid) {
            let isRowComplete = true;
            for (const cell of row) {
                if (cell.value !== null && !calledSet.has(cell.value)) {
                    isRowComplete = false;
                    break;
                }
            }
            if (isRowComplete) return true;
        }
        return false;
    },
};

/**
 * Pattern Mode - Specific patterns (corners, diagonals, etc.)
 * This is a placeholder for future expansion
 */
const patternMode: GameModeConfig = {
    type: 'pattern',
    name: 'Pattern',
    description: 'Complete a specific pattern to win',
    checkWin: (card: LotoCard, calledNumbers: number[]): boolean => {
        // For now, check corners (first and last cell of each row if they have numbers)
        const calledSet = new Set(calledNumbers);
        const corners = [
            card.grid[0][0],
            card.grid[0][8],
            card.grid[2][0],
            card.grid[2][8],
        ];

        // Count corners that have numbers and are called
        let cornersWithNumbers = 0;
        let cornersMarked = 0;

        for (const cell of corners) {
            if (cell.value !== null) {
                cornersWithNumbers++;
                if (calledSet.has(cell.value)) {
                    cornersMarked++;
                }
            }
        }

        // Win if all corners with numbers are marked (need at least 2)
        return cornersWithNumbers >= 2 && cornersWithNumbers === cornersMarked;
    },
};

/**
 * Speed Mode - Same as classic but typically with faster auto-call
 */
const speedMode: GameModeConfig = {
    type: 'speed',
    name: 'Speed Loto',
    description: 'Race to complete your card with faster number calls',
    checkWin: classicMode.checkWin, // Same win condition as classic
};

/**
 * All available game modes
 */
export const gameModes: Record<GameModeType, GameModeConfig> = {
    classic: classicMode,
    row: rowMode,
    pattern: patternMode,
    speed: speedMode,
};

/**
 * Get a game mode by type
 */
export function getGameMode(type: GameModeType): GameModeConfig {
    return gameModes[type];
}

/**
 * Check if a player has won with any of their cards
 * @returns The winning card or null if no win
 */
export function checkPlayerWin(
    cards: LotoCard[],
    calledNumbers: number[],
    modeType: GameModeType
): LotoCard | null {
    const mode = getGameMode(modeType);

    for (const card of cards) {
        if (mode.checkWin(card, calledNumbers)) {
            return card;
        }
    }

    return null;
}
