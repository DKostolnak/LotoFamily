import { useEffect, useState, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/types';
import type { GameClientAction } from '@/lib/state/gameReducer';
import {
    getPlayerAvatar,
    getPlayerName,
    getLastRoomCode,
    setLastRoomCode,
    clearLastRoomCode,
} from '@/lib/services/storage';

interface UseGameSocketProps {
    serverUrl?: string;
    dispatch: React.Dispatch<GameClientAction>;
    tokenRef: React.MutableRefObject<string | null>;
    setIsLoading: (loading: boolean) => void;
}

export function useGameSocket({ serverUrl = '', dispatch, tokenRef, setIsLoading }: UseGameSocketProps) {
    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const pendingReconnectRef = useRef(false);
    const isAutoReconnectAttemptRef = useRef(false);

    useEffect(() => {
        const client: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
            autoConnect: false,
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000,
            randomizationFactor: 0.5,
            timeout: 20000,
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
                isAutoReconnectAttemptRef.current = true;
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
            const isAutoReconnectFailure = message === 'Room not found' && isAutoReconnectAttemptRef.current;
            isAutoReconnectAttemptRef.current = false;

            if (message === 'Room not found') {
                clearLastRoomCode();
            }

            if (!isAutoReconnectFailure) {
                dispatch({ type: 'setError', error: message });
            }
            setIsLoading(false);
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
    }, [serverUrl, dispatch, setIsLoading, tokenRef]);

    return socket;
}
