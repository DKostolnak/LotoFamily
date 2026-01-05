import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage Screen Wake Lock API
 * Keeps the screen valid and prevents dimming during gameplay.
 * Handles visibility changes (re-acquiring lock when tab becomes active).
 */
export function useWakeLock() {
    const [isLocked, setIsLocked] = useState(false);
    const [scentinel, setSentinel] = useState<WakeLockSentinel | null>(null);

    const requestLock = useCallback(async () => {
        // Feature check
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
            try {
                const lock = await navigator.wakeLock.request('screen');
                setSentinel(lock);
                setIsLocked(true);
                console.log('Wake Lock acquired');

                lock.addEventListener('release', () => {
                    setIsLocked(false);
                    console.log('Wake Lock released');
                });
            } catch (err) {
                console.warn(`${(err as Error).name}, ${(err as Error).message}`);
            }
        } else {
            console.log('Wake Lock API not supported');
        }
    }, []);

    const releaseLock = useCallback(async () => {
        if (scentinel) {
            try {
                await scentinel.release();
                setSentinel(null);
            } catch (err) {
                console.error(err);
            }
        }
    }, [scentinel]);

    // Handle visibility change (locks are released when tab is hidden)
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (scentinel !== null && document.visibilityState === 'visible') {
                await requestLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [scentinel, requestLock]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scentinel) {
                scentinel.release();
            }
        };
    }, [scentinel]);

    return { isLocked, requestLock, releaseLock };
}
