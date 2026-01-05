'use client';

import React, { useEffect, useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { useToast } from '@/components/ToastProvider';

export function GameStatusListener() {
    const { error, isConnected, clearError, isLoading } = useGame();
    const { showToast } = useToast();
    // Start true to avoid flash on initial load before socket connects
    const [hasInitialConnection, setHasInitialConnection] = useState(false);

    // Track initial connection to avoid showing "Disconnected" immediately on load
    useEffect(() => {
        if (isConnected) {
            setHasInitialConnection(true);
        }
    }, [isConnected]);

    // Handle Errors
    useEffect(() => {
        if (error) {
            showToast(error, 'error');
            // We don't clearError here immediately because the context might auto-clear it,
            // or we want it to persist in state until handled.
            // But since we just pushed a toast, we can clear the simple string state if we want 
            // to avoid re-triggering on re-renders, although dependencies handle that.
            // Let's rely on the Context's auto-clear or manual clear.
        }
    }, [error, showToast]);

    // Show persistent disconnected banner if we lost connection
    if (hasInitialConnection && !isConnected) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: 'var(--color-red)',
                color: 'white',
                padding: '8px',
                textAlign: 'center',
                zIndex: 9999,
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
                ⚠️ Connection Lost - Reconnecting...
            </div>
        );
    }

    // Optional: Global Loading Overlay
    if (isLoading) {
        return (
            <div style={{
                position: 'fixed',
                top: '16px',
                right: '16px',
                zIndex: 9999,
            }}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
        );
    }

    return null;
}
