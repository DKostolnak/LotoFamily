import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    useRef,
    type ReactNode,
} from 'react';
import { lotoP2PConnection, P2PPlayer } from './peerConnection';
import { LotoGameModule } from '../game-modules/loto/logic/LotoEngine';
import type { GameState, GameSettings } from '../types';
import { NetworkMessage } from '../core/network/types';

interface P2PContextType {
    isConnected: boolean;
    isHost: boolean;
    roomCode: string;
    error: string | null;
    gameState: GameState | null;
    playerId: string | null;
    playerName: string;

    createRoom: (playerName: string, avatar?: string, settings?: Partial<GameSettings>) => Promise<string>;
    joinRoom: (roomCode: string, playerName: string, avatar?: string) => Promise<void>;
    leaveRoom: () => void;
    startGame: () => void;
    markCell: (cardId: string, row: number, col: number) => void;
    claimWin: (cardId: string) => void;
    pauseGame: () => void;
    resumeGame: () => void;
    restartGame: () => void;
    clearError: () => void;
}

const P2PContext = createContext<P2PContextType | undefined>(undefined);

export function P2PProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState('');

    const engineRef = useRef(new LotoGameModule());
    const connection = lotoP2PConnection;

    // Handle incoming P2P messages
    const handleMessage = useCallback((msg: NetworkMessage) => {
        if (msg.type === 'GAME:STATE_UPDATE') {
            setGameState(msg.payload as GameState);
        } else if (msg.type === 'GAME:NUMBER_CALLED') {
            // Number called logic (sound triggers, etc.)
        }

        // Pass to engine if host
        if (lotoP2PConnection.getState().isHost) {
            engineRef.current.handleMessage(msg);
        }
    }, []);

    // Effect: Sync engine state to UI and Network
    useEffect(() => {
        const unsubscribe = engineRef.current.onStateChange((state) => {
            setGameState(state as GameState);

            // Host broadcasts state to all players
            if (lotoP2PConnection.getState().isHost) {
                lotoP2PConnection.broadcast({
                    type: 'GAME:STATE_UPDATE',
                    payload: state,
                    senderId: playerId || 'host',
                    timestamp: Date.now()
                });
            }
        });

        // Set up broadcast callback for engine
        engineRef.current.setBroadcastCallback((msg) => {
            lotoP2PConnection.broadcast(msg);
        });

        return () => unsubscribe();
    }, [playerId]);

    // Effect: Listen to network events
    useEffect(() => {
        const unsubscribe = lotoP2PConnection.subscribe(handleMessage);
        return () => unsubscribe();
    }, [handleMessage]);

    const generatePlayerId = () => 'p2p-' + Math.random().toString(36).substring(2, 10);

    const createRoom = async (name: string, avatar: string = '🐻', settings?: Partial<GameSettings>) => {
        try {
            setError(null);
            const id = generatePlayerId();
            setPlayerId(id);
            setPlayerName(name);

            const player: P2PPlayer = { id, name, avatar, isHost: true };
            const code = await lotoP2PConnection.hostLotoRoom(player);

            setRoomCode(code);
            setIsHost(true);
            setIsConnected(true);

            // Initialize game logic
            engineRef.current.initialize({ host: player, roomCode: code, settings });

            return code;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const joinRoom = async (code: string, name: string, avatar: string = '🐱') => {
        try {
            setError(null);
            const id = generatePlayerId();
            setPlayerId(id);
            setPlayerName(name);

            const player: P2PPlayer = { id, name, avatar, isHost: false };
            await lotoP2PConnection.joinLotoRoom(player, code);

            setRoomCode(code.toUpperCase());
            setIsHost(false);
            setIsConnected(true);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const leaveRoom = () => {
        lotoP2PConnection.disconnect();
        engineRef.current.destroy();
        setIsConnected(false);
        setIsHost(false);
        setGameState(null);
        setRoomCode('');
    };

    const startGame = () => engineRef.current.startGame();

    const markCell = (cardId: string, row: number, col: number) => {
        if (isHost) {
            engineRef.current.markCell(playerId!, cardId, row, col);
        } else {
            lotoP2PConnection.send({
                type: 'GAME:MARK_CELL',
                payload: { cardId, row, col },
                senderId: playerId!,
                timestamp: Date.now()
            });
        }
    };

    const claimWin = (cardId: string) => {
        if (isHost) {
            engineRef.current.claimWin(playerId!, cardId);
        } else {
            lotoP2PConnection.send({
                type: 'GAME:CLAIM_WIN',
                payload: { cardId },
                senderId: playerId!,
                timestamp: Date.now()
            });
        }
    };

    const pauseGame = () => isHost && engineRef.current.pauseGame();
    const resumeGame = () => isHost && engineRef.current.resumeGame();
    const restartGame = () => isHost && engineRef.current.restartGame();
    const clearError = () => setError(null);

    return (
        <P2PContext.Provider value={{
            isConnected, isHost, roomCode, error, gameState, playerId, playerName,
            createRoom, joinRoom, leaveRoom, startGame, markCell, claimWin,
            pauseGame, resumeGame, restartGame, clearError
        }}>
            {children}
        </P2PContext.Provider>
    );
}

export const useP2PGame = () => {
    const context = useContext(P2PContext);
    if (!context) throw new Error('useP2PGame must be used within a P2PProvider');
    return context;
};
