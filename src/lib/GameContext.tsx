'use client';

/**
 * GameContext
 * 
 * Central state management for the Loto game.
 * Provides socket connection, game state, and action methods to all components.
 * 
 * Uses:
 * - useReducer for client state (connection, player info, errors)
 * - Socket.io for real-time communication with server
 * - Storage service for persistence (tokens, preferences)
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import type { GameSettings, GameState, ServerToClientEvents, ClientToServerEvents } from './types';
import { gameClientReducer, initialGameClientState, DEFAULT_AVATARS } from './state/gameReducer';
import {
    ensurePlayerToken,
    getPlayerAvatar,
    getPlayerName,
    getLastRoomCode,
    setPlayerAvatar as saveAvatar,
    setPlayerName as saveName,
    setLastRoomCode,
    clearLastRoomCode,
    STORAGE_KEYS,
    storageService,
} from './services/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface GameContextType {
    /** Socket instance for direct access if needed */
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    /** Current player's socket ID */
    playerId: string | null;
    /** Current player's display name */
    playerName: string | null;
    /** Current player's avatar emoji */
    playerAvatar: string;
    /** Current game state (null when not in a room) */
    gameState: GameState | null;
    /** Whether socket is connected */
    isConnected: boolean;
    /** Whether a network operation is in progress */
    isLoading: boolean;
    /** Whether current player is the host */
    isHost: boolean;
    /** Current error message (null if none) */
    error: string | null;

    // Actions
    clearError: () => void;
    createRoom: (playerName: string, settings?: Partial<GameSettings>) => void;
    joinRoom: (roomCode: string, playerName: string) => void;
    leaveRoom: () => void;
    startGame: (options?: { autoCallIntervalMs: number }) => void;
    callNextNumber: () => void;
    markCell: (cardId: string, row: number, col: number) => void;
    claimWin: (cardId: string) => void;
    claimFlat: (flatType: number) => void;
    pauseGame: () => void;
    resumeGame: () => void;
    restartGame: () => void;
    updateProfile: (name: string, avatarUrl: string) => void;
    kickPlayer: (playerId: string) => void;
    setPlayerAvatar: (avatar: string) => void;
    closeRoom: () => void;
    addDebugPlayers: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const GameContext = createContext<GameContextType | null>(null);

/**
 * Hook to access game context.
 * Must be used within a GameProvider.
 */
export function useGame(): GameContextType {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}

// ============================================================================
// PROVIDER PROPS
// ============================================================================

