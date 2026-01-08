import type { GameState } from '../types';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface GameClientState {
    connectionStatus: ConnectionStatus;
    gameState: GameState | null;
    playerId: string | null;
    playerName: string | null;
    playerAvatar: string;
    error: string | null;
    lastRoomCode: string | null;
    wasDisconnected: boolean;
}

export type GameClientAction =
    | { type: 'setConnectionStatus'; status: ConnectionStatus }
    | { type: 'setGameState'; gameState: GameState | null }
    | { type: 'setPlayerId'; playerId: string | null }
    | { type: 'setPlayerName'; playerName: string | null }
    | { type: 'setPlayerAvatar'; playerAvatar: string }
    | { type: 'setError'; error: string | null }
    | { type: 'setLastRoomCode'; roomCode: string | null }
    | { type: 'setWasDisconnected'; wasDisconnected: boolean };

export const DEFAULT_AVATARS = ['🐻', '🦊', '🐱', '🐼', '🦁', '🐯', '🐨', '🐸'] as const;

export const initialGameClientState: GameClientState = {
    connectionStatus: 'idle',
    gameState: null,
    playerId: null,
    playerName: null,
    playerAvatar: DEFAULT_AVATARS[0],
    error: null,
    lastRoomCode: null,
    wasDisconnected: false,
};

export function gameClientReducer(state: GameClientState, action: GameClientAction): GameClientState {
    switch (action.type) {
        case 'setConnectionStatus':
            return { ...state, connectionStatus: action.status };
        case 'setGameState':
            return { ...state, gameState: action.gameState };
        case 'setPlayerId':
            return { ...state, playerId: action.playerId };
        case 'setPlayerName':
            return { ...state, playerName: action.playerName };
        case 'setPlayerAvatar':
            return { ...state, playerAvatar: action.playerAvatar };
        case 'setError':
            return { ...state, error: action.error };
        case 'setLastRoomCode':
            return { ...state, lastRoomCode: action.roomCode };
        case 'setWasDisconnected':
            return { ...state, wasDisconnected: action.wasDisconnected };
        default:
            return state;
    }
}
