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

    return (
        <>
            <GlobalGameToasts />
        </>
    );
}

// Separate component to handle socket events to avoid re-rendering issues in the listener
export function GlobalGameToasts() {
    const { socket, gameState, playerId } = useGame();
    const { showToast } = useToast();

    // Helper to get player name
    const getPlayerName = React.useCallback((id: string) => {
        const p = gameState?.players.find(p => p.id === id);
        return p?.name || 'Unknown Player';
    }, [gameState?.players]);

    useEffect(() => {
        if (!socket) return;

        const handleSabotage = (attackerId: string, targetId: string, type: import('@/lib/types').SabotageType) => {
            const attackerName = getPlayerName(attackerId);
            const targetName = getPlayerName(targetId);
            const isMe = targetId === playerId;
            const didIDoIt = attackerId === playerId;

            let message = '';
            let icon = '';

            if (type === 'snowball') {
                message = `${attackerName} threw a SNOWBALL at ${isMe ? 'YOU' : targetName}!`;
                icon = '❄️';
            } else if (type === 'ink_splat') {
                message = `${attackerName} Splashed INK on ${isMe ? 'YOU' : targetName}!`;
                icon = '🐙';
            } else if (type === 'swap_hand') {
                message = `${attackerName} SHUFFLED ${isMe ? 'YOUR' : targetName + "'s"} cards!`;
                icon = '🌀';
            }

            // Don't show generic toast if I am the victim, I get a big error message already
            // Actually, showing both is fine for consistency, but maybe styled differently.
            // Let's show it as "info" or customized.
            showToast(message, 'info', icon);
        };

        const handleFlatClaim = (pid: string, type: number) => {
            const name = getPlayerName(pid);
            showToast(`${name} claimed the ${type}-Room Flat!`, 'celebration', '🏠');
        };

        const handleWinner = (pid: string, name: string) => {
            // Winner screen handles the big celebration, but a toast is good for history/confirmation
            if (pid !== playerId) {
                showToast(`${name} WON THE GAME!`, 'celebration', '🏆');
            }
        };

        const handlePlayerJoined = (player: import('@/lib/types').Player) => {
            if (player.id !== playerId) {
                showToast(`${player.name} joined the game`, 'info', '👋');
            }
        };

        const handlePlayerLeft = (pid: string) => {
            // We'd need to look up name before they leave, or just say "A player left"
            // gameState might already be updated so find might fail.
            // Ideally we pass name from server. For now generic.
            showToast(`Player left the game`, 'warning', '🚪');
        };

        socket.on('game:sabotageEffect', handleSabotage);
        socket.on('game:flatClaimed', handleFlatClaim);
        socket.on('game:winner', handleWinner);
        socket.on('game:playerJoined', handlePlayerJoined);
        socket.on('game:playerLeft', handlePlayerLeft);

        return () => {
            socket.off('game:sabotageEffect', handleSabotage);
            socket.off('game:flatClaimed', handleFlatClaim);
            socket.off('game:winner', handleWinner);
            socket.off('game:playerJoined', handlePlayerJoined);
            socket.off('game:playerLeft', handlePlayerLeft);
        };
    }, [socket, getPlayerName, playerId, showToast]);

    return null;
}
