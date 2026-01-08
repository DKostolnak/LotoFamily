import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage Screen Wake Lock API
 * Keeps the screen awake ONLY during active gameplay.
 * Releases lock when game is paused or in lobby to save battery.
 */
export function useWakeLock() {
    const [isLocked, setIsLocked] = useState(false);
    const [sentinel, setSentinel] = useState<WakeLockSentinel | null>(null);

    const requestLock = useCallback(async () => {
        // Only request if not already locked
        if (sentinel) return;

        // Feature check
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
            try {
                const lock = await navigator.wakeLock.request('screen');
                setSentinel(lock);
                setIsLocked(true);

                lock.addEventListener('release', () => {
                    setIsLocked(false);
                    setSentinel(null);
                });
            } catch {
                // User denied or low battery - silently ignore
            }
        }
    }, [sentinel]);

    const releaseLock = useCallback(async () => {
        if (sentinel) {
            try {
                await sentinel.release();
                setSentinel(null);
                setIsLocked(false);
            } catch {
                // Silent fail
            }
        }
    }, [sentinel]);

    // Handle visibility change (re-acquire when tab becomes visible)
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (sentinel !== null && document.visibilityState === 'visible') {
                await requestLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [sentinel, requestLock]);

    // Cleanup on unmount - release lock to save battery
    useEffect(() => {
        return () => {
            if (sentinel) {
                sentinel.release();
            }
        };
    }, [sentinel]);

    return { isLocked, requestLock, releaseLock };
}
