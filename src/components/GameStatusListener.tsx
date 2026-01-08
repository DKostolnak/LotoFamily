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

    // Optional: Global Loading Overlay
    if (isLoading) {
        return (
            <div
                role="status"
                aria-live="polite"
                style={{
                    position: 'fixed',
                    top: '16px',
                    right: '16px',
                    zIndex: 1100,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--color-wood-medium)',
                    color: 'var(--color-text-light)'
                }}
            >
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" aria-hidden="true" />
                <span>Loading…</span>
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

        const handlePlayerLeft = (departingPlayerId: string) => {
            const name = getPlayerName(departingPlayerId);
            const label = name === 'Unknown Player' ? 'A player' : name;
            showToast(`${label} left the game`, 'warning', '🚪');
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
