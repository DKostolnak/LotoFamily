'use client';

import React, { useEffect, useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { useToast } from '@/components/ToastProvider';

export function GameStatusListener() {
    const { error, isConnected, isLoading } = useGame();
    const { showToast } = useToast();
    const [hasInitialConnection, setHasInitialConnection] = useState(false);

    useEffect(() => {
        if (!isConnected) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            setHasInitialConnection(true);
        });

        return () => cancelAnimationFrame(frame);
    }, [isConnected]);

    // Handle Errors
    useEffect(() => {
        if (error) {
            showToast(error, 'error');
        }
    }, [error, showToast]);

    // Show persistent disconnected banner if we lost connection
    if (hasInitialConnection && !isConnected) {
        return (
            <div
                role="status"
                aria-live="assertive"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--color-red)',
                    color: 'white',
                    padding: '12px',
                    textAlign: 'center',
                    zIndex: 1100,
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 700,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                ⚠️ Connection lost – attempting to reconnect…
            </div>
        );
    }

    // Note: GlobalGameToasts handles its own translations logic below or needs them passed down.
    // Ideally we should use useGame()'s language setting, but GameStatusListener is somewhat global.
    // For now, we will leave hardcoded English logs/toasts here as system messages, 
    // or we can fetch the language from the game state if available.

    return (
        <>
            <GlobalGameToasts />
        </>
    );
}

// ... (Updating GlobalGameToasts to use translations)

export function GlobalGameToasts() {
    const { socket, gameState, playerId } = useGame();
    const { showToast } = useToast();

    // Hack: Get translation dictionary directly here or assume 'en' if not ready
    // Ideally we'd validly hook into the language context
    const t = React.useMemo(() => {
        // Safe fallback
        const lang = gameState?.settings?.language || 'en';
        return require('@/lib/translations').translations[lang];
    }, [gameState?.settings?.language]);

    // ...


    // Helper to get player name
    const getPlayerName = React.useCallback((id: string) => {
        const p = gameState?.players.find(p => p.id === id);
        return p?.name || 'Unknown Player';
    }, [gameState?.players]);

    useEffect(() => {
        if (!socket) return;



        const handleFlatClaim = (pid: string, type: number) => {
            const name = getPlayerName(pid);
            const lineText = type === 1 ? t.claimRow1 : t.claimRow2;
            showToast(`${name}: ${lineText}!`, 'celebration', '🏠');
        };

        const handleWinner = (pid: string, name: string) => {
            if (pid !== playerId) {
                showToast(`${name} ${t.playerWins}`, 'celebration', '🏆');
            }
        };

        const handlePlayerJoined = (player: import('@/lib/types').Player) => {
            if (player.id !== playerId) {
                showToast(`${player.name} ${t.online}`, 'info', '👋');
            }
        };

        const handlePlayerLeft = (departingPlayerId: string) => {
            const name = getPlayerName(departingPlayerId);
            // "A player left the game" or "Name left the game"
            // We can reuse 'leftTheGame' key: 'left the game' / 'opustil hru'
            const label = name === 'Unknown Player' ? t.players : name;
            showToast(`${label} ${t.leftTheGame}`, 'warning', '🚪');
        };

        socket.on('game:flatClaimed', handleFlatClaim);
        socket.on('game:winner', handleWinner);
        socket.on('game:playerJoined', handlePlayerJoined);
        socket.on('game:playerLeft', handlePlayerLeft);

        return () => {
            socket.off('game:flatClaimed', handleFlatClaim);
            socket.off('game:winner', handleWinner);
            socket.off('game:playerJoined', handlePlayerJoined);
            socket.off('game:playerLeft', handlePlayerLeft);
        };
    }, [socket, getPlayerName, playerId, showToast, t]);

    return null;
}
