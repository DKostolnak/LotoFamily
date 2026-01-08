'use client';

/**
 * useGameSocket Hook
 * 
 * Manages Socket.io connection lifecycle and event handling.
 * Extracted from GameContext for better separation of concerns.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, GameState } from '@/lib/types';
import {
    ensurePlayerToken,
    getPlayerName,
    getLastRoomCode,
    getPlayerAvatar,
    setLastRoomCode,
    clearLastRoomCode,
} from '@/lib/services/storage';

// ============================================================================
// TYPES
// ============================================================================

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface UseGameSocketOptions {
    /** Server URL for socket connection */
    serverUrl?: string;
    /** Callback when game state updates */
    onGameStateUpdate?: (state: GameState) => void;
    /** Callback when an error occurs */
    onError?: (message: string) => void;
    /** Callback when kicked from room */
    onKicked?: () => void;
    /** Callback when room is closed */
    onRoomClosed?: () => void;
}

export interface UseGameSocketReturn {
    /** The socket instance (null before connection) */
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    /** Current connection status */
    connectionStatus: ConnectionStatus;
    /** Current player's socket ID */
    playerId: string | null;
    /** Whether socket is connected and ready */
    isConnected: boolean;
    /** Whether currently attempting to reconnect */
    isReconnecting: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useGameSocket({
    serverUrl = '',
    onGameStateUpdate,
    onError,
    onKicked,
    onRoomClosed,
}: UseGameSocketOptions = {}): UseGameSocketReturn {
    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [playerId, setPlayerId] = useState<string | null>(null);
    const pendingReconnectRef = useRef(false);
    const tokenRef = useRef<string | null>(null);

    // Initialize socket connection
    useEffect(() => {
        // Ensure we have a player token
        tokenRef.current = ensurePlayerToken();

        // Create socket instance
        const client: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
            autoConnect: false,
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        setSocket(client);
        setConnectionStatus('connecting');
        client.connect();

        // Connection established
        client.on('connect', () => {
            setConnectionStatus(pendingReconnectRef.current ? 'reconnecting' : 'connected');
            setPlayerId(client.id ?? null);
            pendingReconnectRef.current = false;

            // Attempt auto-reconnect to last room
            const lastRoom = getLastRoomCode();
            const lastName = getPlayerName();
            const avatar = getPlayerAvatar();

            if (lastRoom && lastName && tokenRef.current) {
                client.emit('room:join', lastRoom, lastName, avatar, tokenRef.current);
            }
        });

        // Connection lost
        client.on('disconnect', () => {
            setConnectionStatus('disconnected');
            pendingReconnectRef.current = true;
        });

        // Connection error
        client.on('connect_error', () => {
            onError?.('Connection failed. Retrying...');
        });

        // Game state update
        client.on('game:state', (state) => {
            onGameStateUpdate?.(state);
            if (state.roomCode) {
                setLastRoomCode(state.roomCode);
            }
        });

        // Game error
        client.on('game:error', (message) => {
            onError?.(message);
            if (message === 'Room not found') {
                clearLastRoomCode();
            }
        });

        // Room joined
        client.on('room:joined', (state) => {
            onGameStateUpdate?.(state);
            if (state.roomCode) {
                setLastRoomCode(state.roomCode);
            }
        });

        // Room created
        client.on('room:created', (code) => {
            setLastRoomCode(code);
        });

        // Kicked from room
        client.on('room:kicked', () => {
            clearLastRoomCode();
            onKicked?.();
        });

        // Room closed by host
        client.on('room:closed', () => {
            clearLastRoomCode();
            onRoomClosed?.();
        });

        // Cleanup on unmount
        return () => {
            client.disconnect();
        };
    }, [serverUrl, onGameStateUpdate, onError, onKicked, onRoomClosed]);

    // Derive connection booleans
    const isConnected = connectionStatus === 'connected' || connectionStatus === 'reconnecting';
    const isReconnecting = connectionStatus === 'reconnecting';

    return {
        socket,
        connectionStatus,
        playerId,
        isConnected,
        isReconnecting,
    };
}

// ============================================================================
// SOCKET ACTION HELPERS
// ============================================================================

/**
 * Creates game action functions bound to a socket instance.
 * This provides a cleaner API than passing socket everywhere.
 */
export function createGameActions(socket: Socket<ServerToClientEvents, ClientToServerEvents> | null) {
    const emit = <K extends keyof ClientToServerEvents>(
        event: K,
        ...args: Parameters<ClientToServerEvents[K]>
    ) => {
        if (!socket) return false;
        socket.emit(event, ...args);
        return true;
    };

    return {
        createRoom: (name: string, avatar: string, settings: Parameters<ClientToServerEvents['room:create']>[2], token: string) => {
            emit('room:create', name, avatar, settings, token);
        },
        joinRoom: (roomCode: string, name: string, avatar: string, token?: string) => {
            emit('room:join', roomCode, name, avatar, token);
        },
        leaveRoom: () => emit('room:leave'),
        startGame: (options?: Parameters<ClientToServerEvents['game:start']>[0]) => emit('game:start', options),
        callNumber: () => emit('game:callNumber'),
        markCell: (cardId: string, row: number, col: number) => emit('game:markCell', cardId, row, col),
        claimWin: (cardId: string) => emit('game:claimWin', cardId),
        claimFlat: (flatType: number) => emit('game:claimFlat', flatType),
        pauseGame: () => emit('game:pause'),
        resumeGame: () => emit('game:resume'),
        restartGame: () => emit('game:restart'),
        updateProfile: (name: string, avatar: string) => emit('room:updateProfile', name, avatar),
        kickPlayer: (playerId: string) => emit('room:kickPlayer', playerId),
        closeRoom: () => emit('room:close'),
    };
}

export default useGameSocket;
