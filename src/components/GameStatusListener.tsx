/**
 * GameStatusListener - Displays connection status and game event toasts
 *
 * Features:
 * - Shows disconnect banner when connection lost
 * - Listens for game events (flat claims, winners, player join/leave)
 * - Shows appropriate toasts for each event
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/components/ToastProvider';
import { translations } from '@/lib/translations';
import type { Player } from '@/lib/types';

// ============================================================================
// TYPES
// ============================================================================

interface GameStatusListenerProps {
    /** Socket instance for event listening */
    socket: any | null;
    /** Current game state */
    gameState: {
        players: Player[];
        settings: {
            language: 'en' | 'sk';
        };
    } | null;
    /** Current player ID */
    playerId: string | null;
    /** Whether connected to server */
    isConnected: boolean;
    /** Any error message */
    error: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

function GameStatusListener({
    socket,
    gameState,
    playerId,
    isConnected,
    error,
}: GameStatusListenerProps) {
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();
    const [hasInitialConnection, setHasInitialConnection] = useState(false);

    // Animation for disconnect banner
    const bannerTranslateY = useSharedValue(-100);

    // Get translations
    const t = useMemo(() => {
        const lang = gameState?.settings?.language || 'en';
        return translations[lang];
    }, [gameState?.settings?.language]);

    // Track initial connection
    useEffect(() => {
        if (isConnected && !hasInitialConnection) {
            setHasInitialConnection(true);
        }
    }, [isConnected, hasInitialConnection]);

    // Animate disconnect banner
    useEffect(() => {
        if (hasInitialConnection && !isConnected) {
            bannerTranslateY.value = withSpring(0, { damping: 15 });
        } else {
            bannerTranslateY.value = withTiming(-100, { duration: 200 });
        }
    }, [hasInitialConnection, isConnected, bannerTranslateY]);

    // Handle errors
    useEffect(() => {
        if (error) {
            showToast(error, 'error');
        }
    }, [error, showToast]);

    // Helper to get player name
    const getPlayerName = useCallback((id: string): string => {
        const player = gameState?.players.find(p => p.id === id);
        return player?.name || 'Unknown';
    }, [gameState?.players]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const handleFlatClaim = (pid: string, type: number) => {
            const name = getPlayerName(pid);
            const lineText = type === 1 ? (t.claimRow1 || 'First line') : (t.claimRow2 || 'Second line');
            showToast(`${name}: ${lineText}!`, 'celebration', '🏠');
        };

        const handleWinner = (pid: string, name: string) => {
            if (pid !== playerId) {
                showToast(`${name} ${t.playerWins || 'wins!'}`, 'celebration', '🏆');
            }
        };

        const handlePlayerJoined = (player: Player) => {
            if (player.id !== playerId) {
                showToast(`${player.name} ${t.online || 'joined'}`, 'info', '👋');
            }
        };

        const handlePlayerLeft = (departingPlayerId: string) => {
            const name = getPlayerName(departingPlayerId);
            showToast(`${name} ${t.leftTheGame || 'left'}`, 'warning', '🚪');
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

    const bannerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: bannerTranslateY.value }],
    }));

    // Only render disconnect banner when needed
    if (!hasInitialConnection || isConnected) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.disconnectBanner,
                { paddingTop: insets.top + 12 },
                bannerStyle,
            ]}
        >
            <Text style={styles.disconnectText}>
                ⚠️ Connection lost – reconnecting…
            </Text>
        </Animated.View>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    disconnectBanner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#e53935',
        paddingBottom: 12,
        paddingHorizontal: 16,
        zIndex: 1100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 8,
    },
    disconnectText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
});

export default GameStatusListener;
