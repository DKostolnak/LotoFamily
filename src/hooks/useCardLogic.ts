/**
 * useCardLogic - Game card interaction logic
 * 
 * Separates business logic from UI components for better testability
 * and SRP compliance.
 */

import { useCallback } from 'react';
import { LotoCard } from '@/lib/types';
import { useHapticFeedback } from './useHapticFeedback';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Number of recent calls within which a number can still be marked */
const k_safeWindowSize = 2;

/** Animation duration for mistake feedback */
export const k_mistakeAnimationMs = 800;

/** Threshold for considering a number "missed" */
export const k_missedThreshold = 2;

// ============================================================================
// TYPES
// ============================================================================

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

type ClickRejectionReason = 'empty' | 'already_marked' | 'missed' | 'not_called';

interface ClickResult {
    valid: boolean;
    reason?: ClickRejectionReason;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Custom hook for card game logic
 * Separates business logic from UI components
 */
export function useCardLogic({ calledNumbers, onMarkCell }: UseCardLogicProps) {
    const haptics = useHapticFeedback();

    /**
     * Determines if a number is within the safe marking window
     * (last 2 called numbers can still be marked)
     */
    const isInSafeWindow = useCallback((calledIndex: number): boolean => {
        const callsCount = calledNumbers.length;
        return calledIndex !== -1 && (callsCount - 1 - calledIndex < k_safeWindowSize);
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
    ): ClickResult => {
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
            haptics.notifyError();
            return { valid: false, reason: 'missed' };
        }

        // Number hasn't been called yet
        if (!cellState.isCalled) {
            haptics.notifyError();
            return { valid: false, reason: 'not_called' };
        }

        // Valid click - mark the cell
        haptics.impactMedium();
        onMarkCell(card.id, row, col);
        return { valid: true };
    }, [getCellState, onMarkCell, haptics]);

    return {
        getCellState,
        handleCellClick,
        isInSafeWindow,
    };
}
