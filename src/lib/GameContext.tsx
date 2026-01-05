'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import {
    GameState,
    GameSettings,
    Player,
    ServerToClientEvents,
    ClientToServerEvents
} from './types';

interface GameContextType {
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    gameState: GameState | null;
    playerId: string | null;
    playerName: string | null;
    isConnected: boolean;
    isLoading: boolean;
    isHost: boolean;
    error: string | null;
    clearError: () => void;

    // Actions
    createRoom: (playerName: string, settings?: Partial<GameSettings>) => void;
    joinRoom: (roomCode: string, playerName: string) => void;
    leaveRoom: () => void;
    startGame: () => void;
    callNextNumber: () => void;
    markCell: (cardId: string, row: number, col: number) => void;
    claimWin: (cardId: string) => void;
    claimFlat: (flatType: number) => void;
    pauseGame: () => void;
    resumeGame: () => void;
    restartGame: () => void;
    updateProfile: (name: string, avatarUrl: string) => void;
    kickPlayer: (playerId: string) => void;
    playerAvatar: string;
    setPlayerAvatar: (url: string) => void;
    closeRoom: () => void; // New action
    useSabotage: (targetId: string, type: import('./types').SabotageType) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}

interface GameProviderProps {
    children: ReactNode;
    serverUrl?: string;
}

