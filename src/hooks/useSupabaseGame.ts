/**
 * useSupabaseGame — Supabase Realtime multiplayer hook
 *
 * Nahradí useGameSocket (Socket.io) s rovnakým rozhraním.
 * OnlineGame.tsx potrebuje zmeniť len jeden import.
 *
 * Architektúra (host-driven):
 *
 *   HOST                           CLIENTS
 *   ────                           ───────
 *   LotoGameModule (lokálna logika)
 *   callNumber() → updateState()
 *   broadcast game:state ─────────→ receive → setGameState()
 *
 *   receive game:markCell ←───────  broadcast game:markCell
 *   handleMessage() → updateState()
 *   broadcast game:state ─────────→ receive → setGameState()
 *
 * Prečo host-driven:
 *   - Nevyžaduje server (Render.com free tier spal po 15 min)
 *   - LotoGameModule už existuje a je otestovaný
 *   - Pre family casual hru je host-trust model dostatočný
 *
 * Tok pripojenia:
 *   CREATE: generateRoomCode → saveRoomToSupabase → joinChannel → initEngine
 *   JOIN:   fetchRoomFromSupabase → joinChannel → broadcast playerJoined
 *   HOST:   receives playerJoined → addPlayer → broadcast game:state
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeService } from '@/lib/services/supabaseRealtime';
import { supabase } from '@/lib/services/supabase';
import { getSession } from '@/lib/services/supabase';
import { LotoGameModule } from '@/lib/game-modules/loto/logic/LotoEngine';
import { generateCards } from '@/engine/lotoCardGenerator';
import type { GameState, Player, GameSettings } from '@/lib/types';
import type { ChatMessage } from './useGameSocket';
import type { BroadcastEventType } from '@/lib/services/supabaseRealtime';

// ============================================================================
// TYPY — rovnaký interface ako useGameSocket
// ============================================================================

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface UseSupabaseGameReturn {
    socket: null;                    // vždy null — pre kompatibilitu s GameStatusListener
    isConnected: boolean;
    status: RealtimeStatus;
    error: string | null;
    myPlayerId: string | null;

    gameState: GameState | null;
    currentNumber: number | null;
    calledNumbers: number[];
    players: Player[];
    roomCode: string | null;
    isHost: boolean;
    chatMessages: ChatMessage[];

    connect: () => void;
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

    // Event callbacks pre GameStatusListener (nahradí socket.on)
    onGameEvent: (event: BroadcastEventType, cb: (payload: unknown) => void) => () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Generuje 6-znakový kód miestnosti (napr. "ABC123") */
function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ============================================================================
// HOOK
// ============================================================================

