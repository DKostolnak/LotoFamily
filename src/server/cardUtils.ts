import type { LotoCard, LotoCardGrid } from '@/lib/types';

/**
 * Shuffle unmarked cell positions for Crazy Mode
 * Keeps marked cells in place, only shuffles positions of unmarked numbers
 */
export function shuffleCardPositions(card: LotoCard): LotoCard {
    // Collect ALL cells (marked, unmarked, and empty)
    const allCells = card.grid.flat().map(cell => ({ ...cell }));

    // Fisher-Yates shuffle
    for (let i = allCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
    }

    // Reconstruct the 3x9 grid
    const newGrid: LotoCardGrid = [
        allCells.slice(0, 9),
        allCells.slice(9, 18),
        allCells.slice(18, 27)
    ] as LotoCardGrid;

    return { ...card, grid: newGrid };
}
