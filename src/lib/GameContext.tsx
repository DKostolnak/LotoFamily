'use client';

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
import type {
    GameSettings,
    GameState,
    ServerToClientEvents,
    ClientToServerEvents,
} from './types';
import {
    DEFAULT_AVATARS,
    gameClientReducer,
    initialGameClientState,
} from './state/gameReducer';

interface GameContextType {
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    playerId: string | null;
    playerName: string | null;
    playerAvatar: string;
    gameState: GameState | null;
    isConnected: boolean;
    isLoading: boolean;
    isHost: boolean;
    error: string | null;
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
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame(): GameContextType {
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

const TOKEN_STORAGE_KEY = 'loto_playerToken';
const AVATAR_STORAGE_KEY = 'loto_playerAvatar';
const NAME_STORAGE_KEY = 'loto_playerName';
const ROOM_STORAGE_KEY = 'loto_lastRoom';
const ERROR_DISMISS_DELAY = 5000;

function safeLocalStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
}

function createStableId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function ensurePlayerToken(storage: Storage | null): string {
    if (!storage) {
        return createStableId();
    }
    let token = storage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
        token = createStableId();
        storage.setItem(TOKEN_STORAGE_KEY, token);
    }
    return token;
}

function loadAvatar(storage: Storage | null): string {
    if (!storage) return DEFAULT_AVATARS[0];
    const savedAvatar = storage.getItem(AVATAR_STORAGE_KEY);
    if (savedAvatar) {
        return savedAvatar;
    }
    const randomAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
    storage.setItem(AVATAR_STORAGE_KEY, randomAvatar);
    return randomAvatar;
}