export function GameProvider({ children, serverUrl = '' }: GameProviderProps) {
    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState<string | null>(null);
    const [playerAvatar, setPlayerAvatar] = useState<string>('🐻'); // Default emoji avatar
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wasDisconnected, setWasDisconnected] = useState(false);
    const [playerToken, setPlayerToken] = useState<string | null>(null);

    const isHost = gameState?.hostId === playerId;

    // Load or generate player token
    useEffect(() => {
        let token = localStorage.getItem('loto_playerToken');
        if (!token) {
            // crypto.randomUUID() requires a secure context (HTTPS)
            // Local IP access (http://10.0.1.14) may fail. Provide a fallback.
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                token = crypto.randomUUID();
            } else {
                token = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = (Math.random() * 16) | 0;
                    const v = c === 'x' ? r : (r & 0x3) | 0x8;
                    return v.toString(16);
                });
            }
            localStorage.setItem('loto_playerToken', token);
        }
        setPlayerToken(token);

        // Load or initialize avatar
        const savedAvatar = localStorage.getItem('loto_playerAvatar');
        if (savedAvatar) {
            setPlayerAvatar(savedAvatar);
        } else {
            const defaultAvatars = ['🐻', '🦊', '🐱', '🐼', '🦁', '🐯', '🐨', '🐸'];
            const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
            setPlayerAvatar(randomAvatar);
            localStorage.setItem('loto_playerAvatar', randomAvatar);
        }

        // AUTO-REJOIN: If we have a stored room code and name, try to join
        const lastRoom = localStorage.getItem('loto_lastRoom');
        const lastName = localStorage.getItem('loto_playerName');
        if (lastRoom && lastName && socket) {
            // Wait for socket to be ready
            const timer = setTimeout(() => {
                socket.emit('room:join', lastRoom, lastName, token);
                setIsLoading(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [socket]); // Re-run when socket is initialized

    // Auto-clear errors after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Initialize socket connection
    useEffect(() => {
        const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
            autoConnect: true, // Auto connect for simpler lifecycle
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            setPlayerId(newSocket.id || null);
            setError(null);
            setIsLoading(false);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            setWasDisconnected(true);
        });

        newSocket.on('connect_error', () => {
            setError('Connection failed. Retrying...');
            setIsLoading(false);
        });

        newSocket.on('game:state', (state) => {
            setGameState(state);
            setIsLoading(false);
            // Save room code on successful state update (meaning we are in a room)
            if (state.roomCode) {
                localStorage.setItem('loto_lastRoom', state.roomCode);
            }
        });

        newSocket.on('game:error', (message) => {
            setError(message);
            setIsLoading(false);
            if (message === "Room not found") {
                localStorage.removeItem('loto_lastRoom');
            }
        });

        newSocket.on('room:joined', (state) => {
            setGameState(state);
            setIsLoading(false);
            if (state.roomCode) {
                localStorage.setItem('loto_lastRoom', state.roomCode);
            }
        });

        newSocket.on('room:created', (code) => {
            localStorage.setItem('loto_lastRoom', code);
        });

        newSocket.on('room:kicked', () => {
            setGameState(null);
            localStorage.removeItem('loto_lastRoom');
            setError('You have been kicked from the room.');
        });

        newSocket.on('room:closed', () => {
            setGameState(null);
            localStorage.removeItem('loto_lastRoom');
            setError('The host has closed the room.');
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [serverUrl]);

    // Connect socket when needed
    const connect = useCallback(() => {
        if (socket && !socket.connected) {
            socket.connect();
        }
    }, [socket]);

    // Create a new room
    const createRoom = useCallback((name: string, settings?: Partial<GameSettings>) => {
        if (!socket || !playerToken) return;
        setIsLoading(true);
        setPlayerName(name);
        localStorage.setItem('loto_playerName', name);
        localStorage.setItem('loto_playerAvatar', playerAvatar);
        socket.emit('room:create', name, playerAvatar, settings || {}, playerToken);
    }, [socket, playerToken, playerAvatar]);

    // Join an existing room
    const joinRoom = useCallback((roomCode: string, name: string) => {
        if (!socket || !playerToken) return;
        setIsLoading(true);
        setPlayerName(name);
        localStorage.setItem('loto_playerName', name);
        localStorage.setItem('loto_playerAvatar', playerAvatar);
        socket.emit('room:join', roomCode.toUpperCase(), name, playerAvatar, playerToken);
    }, [socket, playerToken, playerAvatar]);

    // Leave the current room
    const leaveRoom = useCallback(() => {
        if (!socket) return;
        socket.emit('room:leave');
        setGameState(null);
        localStorage.removeItem('loto_lastRoom');
    }, [socket]);

    // Start the game (host only)
    const startGame = useCallback(() => {
        if (!socket || !isHost) return;
        socket.emit('game:start');
    }, [socket, isHost]);

    // Call the next number (host only)
    const callNextNumber = useCallback(() => {
        if (!socket || !isHost) return;
        socket.emit('game:callNumber');
    }, [socket, isHost]);

    // Mark a cell on a card
    const markCell = useCallback((cardId: string, row: number, col: number) => {
        if (!socket) return;
        socket.emit('game:markCell', cardId, row, col);
    }, [socket]);

    // Claim a win
    const claimWin = useCallback((cardId: string) => {
        if (!socket) return;
        socket.emit('game:claimWin', cardId);
    }, [socket]);

    // Claim a flat (intermediate win)
    const claimFlat = useCallback((flatType: number) => {
        if (!socket) return;
        socket.emit('game:claimFlat', flatType);
    }, [socket]);



    // Pause the game (host only)
    const pauseGame = useCallback(() => {
        if (!socket || !isHost) return;
        socket.emit('game:pause');
    }, [socket, isHost]);

    // Resume the game (host only)
    const resumeGame = useCallback(() => {
        if (!socket || !isHost) return;
        socket.emit('game:resume');
    }, [socket, isHost]);

    // Restart the game (host only)
    const restartGame = useCallback(() => {
        if (!socket || !isHost) return;
        socket.emit('game:restart');
    }, [socket, isHost]);

    // Clear error manually
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const updateProfile = useCallback((name: string, avatarUrl: string) => {
        if (socket) {
            socket.emit('room:updateProfile', name, avatarUrl);
            setPlayerName(name);
            setPlayerAvatar(avatarUrl);
            localStorage.setItem('loto_playerName', name);
            localStorage.setItem('loto_playerAvatar', avatarUrl);
        }
    }, [socket, setPlayerAvatar]);

    const kickPlayer = useCallback((targetId: string) => {
        if (socket && isHost) {
            socket.emit('room:kickPlayer', targetId);
        }
    }, [socket, isHost]);

    const closeRoom = useCallback(() => {
        if (socket && isHost) {
            socket.emit('room:close');
        }
    }, [socket, isHost]);

    const useSabotage = useCallback((targetId: string, type: import('./types').SabotageType) => {
        if (socket) {
            socket.emit('game:useSabotage', targetId, type);
        }
    }, [socket]);

    const value: GameContextType = {
        socket,
        gameState,
        playerId,
        playerName,
        playerAvatar,
        setPlayerAvatar,
        isConnected,
        isLoading,
        isHost,
        error,
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
        closeRoom,
        useSabotage,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}