interface GameProviderProps {
    children: ReactNode;
    /** Optional custom server URL (defaults to current origin) */
    serverUrl?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** How long to show error messages before auto-dismiss */
const ERROR_AUTO_DISMISS_MS = 5000;

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function GameProvider({ children, serverUrl = '' }: GameProviderProps) {
    // State management
    const [clientState, dispatch] = useReducer(gameClientReducer, initialGameClientState);
    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Refs for values that shouldn't trigger re-renders
    const tokenRef = useRef<string | null>(null);
    const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pendingReconnectRef = useRef(false);

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    // Load saved player data on mount
    useEffect(() => {
        tokenRef.current = ensurePlayerToken();

        const savedAvatar = getPlayerAvatar();
        dispatch({ type: 'setPlayerAvatar', playerAvatar: savedAvatar });

        const savedName = getPlayerName();
        if (savedName) {
            dispatch({ type: 'setPlayerName', playerName: savedName });
        }

        const savedRoom = getLastRoomCode();
        if (savedRoom) {
            dispatch({ type: 'setLastRoomCode', roomCode: savedRoom });
        }
    }, []);

    // ========================================================================
    // SOCKET CONNECTION
    // ========================================================================

    useEffect(() => {
        const client: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
            autoConnect: false,
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        setSocket(client);
        dispatch({ type: 'setConnectionStatus', status: 'connecting' });
        client.connect();

        // Connection established
        client.on('connect', () => {
            const status = pendingReconnectRef.current ? 'reconnecting' : 'connected';
            dispatch({ type: 'setConnectionStatus', status });
            dispatch({ type: 'setPlayerId', playerId: client.id ?? null });
            dispatch({ type: 'setError', error: null });
            setIsLoading(false);
            pendingReconnectRef.current = false;

            // Auto-reconnect to last room
            const lastRoom = getLastRoomCode();
            const lastName = getPlayerName();
            const avatar = getPlayerAvatar();

            if (lastRoom && lastName && tokenRef.current) {
                client.emit('room:join', lastRoom, lastName, avatar, tokenRef.current);
                setIsLoading(true);
            }
        });

        // Connection lost
        client.on('disconnect', () => {
            dispatch({ type: 'setConnectionStatus', status: 'disconnected' });
            dispatch({ type: 'setWasDisconnected', wasDisconnected: true });
            pendingReconnectRef.current = true;
        });

        // Connection error
        client.on('connect_error', () => {
            dispatch({ type: 'setError', error: 'Connection failed. Retrying...' });
            setIsLoading(false);
        });

        // Game state update
        client.on('game:state', (state) => {
            dispatch({ type: 'setGameState', gameState: state });
            setIsLoading(false);
            if (state.roomCode) {
                setLastRoomCode(state.roomCode);
            }
        });

        // Game error
        client.on('game:error', (message) => {
            dispatch({ type: 'setError', error: message });
            setIsLoading(false);
            if (message === 'Room not found') {
                clearLastRoomCode();
            }
        });

        // Room joined
        client.on('room:joined', (state) => {
            dispatch({ type: 'setGameState', gameState: state });
            setIsLoading(false);
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
            dispatch({ type: 'setGameState', gameState: null });
            clearLastRoomCode();
            dispatch({ type: 'setError', error: 'You have been removed from the room.' });
        });

        // Room closed
        client.on('room:closed', () => {
            dispatch({ type: 'setGameState', gameState: null });
            clearLastRoomCode();
            dispatch({ type: 'setError', error: 'The host closed the room.' });
        });

        return () => {
            client.disconnect();
        };
    }, [serverUrl]);

    // ========================================================================
    // ERROR AUTO-DISMISS
    // ========================================================================

    // Scroll to top on error
    useEffect(() => {
        if (clientState.error && typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [clientState.error]);

    // Auto-dismiss errors after timeout
    useEffect(() => {
        if (!clientState.error) return;

        if (errorTimerRef.current) {
            clearTimeout(errorTimerRef.current);
        }

        errorTimerRef.current = setTimeout(() => {
            dispatch({ type: 'setError', error: null });
        }, ERROR_AUTO_DISMISS_MS);

        return () => {
            if (errorTimerRef.current) {
                clearTimeout(errorTimerRef.current);
            }
        };
    }, [clientState.error]);

    // ========================================================================
    // DERIVED STATE
    // ========================================================================

    const isHost = useMemo(
        () => !!clientState.gameState && clientState.gameState.hostId === clientState.playerId,
        [clientState.gameState, clientState.playerId],
    );

    const isConnected = useMemo(
        () => clientState.connectionStatus === 'connected' || clientState.connectionStatus === 'reconnecting',
        [clientState.connectionStatus],
    );

    // ========================================================================
    // ACTIONS
    // ========================================================================

    const persistProfile = useCallback((name: string, avatar: string) => {
        dispatch({ type: 'setPlayerName', playerName: name });
        dispatch({ type: 'setPlayerAvatar', playerAvatar: avatar });
        saveName(name);
        saveAvatar(avatar);
    }, []);

    const createRoom = useCallback(
        (name: string, settings?: Partial<GameSettings>) => {
            if (!socket || !tokenRef.current) return;
            setIsLoading(true);
            persistProfile(name, clientState.playerAvatar);
            socket.emit('room:create', name, clientState.playerAvatar, settings ?? {}, tokenRef.current);
        },
        [socket, persistProfile, clientState.playerAvatar],
    );

    const joinRoom = useCallback(
        (roomCode: string, name: string) => {
            if (!socket || !tokenRef.current) return;
            setIsLoading(true);
            persistProfile(name, clientState.playerAvatar);
            socket.emit('room:join', roomCode.toUpperCase(), name, clientState.playerAvatar, tokenRef.current);
        },
        [socket, persistProfile, clientState.playerAvatar],
    );

    const leaveRoom = useCallback(() => {
        socket?.emit('room:leave');
        dispatch({ type: 'setGameState', gameState: null });
        dispatch({ type: 'setLastRoomCode', roomCode: null });
        clearLastRoomCode();
    }, [socket]);

    const startGame = useCallback(
        (options?: { autoCallIntervalMs: number }) => {
            if (!socket || !isHost) return;
            socket.emit('game:start', options);
        },
        [socket, isHost],
    );

    const callNextNumber = useCallback(() => {
        if (!socket || !isHost) return;
        socket.emit('game:callNumber');
    }, [socket, isHost]);

    const markCell = useCallback(
        (cardId: string, row: number, col: number) => {
            socket?.emit('game:markCell', cardId, row, col);
        },
        [socket],
    );

    const claimWin = useCallback(
        (cardId: string) => {
            socket?.emit('game:claimWin', cardId);
        },
        [socket],
    );

    const claimFlat = useCallback(
        (flatType: number) => {
            socket?.emit('game:claimFlat', flatType);
        },
        [socket],
    );

    const pauseGame = useCallback(() => {
        if (!socket || !isHost) return;
        socket.emit('game:pause');
    }, [socket, isHost]);

    const resumeGame = useCallback(() => {
        if (!socket || !isHost) return;
        socket.emit('game:resume');
    }, [socket, isHost]);

    const restartGame = useCallback(() => {
        if (!socket || !isHost) return;
        socket.emit('game:restart');
    }, [socket, isHost]);

    const updateProfile = useCallback(
        (name: string, avatarUrl: string) => {
            if (!socket) return;
            socket.emit('room:updateProfile', name, avatarUrl);
            persistProfile(name, avatarUrl);
        },
        [socket, persistProfile],
    );

    const kickPlayer = useCallback(
        (targetId: string) => {
            if (!socket || !isHost) return;
            socket.emit('room:kickPlayer', targetId);
        },
        [socket, isHost],
    );

    const closeRoom = useCallback(() => {
        if (!socket || !isHost) return;
        socket.emit('room:close');
    }, [socket, isHost]);

    const setPlayerAvatar = useCallback(
        (avatar: string) => {
            persistProfile(clientState.playerName ?? '', avatar);
        },
        [persistProfile, clientState.playerName],
    );

    const addDebugPlayers = useCallback(() => {
        const dummy1 = { id: 'bot1', name: 'Bot Alice', avatarUrl: '🦊', isConnected: true, isHost: false, cards: [], collectedFlats: [], score: 0 };
        const dummy2 = { id: 'bot2', name: 'Bot Bob', avatarUrl: '🦁', isConnected: true, isHost: false, cards: [], collectedFlats: [], score: 0 };

        if (clientState.gameState) {
            const newPlayers = [...clientState.gameState.players, dummy1, dummy2];
            dispatch({
                type: 'setGameState',
                gameState: { ...clientState.gameState, players: newPlayers }
            });
        }
    }, [clientState.gameState]);

    const clearError = useCallback(() => {
        if (errorTimerRef.current) {
            clearTimeout(errorTimerRef.current);
        }
        dispatch({ type: 'setError', error: null });
    }, []);

    // ========================================================================
    // CONTEXT VALUE
    // ========================================================================

    const value = useMemo<GameContextType>(
        () => ({
            socket,
            playerId: clientState.playerId,
            playerName: clientState.playerName,
            playerAvatar: clientState.playerAvatar,
            gameState: clientState.gameState,
            isConnected,
            isLoading,
            isHost,
            error: clientState.error,
            clearError,
            createRoom,
            joinRoom,
            leaveRoom,
            startGame,
            callNextNumber,
            markCell,
            claimWin,
            claimFlat,
            pauseGame,
            resumeGame,
            restartGame,
            updateProfile,
            kickPlayer,
            setPlayerAvatar,
            closeRoom,
            addDebugPlayers,
        }),
        [
            socket,
            clientState.playerId,
            clientState.playerName,
            clientState.playerAvatar,
            clientState.gameState,
            clientState.error,
            isConnected,
            isLoading,
            isHost,
            clearError,
            createRoom,
            joinRoom,
            leaveRoom,
            startGame,
            callNextNumber,
            markCell,
            claimWin,
            claimFlat,
            pauseGame,
            resumeGame,
            restartGame,
            updateProfile,
            kickPlayer,
            setPlayerAvatar,
            closeRoom,
            addDebugPlayers,
        ],
    );

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// Re-export for convenience
export { DEFAULT_AVATARS };
