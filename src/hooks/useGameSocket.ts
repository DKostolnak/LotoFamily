/**
 * useGameSocket - React hook for game socket management
 * 
 * Provides reactive state for socket connection and game events.
 * Integrates with Zustand store for app-wide state sync.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService, type ConnectionStatus, type GameSocket } from '@/lib/services/socket';
import type { GameState, Player, GameSettings } from '@/lib/types';
import { k_serverUrl } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
    userId: string;
    nickname: string;
    message: string;
    timestamp: number;
}

interface UseGameSocketOptions {
    serverUrl?: string;
    autoConnect?: boolean;
}

interface UseGameSocketReturn {
    // Connection state
    socket: GameSocket | null;
    isConnected: boolean;
    status: ConnectionStatus;
    error: string | null;
    myPlayerId: string | null;

    // Game state
    gameState: GameState | null;
    currentNumber: number | null;
    calledNumbers: number[];
    players: Player[];
    roomCode: string | null;
    isHost: boolean;
    chatMessages: ChatMessage[];

    // Actions
    connect: (serverUrl?: string) => void;
    disconnect: () => void;
    createRoom: (playerName: string, avatar: string, settings?: Partial<GameSettings>, token?: string) => void;
    joinRoom: (roomCode: string, playerName: string, avatar: string, token?: string) => void;
    leaveRoom: () => void;
    startGame: (options?: { autoCallIntervalMs: number }) => void;
    sendChatMessage: (message: string) => void;
    callNumber: () => void;
    markCell: (cardId: string, row: number, col: number) => void;
    claimWin: (cardId: string) => void;
    claimFlat: (flatType: number) => void;
    pauseGame: () => void;
    resumeGame: () => void;
    restartGame: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useGameSocket(options: UseGameSocketOptions = {}): UseGameSocketReturn {
    const { serverUrl = k_serverUrl, autoConnect = false } = options;

    // Connection state
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);

    // Game state
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const socketRef = useRef<GameSocket | null>(null);

    // ========================================================================
    // DERIVED STATE
    // ========================================================================

    const isConnected = status === 'connected';
    const currentNumber = gameState?.currentNumber ?? null;
    const calledNumbers = gameState?.calledNumbers.map(cn => cn.value) ?? [];
    const players = gameState?.players ?? [];
    const roomCode = gameState?.roomCode ?? null;
    const myPlayerId = socketRef.current?.id ?? null;
    const isHost = gameState?.hostId === myPlayerId;

    // ========================================================================
    // CONNECTION ACTIONS
    // ========================================================================

    const connect = useCallback((url?: string) => {
        const socket = socketService.connect(url ?? serverUrl);
        socketRef.current = socket;
        setStatus('connecting');
    }, [serverUrl]);

    const disconnect = useCallback(() => {
        socketService.disconnect();
        socketRef.current = null;
        setStatus('disconnected');
        setGameState(null);
        setError(null);
    }, []);

    // ========================================================================
    // GAME ACTIONS
    // ========================================================================

    const createRoom = useCallback((
        playerName: string,
        avatar: string,
        settings?: Partial<GameSettings>,
        token?: string
    ) => {
        socketService.createRoom(playerName, avatar, settings ?? {}, token);
    }, []);

    const joinRoom = useCallback((
        roomCodeInput: string,
        playerName: string,
        avatar: string,
        token?: string
    ) => {
        socketService.joinRoom(roomCodeInput, playerName, avatar, token);
    }, []);

    const leaveRoom = useCallback(() => {
        socketService.leaveRoom();
        setGameState(null);
    }, []);

    const startGame = useCallback((opts?: { autoCallIntervalMs: number }) => {
        socketService.startGame(opts);
    }, []);

    const sendChatMessage = useCallback((message: string) => {
        if (!gameState?.roomId) return;
        socketService.sendChatMessage(gameState.roomId, message);
    }, [gameState?.roomId]);

    const callNumber = useCallback(() => {
        socketService.callNumber();
    }, []);

    const markCell = useCallback((cardId: string, row: number, col: number) => {
        socketService.markCell(cardId, row, col);
    }, []);

    const claimWin = useCallback((cardId: string) => {
        socketService.claimWin(cardId);
    }, []);

    const claimFlat = useCallback((flatType: number) => {
        socketService.claimFlat(flatType);
    }, []);

    const pauseGame = useCallback(() => {
        socketService.pauseGame();
    }, []);

    const resumeGame = useCallback(() => {
        socketService.resumeGame();
    }, []);

    const restartGame = useCallback(() => {
        socketService.restartGame();
    }, []);

    // ========================================================================
    // SOCKET EVENT LISTENERS
    // ========================================================================

    useEffect(() => {
        // Subscribe to service-level events
        const unsubConnection = socketService.subscribe('connection', (connected: unknown) => {
            setStatus(connected ? 'connected' : 'disconnected');
        });

        const unsubError = socketService.subscribe('error', (errorMsg: unknown) => {
            setError(errorMsg as string);
            setStatus('error');
        });

        return () => {
            unsubConnection();
            unsubError();
        };
    }, []);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        // Game state updates
        const handleGameState = (state: GameState) => {
            setGameState(state);
        };

        const handleRoomJoined = (state: GameState) => {
            setGameState(state);
        };

        const handleRoomCreated = (code: string) => {
            console.log('[useGameSocket] Room created:', code);
        };

        const handleNumberCalled = (number: number) => {
            setGameState(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    currentNumber: number,
                    calledNumbers: [
                        ...prev.calledNumbers,
                        { value: number, timestamp: Date.now() }
                    ],
                };
            });
        };

        const handlePlayerJoined = (player: Player) => {
            setGameState(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    players: [...prev.players, player],
                };
            });
        };

        const handlePlayerLeft = (playerId: string) => {
            setGameState(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    players: prev.players.filter(p => p.id !== playerId),
                };
            });
        };

        const handleWinner = (winnerId: string, winnerName: string) => {
            setGameState(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    phase: 'finished',
                    winnerId,
                };
            });
        };

        const handleGameError = (message: string) => {
            setError(message);
        };

        const handleRoomKicked = () => {
            setGameState(null);
            setError('You were kicked from the room');
        };

        const handleRoomClosed = () => {
            setGameState(null);
            setError('Room was closed by host');
        };

        const handleChat = (msg: ChatMessage) => {
            setChatMessages(prev => [...prev.slice(-49), msg]); // Keep last 50
        };

        // Register listeners
        socket.on('game:state', handleGameState);
        socket.on('room:joined', handleRoomJoined);
        socket.on('room:created', handleRoomCreated);
        socket.on('game:numberCalled', handleNumberCalled);
        socket.on('game:playerJoined', handlePlayerJoined);
        socket.on('game:playerLeft', handlePlayerLeft);
        socket.on('game:winner', handleWinner);
        socket.on('game:error', handleGameError);
        socket.on('room:kicked', handleRoomKicked);
        socket.on('room:closed', handleRoomClosed);
        socket.on('room:chat' as any, handleChat);

        return () => {
            socket.off('game:state', handleGameState);
            socket.off('room:joined', handleRoomJoined);
            socket.off('room:created', handleRoomCreated);
            socket.off('game:numberCalled', handleNumberCalled);
            socket.off('game:playerJoined', handlePlayerJoined);
            socket.off('game:playerLeft', handlePlayerLeft);
            socket.off('game:winner', handleWinner);
            socket.off('game:error', handleGameError);
            socket.off('room:kicked', handleRoomKicked);
            socket.off('room:closed', handleRoomClosed);
            socket.off('room:chat' as any, handleChat);
        };
    }, [gameState?.roomId]);

    // Auto-connect if enabled
    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            // Don't disconnect on unmount - let socketService manage lifecycle
        };
    }, [autoConnect, connect]);

    return {
        socket: socketRef.current,
        isConnected,
        status,
        error,
        myPlayerId,
        gameState,
        currentNumber,
        calledNumbers,
        players,
        roomCode,
        isHost,
        chatMessages,
        connect,
        disconnect,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        sendChatMessage,
        callNumber,
        markCell,
        claimWin,
        claimFlat,
        pauseGame,
        resumeGame,
        restartGame,
    };
}