export function GameProvider({ children, serverUrl = '' }: GameProviderProps) {
    const storage = safeLocalStorage();
    const token = useRef<string | null>(null);
    const [clientState, dispatch] = useReducer(gameClientReducer, initialGameClientState);
    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [pendingReconnect, setPendingReconnect] = useState(false);

    useEffect(() => {
        const nextToken = ensurePlayerToken(storage);
        token.current = nextToken;

        const avatar = loadAvatar(storage);
        dispatch({ type: 'setPlayerAvatar', playerAvatar: avatar });

        const savedName = storage?.getItem(NAME_STORAGE_KEY) ?? null;
        if (savedName) {
            dispatch({ type: 'setPlayerName', playerName: savedName });
        }

        const savedRoom = storage?.getItem(ROOM_STORAGE_KEY) ?? null;
        if (savedRoom) {
            dispatch({ type: 'setLastRoomCode', roomCode: savedRoom });
        }
    }, [storage]);

    useEffect(() => {
        const client: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
            autoConnect: false,
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(client);
        dispatch({ type: 'setConnectionStatus', status: 'connecting' });
        client.connect();

        client.on('connect', () => {
            dispatch({ type: 'setConnectionStatus', status: pendingReconnect ? 'reconnecting' : 'connected' });
            dispatch({ type: 'setPlayerId', playerId: client.id ?? null });
            dispatch({ type: 'setError', error: null });
            setIsLoading(false);
            setPendingReconnect(false);

            const lastRoom = storage?.getItem(ROOM_STORAGE_KEY);
            const lastName = storage?.getItem(NAME_STORAGE_KEY);
            if (lastRoom && lastName && token.current) {
                client.emit('room:join', lastRoom, lastName, token.current);
                setIsLoading(true);
            }
        });

        client.on('disconnect', () => {
            dispatch({ type: 'setConnectionStatus', status: 'disconnected' });
            dispatch({ type: 'setWasDisconnected', wasDisconnected: true });
            setPendingReconnect(true);
        });

        client.on('connect_error', () => {
            dispatch({ type: 'setError', error: 'Connection failed. Retrying...' });
            setIsLoading(false);
        });

        client.on('game:state', (nextState) => {
            dispatch({ type: 'setGameState', gameState: nextState });
            setIsLoading(false);
            if (nextState.roomCode) {
                storage?.setItem(ROOM_STORAGE_KEY, nextState.roomCode);
            }
        });

        client.on('game:error', (message) => {
            dispatch({ type: 'setError', error: message });
            setIsLoading(false);
            if (message === 'Room not found') {
                storage?.removeItem(ROOM_STORAGE_KEY);
            }
        });

        client.on('room:joined', (nextState) => {
            dispatch({ type: 'setGameState', gameState: nextState });
            setIsLoading(false);
            if (nextState.roomCode) {
                storage?.setItem(ROOM_STORAGE_KEY, nextState.roomCode);
            }
        });

        client.on('room:created', (code) => {
            storage?.setItem(ROOM_STORAGE_KEY, code);
        });

        client.on('room:kicked', () => {
            dispatch({ type: 'setGameState', gameState: null });
            storage?.removeItem(ROOM_STORAGE_KEY);
            dispatch({ type: 'setError', error: 'You have been removed from the room.' });
        });

        client.on('room:closed', () => {
            dispatch({ type: 'setGameState', gameState: null });
            storage?.removeItem(ROOM_STORAGE_KEY);
            dispatch({ type: 'setError', error: 'The host closed the room.' });
        });



        return () => {
            client.disconnect();
        };
    }, [serverUrl, storage, pendingReconnect]);

    useEffect(() => {
        if (clientState.error && typeof window !== 'undefined' && 'scrollTo' in window) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [clientState.error]);

    useEffect(() => {
        if (!clientState.error) return;
        if (errorTimerRef.current) {
            clearTimeout(errorTimerRef.current);
        }
        errorTimerRef.current = setTimeout(() => {
            dispatch({ type: 'setError', error: null });
        }, ERROR_DISMISS_DELAY);
        return () => {
            if (errorTimerRef.current) {
                clearTimeout(errorTimerRef.current);
            }
        };
    }, [clientState.error]);

    const isHost = useMemo(
        () => !!clientState.gameState && clientState.gameState.hostId === clientState.playerId,
        [clientState.gameState, clientState.playerId],
    );

    const handleProfilePersist = useCallback(
        (name: string, avatar: string) => {
            dispatch({ type: 'setPlayerName', playerName: name });
            dispatch({ type: 'setPlayerAvatar', playerAvatar: avatar });
            storage?.setItem(NAME_STORAGE_KEY, name);
            storage?.setItem(AVATAR_STORAGE_KEY, avatar);
        },
        [storage],
    );

    const createRoom = useCallback(
        (name: string, settings?: Partial<GameSettings>) => {
            if (!socket || !token.current) return;
            setIsLoading(true);
            handleProfilePersist(name, clientState.playerAvatar);
            socket.emit('room:create', name, clientState.playerAvatar, settings ?? {}, token.current);
        },
        [socket, token, handleProfilePersist, clientState.playerAvatar],
    );

    const joinRoom = useCallback(
        (roomCode: string, name: string) => {
            if (!socket || !token.current) return;
            setIsLoading(true);
            handleProfilePersist(name, clientState.playerAvatar);
            socket.emit('room:join', roomCode.toUpperCase(), name, clientState.playerAvatar, token.current);
        },
        [socket, token, handleProfilePersist, clientState.playerAvatar],
    );

    const leaveRoom = useCallback(() => {
        if (socket) {
            socket.emit('room:leave');
        }
        // Always clear local state to exit the screen immediately
        dispatch({ type: 'setGameState', gameState: null });
        dispatch({ type: 'setLastRoomCode', roomCode: null });
        storage?.removeItem(ROOM_STORAGE_KEY);
    }, [socket, storage]);

    const startGame = useCallback((options?: { autoCallIntervalMs: number }) => {
        if (!socket || !isHost) return;
        socket.emit('game:start', options);
    }, [socket, isHost]);

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
            handleProfilePersist(name, avatarUrl);
        },
        [socket, handleProfilePersist],
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
            handleProfilePersist(clientState.playerName ?? '', avatar);
        },
        [handleProfilePersist, clientState.playerName],
    );



    const clearError = useCallback(() => {
        if (errorTimerRef.current) {
            clearTimeout(errorTimerRef.current);
        }
        dispatch({ type: 'setError', error: null });
    }, []);

    const value = useMemo<GameContextType>(
        () => ({
            socket,
            playerId: clientState.playerId,
            playerName: clientState.playerName,
            playerAvatar: clientState.playerAvatar,
            gameState: clientState.gameState,
            isConnected: clientState.connectionStatus === 'connected' || clientState.connectionStatus === 'reconnecting',
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
        }),
        [
            socket,
            clientState.playerId,
            clientState.playerName,
            clientState.playerAvatar,
            clientState.gameState,
            clientState.connectionStatus,
            isLoading,
            isHost,
            clientState.error,
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
        ],
    );

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
