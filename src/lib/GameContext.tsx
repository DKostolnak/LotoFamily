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
import type { Socket } from 'socket.io-client';
import type { GameSettings, GameState, ServerToClientEvents, ClientToServerEvents } from './types';
import { gameClientReducer, initialGameClientState, DEFAULT_AVATARS } from './state/gameReducer';
import { useGameSocket } from '../hooks/useGameSocket';
import {
    ensurePlayerToken,
    getPlayerAvatar,
    getPlayerName,
    getLastRoomCode,
    setPlayerAvatar as saveAvatar,
    setPlayerName as saveName,
    clearLastRoomCode,
} from './services/storage';

// ============================================================================
// TYPES
// ============================================================================

interface GameContextType {
    socket: Socket | null;
    playerId: string | null;
    playerName: string | null;
    playerAvatar: string;
    gameState: GameState | null;
    isConnected: boolean;
    isLoading: boolean;
    isHost: boolean;
    error: string | null;
    clearError: () => void;
    createRoom: (name: string, settings?: Partial<GameSettings>) => void;
    joinRoom: (roomCode: string, name: string) => void;
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
    kickPlayer: (targetId: string) => void;
    setPlayerAvatar: (avatar: string) => void;
    closeRoom: () => void;
    addDebugPlayers: () => void;
}

interface GameProviderProps {
    children: ReactNode;
    serverUrl?: string; // Optional for local dev vs production
}

const ERROR_AUTO_DISMISS_MS = 5000;

const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGame() {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}


// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function GameProvider({ children, serverUrl = '' }: GameProviderProps) {
    // State management
    const [clientState, dispatch] = useReducer(gameClientReducer, initialGameClientState);
    const [isLoading, setIsLoading] = useState(false);

    // Refs for values that shouldn't trigger re-renders
    const tokenRef = useRef<string | null>(null);
    const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    // SOCKET CONNECTION (Managed by useGameSocket)
    // ========================================================================

    const socket = useGameSocket({
        serverUrl,
        dispatch,
        tokenRef,
        setIsLoading,
    });

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
        if (!socket) return;
        socket.emit('room:addBots');
    }, [socket]);

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
