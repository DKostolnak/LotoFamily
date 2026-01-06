import { LotoCard, GameState, Player } from '@/lib/types';

/**
 * Game Service - Pure business logic for the Loto game
 * No React dependencies, can be used on client or server
 */

/**
 * Check if a player has a flat (complete row)
 */
export function checkPlayerFlats(player: Player, calledNumbers: number[]): { flat1: boolean; flat2: boolean } {
    let completedRows = 0;

    for (const card of player.cards) {
        for (const row of card.grid) {
            const numbersInRow = row.filter(cell => cell.value !== null);
            const allMarkedAndCalled = numbersInRow.every(
                cell => cell.isMarked && calledNumbers.includes(cell.value!)
            );
            if (allMarkedAndCalled && numbersInRow.length > 0) {
                completedRows++;
            }
        }
    }

    return {
        flat1: completedRows >= 1,
        flat2: completedRows >= 2,
    };
}

/**
 * Check if a card is complete (all numbers marked correctly)
 */
export function isCardComplete(card: LotoCard, calledNumbers: number[]): boolean {
    const cells = card.grid.flat();
    const numberCells = cells.filter(c => c.value !== null);

    return numberCells.every(
        cell => cell.isMarked && calledNumbers.includes(cell.value!)
    );
}

/**
 * Count correctly marked cells on a card
 */
export function countCorrectMarks(card: LotoCard, calledNumbers: number[]): number {
    return card.grid.flat().filter(
        cell => cell.value !== null && cell.isMarked && calledNumbers.includes(cell.value)
    ).length;
}

/**
 * Count missed cells on a card (called but not marked in time)
 */
export function countMissedCells(
    card: LotoCard,
    calledNumbers: number[],
    safeWindowSize: number = 2
): number {
    const callsCount = calledNumbers.length;

    return card.grid.flat().filter(cell => {
        if (cell.value === null || cell.isMarked) return false;
        const calledIndex = calledNumbers.indexOf(cell.value);
        if (calledIndex === -1) return false;
        const isSafe = callsCount - 1 - calledIndex < safeWindowSize;
        return !isSafe;
    }).length;
}

/**
 * Calculate player score based on game state
 */
export function calculatePlayerScore(player: Player, gameState: GameState): number {
    const calledNumbers = gameState.calledNumbers.map(cn => cn.value);
    let score = 0;

    // Points for correctly marked cells
    for (const card of player.cards) {
        score += countCorrectMarks(card, calledNumbers) * 10;
    }

    // Bonus for flats
    if (player.collectedFlats?.includes(1)) score += 50;
    if (player.collectedFlats?.includes(2)) score += 100;

    // First flat bonus
    if (gameState.flatWinners?.flat1 === player.id) score += 25;
    if (gameState.flatWinners?.flat2 === player.id) score += 50;

    return score;
}

/**
 * Get player ranking sorted by score
 */
export function getPlayerRankings(gameState: GameState): Array<{ player: Player; score: number; rank: number }> {
    const scoredPlayers = gameState.players.map(player => ({
        player,
        score: calculatePlayerScore(player, gameState),
        rank: 0,
    }));

    // Sort by score descending
    scoredPlayers.sort((a, b) => b.score - a.score);

    // Assign ranks
    scoredPlayers.forEach((sp, index) => {
        sp.rank = index + 1;
    });

    return scoredPlayers;
}