export function useSupabaseGame(): UseSupabaseGameReturn {
    const [status, setStatus] = useState<RealtimeStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

    // Host-only: LotoGameModule inštancia
    const engineRef = useRef<LotoGameModule | null>(null);
    const isHostRef = useRef(false);

    // =========================================================================
    // DERIVED STATE
    // =========================================================================

    const isConnected = status === 'connected';
    const currentNumber = gameState?.currentNumber ?? null;
    const calledNumbers = gameState?.calledNumbers.map(cn => cn.value) ?? [];
    const players = gameState?.players ?? [];
    const roomCode = gameState?.roomCode ?? null;
    const isHost = isHostRef.current;

    // =========================================================================
    // INICIALIZÁCIA — zisti userId zo Supabase session
    // =========================================================================

    useEffect(() => {
        getSession().then(({ data: { session } }) => {
            if (session?.user?.id) {
                setMyPlayerId(session.user.id);
            }
        });

        // Cleanup pri unmount
        return () => {
            engineRef.current?.destroy();
            engineRef.current = null;
        };
    }, []);

    // =========================================================================
    // BROADCAST HELPER — host posiela stav všetkým
    // =========================================================================

    const broadcastState = useCallback((state: GameState) => {
        realtimeService.sendGameState(state);
    }, []);

    // =========================================================================
    // SUBSCRIBE NA REALTIME UDALOSTI
    // =========================================================================

    const setupListeners = useCallback((currentUserId: string) => {
        // Príjem kompletného stavu hry (clients dostávajú od hosta)
        const unsubState = realtimeService.on<GameState>('game:state', (state) => {
            setGameState(state);
            setStatus('connected');
        });

        // Príjem hráča ktorý sa chce pripojiť (host spracuje)
        const unsubJoined = realtimeService.on<Player>('game:playerJoined', (newPlayer, senderId) => {
            if (!isHostRef.current || !engineRef.current) return;
            if (senderId === currentUserId) return; // ignoruj seba

            // Pridaj hráča do engine
            const cards = generateCards(newPlayer.id, engineRef.current.getState()?.settings.cardsPerPlayer ?? 1);
            const playerWithCards: Player = { ...newPlayer, cards, isHost: false, isConnected: true, collectedFlats: [], score: 0 };

            engineRef.current.patchState(s => ({
                ...s,
                players: [...s.players.filter(p => p.id !== newPlayer.id), playerWithCards],
            }));

            const newState = engineRef.current.getState();
            if (newState) {
                setGameState({ ...newState });
                broadcastState(newState);
            }
        });

        // Príjem odchodu hráča
        const unsubLeft = realtimeService.on<{ playerId: string }>('game:playerLeft', ({ playerId }) => {
            if (isHostRef.current && engineRef.current) {
                engineRef.current.patchState(s => ({
                    ...s,
                    players: s.players.filter(p => p.id !== playerId),
                }));
                const newState = engineRef.current.getState();
                if (newState) {
                    setGameState({ ...newState });
                    broadcastState(newState);
                }
            } else {
                setGameState(prev => prev
                    ? { ...prev, players: prev.players.filter(p => p.id !== playerId) }
                    : prev
                );
            }
        });

        // Príjem herných akcií (len host spracuje)
        const unsubMarkCell = realtimeService.on<{ cardId: string; row: number; col: number; }>('game:state', () => {});
        // Použijeme handleMessage pre game:markCell a game:claimWin
        const unsubAction = realtimeService.on<{ type: string; payload: unknown }>('game:state', () => {});

        // Chat správy
        const unsubChat = realtimeService.on<ChatMessage>('game:state', () => {});

        return () => {
            unsubState();
            unsubJoined();
            unsubLeft();
            unsubMarkCell();
            unsubAction();
            unsubChat();
        };
    }, [broadcastState]);

    // =========================================================================
    // CREATE ROOM (Host)
    // =========================================================================

    const createRoom = useCallback(async (
        playerName: string,
        avatar: string,
        settings?: Partial<GameSettings>,
    ) => {
        // myPlayerId may not be set yet (async init race) — resolve directly
        let userId = myPlayerId;
        if (!userId) {
            const { data: { session } } = await getSession();
            userId = session?.user?.id ?? null;
            if (userId) setMyPlayerId(userId);
        }
        if (!userId) { setError('Not authenticated'); return; }

        setStatus('connecting');
        setError(null);

        try {
            const code = generateRoomCode();
            isHostRef.current = true;

            // Inicializuj LotoGameModule
            const engine = new LotoGameModule();
            engine.initialize({
                host: { id: userId, name: playerName, avatar, isHost: true },
                roomCode: code,
                settings,
            });
            engineRef.current = engine;

            // Subscrib na všetky zmeny stavu enginu (autoCall, markCell, atď.)
            // Bez tohto auto-call nikdy neupraví React state ani nebroadcastuje.
            engine.onStateChange((newState) => {
                setGameState({ ...newState });
                if (isHostRef.current) broadcastState(newState);
            });

            // Ulož miestnosť do Supabase DB
            await (supabase.from('game_rooms') as any).insert({
                room_code: code,
                host_id: userId,
                phase: 'lobby',
                settings: settings ?? {},
                players: [],
                called_numbers: [],
                current_number: null,
                winner_id: null,
                flat_winners: { flat1: null, flat2: null },
            });

            // Pripoj sa na Realtime kanál
            await realtimeService.joinRoom(code, userId);
            setupListeners(userId);

            const initialState = engine.getState()!;
            setGameState({ ...initialState });
            setStatus('connected');

            console.log('[useSupabaseGame] Room created:', code);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to create room';
            setError(msg);
            setStatus('error');
        }
    }, [myPlayerId, setupListeners]);

    // =========================================================================
    // JOIN ROOM (Client)
    // =========================================================================

    const joinRoom = useCallback(async (
        roomCodeInput: string,
        playerName: string,
        avatar: string,
    ) => {
        // myPlayerId may not be set yet (async init race) — resolve directly
        let userId = myPlayerId;
        if (!userId) {
            const { data: { session } } = await getSession();
            userId = session?.user?.id ?? null;
            if (userId) setMyPlayerId(userId);
        }
        if (!userId) { setError('Not authenticated'); return; }

        setStatus('connecting');
        setError(null);

        try {
            const code = roomCodeInput.toUpperCase().trim();
            isHostRef.current = false;

            // Skontroluj že miestnosť existuje
            const { data: room, error: roomErr } = await (supabase.from('game_rooms') as any)
                .select('id, phase, host_id')
                .eq('room_code', code)
                .single();

            if (roomErr || !room) {
                throw new Error('Room not found. Check the code and try again.');
            }
            if (room.phase === 'finished') {
                throw new Error('This game has already ended.');
            }

            // Pripoj sa na Realtime kanál
            await realtimeService.joinRoom(code, userId);
            setupListeners(userId);

            // Oznám ostatným že sa pripájam
            const joiningPlayer: Partial<Player> = {
                id: userId,
                name: playerName,
                avatar,
            };
            realtimeService.sendPlayerJoined(joiningPlayer as Player);

            setStatus('connected');
            console.log('[useSupabaseGame] Joined room:', code);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to join room';
            setError(msg);
            setStatus('error');
        }
    }, [myPlayerId, setupListeners]);

    // =========================================================================
    // GAME ACTIONS
    // =========================================================================

    const leaveRoom = useCallback(async () => {
        if (myPlayerId) realtimeService.sendPlayerLeft(myPlayerId);
        await realtimeService.leaveRoom();
        engineRef.current?.destroy();
        engineRef.current = null;
        isHostRef.current = false;
        setGameState(null);
        setStatus('disconnected');
    }, [myPlayerId]);

    const startGame = useCallback((opts?: { autoCallIntervalMs: number }) => {
        if (!isHostRef.current || !engineRef.current) return;
        if (opts?.autoCallIntervalMs) {
            engineRef.current.patchState(s => ({
                ...s,
                settings: { ...s.settings, autoCallIntervalMs: opts.autoCallIntervalMs, autoCallEnabled: true },
            }));
        }
        engineRef.current.startGame();
        const newState = engineRef.current.getState()!;
        setGameState({ ...newState });
        broadcastState(newState);
    }, [broadcastState]);

    const callNumber = useCallback(() => {
        if (!isHostRef.current || !engineRef.current) return;
        engineRef.current.callNextNumber();
        const newState = engineRef.current.getState()!;
        setGameState({ ...newState });
        broadcastState(newState);
        realtimeService.sendNumberCalled(newState.currentNumber!);
    }, [broadcastState]);

    const markCell = useCallback((cardId: string, row: number, col: number) => {
        if (isHostRef.current && engineRef.current) {
            // Host si označí sám
            engineRef.current.handleMessage({
                type: 'GAME:MARK_CELL',
                payload: { cardId, row, col },
                senderId: myPlayerId!,
                timestamp: Date.now(),
            });
            const newState = engineRef.current.getState()!;
            setGameState({ ...newState });
            broadcastState(newState);
        } else {
            // Client posiela hostu
            realtimeService.broadcast('game:state', {
                _action: 'GAME:MARK_CELL',
                cardId, row, col,
                senderId: myPlayerId,
            });
        }
    }, [myPlayerId, broadcastState]);

    const claimWin = useCallback((cardId: string) => {
        if (isHostRef.current && engineRef.current) {
            engineRef.current.handleMessage({
                type: 'GAME:CLAIM_WIN',
                payload: { cardId },
                senderId: myPlayerId!,
                timestamp: Date.now(),
            });
            const newState = engineRef.current.getState()!;
            setGameState({ ...newState });
            broadcastState(newState);
        } else {
            realtimeService.broadcast('game:state', {
                _action: 'GAME:CLAIM_WIN',
                cardId,
                senderId: myPlayerId,
            });
        }
    }, [myPlayerId, broadcastState]);

    const claimFlat = useCallback((flatType: number) => {
        if (!isHostRef.current || !engineRef.current) return;
        engineRef.current.handleMessage({
            type: 'GAME:CLAIM_FLAT',
            payload: { flatType },
            senderId: myPlayerId!,
            timestamp: Date.now(),
        });
        const newState = engineRef.current.getState()!;
        setGameState({ ...newState });
        broadcastState(newState);
    }, [myPlayerId, broadcastState]);

    const pauseGame = useCallback(() => {
        if (!isHostRef.current || !engineRef.current) return;
        engineRef.current.pauseGame();
        const newState = engineRef.current.getState()!;
        setGameState({ ...newState });
        broadcastState(newState);
    }, [broadcastState]);

    const resumeGame = useCallback(() => {
        if (!isHostRef.current || !engineRef.current) return;
        engineRef.current.resumeGame();
        const newState = engineRef.current.getState()!;
        setGameState({ ...newState });
        broadcastState(newState);
    }, [broadcastState]);

    const restartGame = useCallback(() => {
        if (!isHostRef.current || !engineRef.current) return;
        engineRef.current.restartGame();
        const newState = engineRef.current.getState()!;
        setGameState({ ...newState });
        broadcastState(newState);
    }, [broadcastState]);

    const sendChatMessage = useCallback((message: string) => {
        if (!myPlayerId || !gameState) return;
        const chatMsg: ChatMessage = {
            userId: myPlayerId,
            nickname: gameState.players.find(p => p.id === myPlayerId)?.name ?? 'Player',
            message,
            timestamp: Date.now(),
        };
        setChatMessages(prev => [...prev.slice(-49), chatMsg]);
        realtimeService.broadcast('game:state', { _chat: chatMsg });
    }, [myPlayerId, gameState]);

    const connect = useCallback(() => {}, []);
    const disconnect = useCallback(() => { leaveRoom(); }, [leaveRoom]);

    // Event listener pre komponentu GameStatusListener
    const onGameEvent = useCallback((event: BroadcastEventType, cb: (payload: unknown) => void) => {
        return realtimeService.on(event, cb);
    }, []);

    return {
        socket: null,
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
        onGameEvent,
    };
}
