import { useCallback } from 'react';
import { LotoCard } from '@/lib/types';
import { playCellMarkSound } from '@/components/GameAudioPlayer';

interface UseCardLogicProps {
    calledNumbers: number[];
    onMarkCell: (cardId: string, row: number, col: number) => void;
}

interface CellState {
    isEmpty: boolean;
    isMarked: boolean;
    isCalled: boolean;
    isSafe: boolean;
    isMissed: boolean;
    isCorrect: boolean;
}

/**
 * Custom hook for card game logic
 * Separates business logic from UI components
 */
export function useCardLogic({ calledNumbers, onMarkCell }: UseCardLogicProps) {

    /**
     * Determines if a number is within the safe marking window
     * (last 2 called numbers can still be marked)
     */
    const isInSafeWindow = useCallback((calledIndex: number): boolean => {
        const callsCount = calledNumbers.length;
        return calledIndex !== -1 && (callsCount - 1 - calledIndex < 2);
    }, [calledNumbers]);

    /**
     * Get the state of a specific cell
     */
    const getCellState = useCallback((cell: { value: number | null; isMarked: boolean }): CellState => {
        const isEmpty = cell.value === null;
        const isMarked = cell.isMarked;
        const calledIndex = cell.value !== null ? calledNumbers.indexOf(cell.value) : -1;
        const isCalled = calledIndex !== -1;
        const isSafe = isInSafeWindow(calledIndex);
        const isMissed = isCalled && !isMarked && !isSafe;
        const isCorrect = isCalled && isMarked;

        return { isEmpty, isMarked, isCalled, isSafe, isMissed, isCorrect };
    }, [calledNumbers, isInSafeWindow]);

    /**
     * Handle cell click with validation
     * Returns true if the click was valid, false if rejected
     */
    const handleCellClick = useCallback((
        card: LotoCard,
        row: number,
        col: number
    ): { valid: boolean; reason?: 'empty' | 'already_marked' | 'missed' | 'not_called' } => {
        const cell = card.grid[row][col];

        // Empty cells are never clickable
        if (cell.value === null) {
            return { valid: false, reason: 'empty' };
        }

        const cellState = getCellState(cell);

        // Already correctly marked
        if (cellState.isCorrect) {
            return { valid: false, reason: 'already_marked' };
        }

        // Missed number (too late)
        if (cellState.isMissed) {
            return { valid: false, reason: 'missed' };
        }

        // Number hasn't been called yet
        if (!cellState.isCalled) {
            return { valid: false, reason: 'not_called' };
        }

        // Valid click - mark the cell
        playCellMarkSound();
        onMarkCell(card.id, row, col);
        return { valid: true };
    }, [getCellState, onMarkCell]);

    /**
     * Calculate card progress (for progress bar)
     */
    const getCardProgress = useCallback((card: LotoCard): { total: number; marked: number; remaining: number; percentage: number } => {
        const cells = card.grid.flat();
        const total = cells.filter(c => c.value !== null).length;
        const marked = cells.filter(c =>
            c.value !== null &&
            c.isMarked &&
            calledNumbers.includes(c.value)
        ).length;
        const remaining = total - marked;
        const percentage = total > 0 ? (marked / total) * 100 : 0;

        return { total, marked, remaining, percentage };
    }, [calledNumbers]);

    return {
        getCellState,
        handleCellClick,
        getCardProgress,
        isInSafeWindow,
    };
}
