/**
 * Loto Card Generator
 * Generates valid European Loto 90 cards
 * 
 * Rules:
 * - Card is 9 columns x 3 rows
 * - Each row has exactly 5 numbers and 4 blank cells
 * - Column 1: numbers 1-9
 * - Column 2: numbers 10-19
 * - Columns 3-8: 10 numbers each (20-29, 30-39, etc.)
 * - Column 9: numbers 80-90 (11 numbers)
 * - Each column can have 0, 1, 2, or 3 numbers
 * - Numbers in each column are sorted ascending top to bottom
 */

import type { LotoCard, LotoCardGrid } from '@/lib/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const k_rows = 3;
const k_columns = 9;
const k_numbersPerRow = 5;

/**
 * Generate a unique ID for cards
 */
function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

/**
 * Get the valid number range for a column (0-indexed)
 */
function getColumnRange(column: number): [number, number] {
    if (column === 0) return [1, 9];
    if (column === 8) return [80, 90];
    return [column * 10, column * 10 + 9];
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Generate a valid Loto card
 */
export function generateLotoCard(playerId: string): LotoCard {
    const grid: LotoCardGrid = Array.from({ length: k_rows }, () =>
        Array.from({ length: k_columns }, () => ({ value: null, isMarked: false }))
    );

    // For each column, decide how many numbers (0-3) and which rows
    const columnCounts: number[] = [];
    let totalNumbers = 0;

    // We need exactly 15 numbers (5 per row × 3 rows)
    // Distribute numbers across columns
    for (let col = 0; col < k_columns; col++) {
        // Each column gets 1-3 numbers, aiming for ~15 total
        const count = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
        columnCounts.push(count);
        totalNumbers += count;
    }

    // Adjust to exactly 15 numbers
    while (totalNumbers !== 15) {
        const col = Math.floor(Math.random() * 9);
        if (totalNumbers > 15 && columnCounts[col] > 1) {
            columnCounts[col]--;
            totalNumbers--;
        } else if (totalNumbers < 15 && columnCounts[col] < 3) {
            columnCounts[col]++;
            totalNumbers++;
        }
    }

    // Track numbers per row (each row needs exactly 5)
    const rowCounts = Array(k_rows).fill(0);

    // For each column, place numbers
    for (let col = 0; col < k_columns; col++) {
        const count = columnCounts[col];
        if (count === 0) continue;

        const [min, max] = getColumnRange(col);
        const possibleNumbers: number[] = [];
        for (let n = min; n <= max; n++) {
            possibleNumbers.push(n);
        }

        // Pick random numbers for this column
        const selectedNumbers = shuffle(possibleNumbers).slice(0, count).sort((a, b) => a - b);

        // Find which rows can accept numbers (need to reach 5 per row)
        const availableRows = Array.from({ length: k_rows }, (_, row) => row).filter(row => rowCounts[row] < k_numbersPerRow);

        // Only place as many numbers as we have available rows
        const numbersToPlace = Math.min(count, availableRows.length);
        if (numbersToPlace === 0) continue;

        const selectedRows = shuffle(availableRows).slice(0, numbersToPlace).sort((a, b) => a - b);

        // Place numbers (sorted numbers go to sorted rows)
        for (let i = 0; i < numbersToPlace; i++) {
            grid[selectedRows[i]][col] = { value: selectedNumbers[i], isMarked: false };
            rowCounts[selectedRows[i]]++;
        }
    }

    // Verify each row has exactly 5 numbers
    for (let row = 0; row < k_rows; row++) {
        const count = grid[row].filter(cell => cell.value !== null).length;
        if (count !== k_numbersPerRow) {
            // If validation fails, regenerate (rare edge case)
            return generateLotoCard(playerId);
        }
    }

    return {
        id: generateId(),
        grid,
        playerId,
    };
}

/**
 * Generate multiple unique cards for a player
 */
export function generateCards(playerId: string, count: number): LotoCard[] {
    const cards: LotoCard[] = [];
    for (let i = 0; i < count; i++) {
        cards.push(generateLotoCard(playerId));
    }
    return cards;
}

/**
 * Mark a cell on a card (toggles marked state)
 */
export function markCell(card: LotoCard, row: number, col: number): LotoCard {
    const newGrid = card.grid.map((r, ri) =>
        r.map((cell, ci) => {
            if (ri === row && ci === col && cell.value !== null) {
                return { ...cell, isMarked: !cell.isMarked };
            }
            return cell;
        })
    );

    return { ...card, grid: newGrid };
}

/**
 * Check if a number exists on a card
 * @returns Position of the number or null if not found
 */
export function hasNumber(card: LotoCard, number: number): { row: number; col: number } | null {
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 9; col++) {
            if (card.grid[row][col].value === number) {
                return { row, col };
            }
        }
    }
    return null;
}

/**
 * Get all numbers on a card
 */
export function getCardNumbers(card: LotoCard): number[] {
    const numbers: number[] = [];
    for (const row of card.grid) {
        for (const cell of row) {
            if (cell.value !== null) {
                numbers.push(cell.value);
            }
        }
    }
    return numbers;
}
