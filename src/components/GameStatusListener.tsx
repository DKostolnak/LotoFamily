/**
 * GameStatusListener - Displays connection status and game event toasts
 *
 * Podporuje dva módy:
 *   1. Legacy Socket.io — cez `socket` prop
 *   2. Supabase Realtime — cez `onGameEvent` prop (keď socket=null)
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { TEXT_STYLES, SPACING } from '@/lib/config';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/components/ToastProvider';
import { translations } from '@/lib/i18n';
import type { Player } from '@/lib/types';

// ============================================================================
// TYPES
// ============================================================================

interface GameStatusListenerProps {
    socket: any | null;
    /**
     * Supabase Realtime event subscription (používa sa keď socket=null).
     * Vracia unsubscribe funkciu.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onGameEvent?: (event: any, cb: (payload: unknown) => void) => () => void;
    gameState: {
        players: Player[];
        settings: { language: string };
    } | null;
    playerId: string | null;
    isConnected: boolean;
    error: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

function GameStatusListener({
    socket,
    onGameEvent,
    gameState,
    playerId,
    isConnected,
    error,
}: GameStatusListenerProps) {
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();
    const [hasInitialConnection, setHasInitialConnection] = useState(false);
    const bannerTranslateY = useSharedValue(-100);

    const t = useMemo(() => {
        const lang = (gameState?.settings?.language || 'en') as keyof typeof translations;
        return translations[lang];
    }, [gameState?.settings?.language]);

    const getPlayerName = useCallback((id: string): string => {
        return gameState?.players.find(p => p.id === id)?.name ?? 'Unknown';
    }, [gameState?.players]);

    useEffect(() => {
        if (isConnected && !hasInitialConnection) setHasInitialConnection(true);
    }, [isConnected, hasInitialConnection]);

    useEffect(() => {
        if (hasInitialConnection && !isConnected) {
            bannerTranslateY.value = withSpring(0, { damping: 15 });
        } else {
            bannerTranslateY.value = withTiming(-100, { duration: 200 });
        }
    }, [hasInitialConnection, isConnected, bannerTranslateY]);

    useEffect(() => {
        if (error) showToast(error, 'error');
    }, [error, showToast]);

    // ---- Socket.io listeners (legacy) ----
    useEffect(() => {
        if (!socket) return;

        const handleFlatClaim = (pid: string, type: number) => {
            const name = getPlayerName(pid);
            const lineText = type === 1 ? (t.claimRow1 || 'First line') : (t.claimRow2 || 'Second line');
            showToast(`${name}: ${lineText}!`, 'celebration', '🏠');
        };
        const handleWinner = (pid: string, name: string) => {
            if (pid !== playerId) showToast(`${name} ${t.playerWins || 'wins!'}`, 'celebration', '🏆');
        };
        const handlePlayerJoined = (player: Player) => {
            if (player.id !== playerId) showToast(`${player.name} ${t.online || 'joined'}`, 'info', '👋');
        };
        const handlePlayerLeft = (departingPlayerId: string) => {
            showToast(`${getPlayerName(departingPlayerId)} ${t.leftTheGame || 'left'}`, 'warning', '🚪');
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

    // ---- Supabase Realtime listeners ----
    useEffect(() => {
        if (!onGameEvent || socket) return; // socket má prednosť ak existuje

        const unsubWinner = onGameEvent('game:winner', (payload: unknown) => {
            const { playerId: pid, playerName: name } = payload as { playerId: string; playerName: string };
            if (pid !== playerId) showToast(`${name} ${t.playerWins || 'wins!'}`, 'celebration', '🏆');
        });

        const unsubJoined = onGameEvent('game:playerJoined', (payload: unknown) => {
            const player = payload as Player;
            if (player.id !== playerId) showToast(`${player.name} ${t.online || 'joined'}`, 'info', '👋');
        });

        const unsubLeft = onGameEvent('game:playerLeft', (payload: unknown) => {
            const { playerId: pid } = payload as { playerId: string };
            showToast(`${getPlayerName(pid)} ${t.leftTheGame || 'left'}`, 'warning', '🚪');
        });

        return () => {
            unsubWinner();
            unsubJoined();
            unsubLeft();
        };
    }, [onGameEvent, socket, playerId, showToast, t, getPlayerName]);

    const bannerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: bannerTranslateY.value }],
    }));

    if (!hasInitialConnection || isConnected) return null;

    return (
        <Animated.View
            style={[
                styles.disconnectBanner,
                { paddingTop: insets.top + SPACING.md },
                bannerStyle,
            ]}
        >
            <Text style={[TEXT_STYLES.bodyBold, styles.disconnectText]}>
                ⚠️ {t.connectionError ?? 'Connection lost – reconnecting…'}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    disconnectBanner: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        backgroundColor: '#e53935',
        paddingBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
        zIndex: 1100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 8,
    },
    disconnectText: {
        color: 'white',
        textAlign: 'center',
    },
});

export default GameStatusListener;
