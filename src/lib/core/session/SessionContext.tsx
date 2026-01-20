import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { LotoGameModule } from '../../game-modules/loto/logic/LotoEngine';
import { lotoP2PConnection } from '../../p2p/peerConnection';
import { socketService } from '../../services/socket';
import { NetworkMessage } from '../network/types';
import { GameState } from '../../types';

export type GameMode = 'online' | 'p2p' | 'offline';

interface GameSessionContextType {
    mode: GameMode;
    gameState: GameState | null;
    isConnected: boolean;
    isHost: boolean;
    roomCode: string;
    error: string | null;

    // Actions
    setupSession: (mode: GameMode, config: any) => Promise<void>;
    leaveSession: () => void;
    performAction: (type: string, payload: any) => void;
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

export function GameSessionProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<GameMode>('offline');
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [roomCode, setRoomCode] = useState('');

    const engineRef = useRef<LotoGameModule | null>(null);

    const setupSession = async (newMode: GameMode, config: any) => {
        setMode(newMode);
        setError(null);

        if (newMode === 'p2p') {
            await setupP2PSession(config);
        } else if (newMode === 'online') {
            setupOnlineSession(config);
        } else {
            setupOfflineSession(config);
        }
    };

    const setupP2PSession = async (config: any) => {
        const { player, roomCode: code, isHost: host } = config;
        setIsHost(host);
        setRoomCode(code);

        if (host) {
            engineRef.current = new LotoGameModule();
            engineRef.current.initialize({ host: player, roomCode: code, settings: config.settings });
            engineRef.current.onStateChange(setGameState);
            engineRef.current.setBroadcastCallback((msg) => lotoP2PConnection.broadcast(msg));
            await lotoP2PConnection.hostLotoRoom(player, code);
        } else {
            await lotoP2PConnection.joinLotoRoom(player, code);
            lotoP2PConnection.subscribe((msg) => {
                if (msg.type === 'GAME:STATE_UPDATE') setGameState(msg.payload as GameState);
            });
        }
    };

    const setupOnlineSession = (config: any) => {
        setIsHost(false); // Managed by server
        socketService.connect();
        // Socket listeners would update state here...
    };

    const setupOfflineSession = (config: any) => {
        setIsHost(true);
        engineRef.current = new LotoGameModule();
        const state = engineRef.current.initialize({ host: config.player, roomCode: 'LOCAL', settings: config.settings });
        setGameState(state);
        engineRef.current.onStateChange(setGameState);
    };

    const leaveSession = () => {
        lotoP2PConnection.disconnect();
        socketService.disconnect();
        engineRef.current?.destroy();
        engineRef.current = null;
        setGameState(null);
    };

    const performAction = (type: string, payload: any) => {
        if (mode === 'p2p') {
            if (isHost) {
                engineRef.current?.handleMessage({ type, payload, senderId: 'me', timestamp: Date.now() });
            } else {
                lotoP2PConnection.send({ type, payload, senderId: 'me', timestamp: Date.now() });
            }
        } else if (mode === 'online') {
            // Map generic actions to socket emits
            if (type === 'GAME:MARK_CELL') socketService.markCell(payload.cardId, payload.row, payload.col);
        }
    };

    return (
        <GameSessionContext.Provider value={{
            mode, gameState, isConnected: !!gameState, isHost, roomCode, error,
            setupSession, leaveSession, performAction
        }}>
            {children}
        </GameSessionContext.Provider>
    );
}

export const useGameSession = () => {
    const context = useContext(GameSessionContext);
    if (!context) throw new Error('useGameSession must be used within GameSessionProvider');
    return context;
};
