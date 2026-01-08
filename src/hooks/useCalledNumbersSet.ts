/**
 * useCalledNumbersSet Hook
 * 
 * Performance optimization: Converts called numbers array to a Set
 * for O(1) lookups instead of O(n) array includes.
 * Critical for smooth gameplay with many called numbers.
 */

import { useMemo } from 'react';

/**
 * Memoized Set conversion for O(1) number lookups
 * @param calledNumbers - Array of called number values
 * @returns Memoized Set for fast lookups
 */
export function useCalledNumbersSet(calledNumbers: number[]): Set<number> {
    return useMemo(() => new Set(calledNumbers), [calledNumbers]);
}

export default useCalledNumbersSet;
