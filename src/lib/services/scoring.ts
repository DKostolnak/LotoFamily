import { LotoCard as LotoCardType } from '@/lib/types';

/**
 * Count completed rows in a card (all numbers marked or empty).
 */
export function countCompletedRows(card: LotoCardType): number {
    let completedRows = 0;
    card.grid.forEach(row => {
        if (row.every(cell => cell.value === null || cell.isMarked)) {
            completedRows++;
        }
    });
    return completedRows;
}

/**
 * Determine if a card is fully complete (Bingo).
 */
export function isCardComplete(card: LotoCardType): boolean {
    return card.grid.every(row => row.every(cell => cell.value === null || cell.isMarked));
}

/**
 * Check if player can claim a flat by number of completed rows.
 */
export function canClaimFlat(card: LotoCardType, collectedFlats: number[], minRows: number): boolean {
    const completedRows = countCompletedRows(card);
    return completedRows >= minRows && !collectedFlats.includes(minRows);
}
