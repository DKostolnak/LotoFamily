'use client';

/**
 * P2P Game Context
 * 
 * Provides peer-to-peer game state and actions to components.
 * Similar interface to regular GameContext for easy integration.
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    useRef,
    type ReactNode,
} from 'react';
import { P2PConnection, P2PPlayer, P2PMessage, p2pConnection } from './peerConnection';
import { P2PGameEngine, P2PGameState, p2pGameEngine } from './p2pGameEngine';
import type { GameState, Player } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface P2PContextType {
    // Connection state
    isConnected: boolean;
    isHost: boolean;
    roomCode: string;
    error: string | null;
    hasSavedSession: boolean; // NEW: Check if rejoin is possible

    // Game state (mirrors GameContext)
    gameState: GameState | null;
    playerId: string | null;
    playerName: string;

    // Actions
    createRoom: (playerName: string, avatarUrl?: string) => Promise<string>;
    joinRoom: (roomCode: string, playerName: string, avatarUrl?: string) => Promise<void>;
    rejoinSession: () => Promise<boolean>; // NEW: Rejoin previous session
    leaveRoom: () => void;
    startGame: () => void;
    markCell: (cardId: string, row: number, col: number) => void;
    claimWin: (cardId: string) => void;
    pauseGame: () => void;
    resumeGame: () => void;
    restartGame: () => void;
    clearError: () => void;
}

interface P2PProviderProps {
    children: ReactNode;
}

const P2PContext = createContext<P2PContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function P2PProvider({ children }: P2PProviderProps) {
    // Connection state
    const [isConnected, setIsConnected] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [hasSavedSession, setHasSavedSession] = useState(false);

    // Game state
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState('');

    // Refs for stable callbacks
    const connectionRef = useRef(p2pConnection);
    const engineRef = useRef(p2pGameEngine);

    // Generate unique player ID
    const generatePlayerId = useCallback(() => {
        return 'p2p-' + Math.random().toString(36).substring(2, 10);
    }, []);

    // Check for saved session on mount
    useEffect(() => {
        setHasSavedSession(P2PConnection.hasSession());
    }, []);

    // ========================================================================
    // HOST: Create Room
    // ========================================================================

    const createRoom = useCallback(async (name: string, avatarUrl?: string): Promise<string> => {
        try {
            setError(null);
            const id = generatePlayerId();
            setPlayerId(id);
            setPlayerName(name);
            setIsHost(true);

            const player: P2PPlayer = { id, name, avatarUrl };

            // Set up connection handlers
            connectionRef.current.setHandlers({
                onMessage: (msg) => handleMessage(msg, true),
                onPlayerConnect: (peerId, peerPlayer) => {
                    console.log('[P2P Context] Player connected:', peerPlayer?.name);
                    if (peerPlayer) {
                        const newPlayer = engineRef.current.addPlayer(peerPlayer);
                        if (newPlayer) {
                            // Send current state to new player
                            const state = engineRef.current.getState();
                            if (state) {
                                connectionRef.current.sendTo(peerId, {
                                    type: 'game:state',
                                    payload: state,
                                    senderId: id,
                                    timestamp: Date.now(),
                                });
                            }
                        }
                    }
                },
                onPlayerDisconnect: (peerId) => {
                    console.log('[P2P Context] Player disconnected:', peerId);
                    engineRef.current.removePlayer(peerId);
                },
                onError: (err) => setError(err.message),
                onReady: () => setIsConnected(true),
            });

            // Create room
            const code = await connectionRef.current.createRoom(player);
            setRoomCode(code);

            // Initialize game engine
            const state = engineRef.current.createGame(player, code);
            setGameState(state);

            // Set up engine callbacks
            engineRef.current.setOnStateChange((newState) => {
                setGameState(newState);
                // Broadcast state to all players
                connectionRef.current.send({
                    type: 'game:state',
                    payload: newState,
                    senderId: id,
                    timestamp: Date.now(),
                });
            });

            engineRef.current.setOnBroadcast((msg) => {
                connectionRef.current.send(msg);
            });

            // Save session for reconnection
            connectionRef.current.saveSession();

            return code;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create room';
            setError(message);
            throw err;
        }
    }, [generatePlayerId]);

    // ========================================================================
    // PLAYER: Join Room
    // ========================================================================

    const joinRoom = useCallback(async (code: string, name: string, avatarUrl?: string): Promise<void> => {
        try {
            setError(null);
            const id = generatePlayerId();
            setPlayerId(id);
            setPlayerName(name);
            setIsHost(false);

            const player: P2PPlayer = { id, name, avatarUrl };

            // Set up connection handlers
            connectionRef.current.setHandlers({
                onMessage: (msg) => handleMessage(msg, false),
                onError: (err) => setError(err.message),
                onReady: () => setIsConnected(true),
            });

            // Join room
            await connectionRef.current.joinRoom(player, code);
            setRoomCode(code.toUpperCase());

            // Save session for reconnection
            connectionRef.current.saveSession();

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to join room';
            setError(message);
            throw err;
        }
    }, [generatePlayerId]);

    // ========================================================================
    // REJOIN SESSION
    // ========================================================================

    const rejoinSession = useCallback(async (): Promise<boolean> => {
        try {
            setError(null);

            // Get session data without consuming it yet
            const session = P2PConnection.getSession();
            if (!session) {
                setHasSavedSession(false);
                return false;
            }

            // Set state from session
            setPlayerId(session.playerId);
            setPlayerName(session.playerName);
            setRoomCode(session.roomCode);
            setIsHost(session.isHost);

            // Re-setup handlers before rejoining
            connectionRef.current.setHandlers({
                onMessage: (msg) => handleMessage(msg, session.isHost),
                onPlayerConnect: session.isHost ? (peerId, peerPlayer) => {
                    // Host re-connection handler (same as createRoom)
                    if (peerPlayer) {
                        const newPlayer = engineRef.current.addPlayer(peerPlayer);
                        if (newPlayer) {
                            const state = engineRef.current.getState();
                            if (state) {
                                connectionRef.current.sendTo(peerId, {
                                    type: 'game:state',
                                    payload: state,
                                    senderId: session.playerId,
                                    timestamp: Date.now(),
                                });
                            }
                        }
                    }
                } : undefined,
                onPlayerDisconnect: session.isHost ? (peerId) => {
                    engineRef.current.removePlayer(peerId);
                } : undefined,
                onError: (err) => setError(err.message),
                onReady: () => setIsConnected(true),
            });

            // If we are host, we might need to recover game state too
            // For now, we assume game state is lost if host closes page
            // But if just network drop, P2PConnection keeps it alive? 
            // Actually P2PConnection is new instance on refresh.
            // TODO: Persist Game Engine state to localStorage for full host recovery.

            // Attempt rejoin
            const success = await connectionRef.current.rejoinSession();

            if (success) {
                if (session.isHost) {
                    // Host needs to re-initialize engine
                    // For now, create new game state (limitation: host refresh resets game)
                    // Ideal: Load game state from storage too
                    const player: P2PPlayer = {
                        id: session.playerId,
                        name: session.playerName,
                        avatarUrl: session.avatarUrl
                    };
                    const state = engineRef.current.createGame(player, session.roomCode);
                    setGameState(state);

                    // Setup engine callbacks
                    engineRef.current.setOnStateChange((newState) => {
                        setGameState(newState);
                        connectionRef.current.send({
                            type: 'game:state',
                            payload: newState,
                            senderId: session.playerId,
                            timestamp: Date.now(),
                        });
                    });
                    engineRef.current.setOnBroadcast((msg) => {
                        connectionRef.current.send(msg);
                    });
                }
            } else {
                setHasSavedSession(false);
            }

            return success;
        } catch (err) {
            console.error('Failed to rejoin:', err);
            setError('Failed to rejoin previous session');
            setHasSavedSession(false);
            return false;
        }
    }, [handleMessage]);

    // ========================================================================
    // MESSAGE HANDLING
    // ========================================================================

    const handleMessage = useCallback((msg: P2PMessage, asHost: boolean) => {
        console.log('[P2P Context] Message:', msg.type, asHost ? '(host)' : '(player)');

        if (asHost) {
            // Host processes all game logic
            engineRef.current.handleMessage(msg);
        } else {
            // Player just receives state updates
            switch (msg.type) {
                case 'game:state':
                    setGameState(msg.payload as GameState);
                    break;
                case 'game:numberCalled':
                    // Could trigger audio here
                    break;
            }
        }
    }, []);

    // ========================================================================
    // GAME ACTIONS
    // ========================================================================

    const leaveRoom = useCallback(() => {
        if (connectionRef.current.isConnected()) {
            connectionRef.current.send({
                type: 'player:leave',
                senderId: playerId || '',
                timestamp: Date.now(),
            });
        }
        connectionRef.current.disconnect();
        engineRef.current.destroy();

        setIsConnected(false);
        setIsHost(false);
        setRoomCode('');
        setGameState(null);
        setPlayerId(null);
        setPlayerName('');
        setError(null);
        setHasSavedSession(false);
    }, [playerId]);

    const startGame = useCallback(() => {
        if (isHost) {
            engineRef.current.startGame();
        }
    }, [isHost]);

    const markCell = useCallback((cardId: string, row: number, col: number) => {
        if (isHost) {
            engineRef.current.markCell(playerId || '', cardId, row, col);
        } else {
            connectionRef.current.send({
                type: 'game:markCell',
                payload: { cardId, row, col },
                senderId: playerId || '',
                timestamp: Date.now(),
            });
        }
    }, [isHost, playerId]);

    const claimWin = useCallback((cardId: string) => {
        if (isHost) {
            engineRef.current.claimWin(playerId || '', cardId);
        } else {
            connectionRef.current.send({
                type: 'game:claimWin',
                payload: { cardId },
                senderId: playerId || '',
                timestamp: Date.now(),
            });
        }
    }, [isHost, playerId]);

    const pauseGame = useCallback(() => {
        if (isHost) {
            engineRef.current.pauseGame();
        }
    }, [isHost]);

    const resumeGame = useCallback(() => {
        if (isHost) {
            engineRef.current.resumeGame();
        }
    }, [isHost]);

    const restartGame = useCallback(() => {
        if (isHost) {
            engineRef.current.restartGame();
        }
    }, [isHost]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            connectionRef.current.disconnect();
            engineRef.current.destroy();
        };
    }, []);

    // ========================================================================
    // CONTEXT VALUE
    // ========================================================================

    const value: P2PContextType = {
        isConnected,
        isHost,
        roomCode,
        error,
        hasSavedSession,
        gameState,
        playerId,
        playerName,
        createRoom,
        joinRoom,
        rejoinSession,
        leaveRoom,
        startGame,
        markCell,
        claimWin,
        pauseGame,
        resumeGame,
        restartGame,
        clearError,
    };

    return <P2PContext.Provider value={value}>{children}</P2PContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useP2PGame() {
    const context = useContext(P2PContext);
    if (!context) {
        throw new Error('useP2PGame must be used within a P2PProvider');
    }
    return context;
}
