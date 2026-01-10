/**
 * Game Client Reducer
 * 
 * Manages client-side state for the Loto game.
 * This reducer handles state that's specific to the client,
 * not the authoritative game state which comes from the server.
 */

import type { GameState } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Socket connection status.
 */
export type ConnectionStatus =
    | 'idle'          // Initial state before connecting
    | 'connecting'    // Connection in progress
    | 'connected'     // Successfully connected
    | 'reconnecting'  // Reconnecting after disconnect
    | 'disconnected'; // Connection lost

/**
 * Client-side state structure.
 */
export interface GameClientState {
    /** Current socket connection status */
    connectionStatus: ConnectionStatus;
    /** Server-authoritative game state (null when not in a room) */
    gameState: GameState | null;
    /** Current player's socket ID */
    playerId: string | null;
    /** Current player's display name */
    playerName: string | null;
    /** Current player's avatar emoji */
    playerAvatar: string;
    /** Current error message (null if none) */
    error: string | null;
    /** Last joined room code for auto-reconnect */
    lastRoomCode: string | null;
    /** Whether player was previously disconnected (for reconnect logic) */
    wasDisconnected: boolean;
    /** Current player's coin balance */
    coins: number;
    /** Current player's Ranking Points */
    rp: number;
    /** Current player's Tier Name */
    tier: string;
    /** Latest reward received (for animation) */
    /** Latest reward received (for animation) */
    latestReward: { amount: number; reason: 'win' | 'flat' | 'participation' | 'daily'; timestamp: number } | null;
    /** Current player's inventory (unlocked items) */
    inventory: string[];
}

/**
 * Actions that can be dispatched to the reducer.
 */
export type GameClientAction =
    | { type: 'setConnectionStatus'; status: ConnectionStatus }
    | { type: 'setGameState'; gameState: GameState | null }
    | { type: 'setPlayerId'; playerId: string | null }
    | { type: 'setPlayerName'; playerName: string | null }
    | { type: 'setPlayerAvatar'; playerAvatar: string }
    | { type: 'setCoins'; coins: number }
    | { type: 'setEconomy'; coins: number; rp: number; tier: string; inventory: string[] }
    | { type: 'setLatestReward'; reward: GameClientState['latestReward'] }
    | { type: 'setError'; error: string | null }
    | { type: 'setLastRoomCode'; roomCode: string | null }
    | { type: 'setWasDisconnected'; wasDisconnected: boolean };

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Available avatar emojis.
 */
export const DEFAULT_AVATARS = [
    '🐻', '🦊', '🐱', '🐼', '🦁', '🐯', '🐨', '🐸',
    '🐣', '🦄', '🐲', '🐙', '🦋', '🐝', '🐞', '🐢'
];

export type DefaultAvatar = string;

// ============================================================================
// INITIAL STATE
// ============================================================================

/**
 * Initial client state before any actions.
 */
export const initialGameClientState: GameClientState = {
    connectionStatus: 'idle',
    gameState: null,
    playerId: null,
    playerName: null,
    playerAvatar: DEFAULT_AVATARS[0],
    error: null,
    lastRoomCode: null,
    wasDisconnected: false,
    coins: 0,
    rp: 0,
    tier: 'Bronze',
    latestReward: null,
    inventory: [],
};

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Game client state reducer.
 * Handles client-specific state updates.
 */
export function gameClientReducer(
    state: GameClientState,
    action: GameClientAction
): GameClientState {
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

        case 'setCoins':
            return { ...state, coins: action.coins };

        case 'setEconomy':
            return { ...state, coins: action.coins, rp: action.rp, tier: action.tier, inventory: action.inventory };

        case 'setLatestReward':
            return { ...state, latestReward: action.reward };

        case 'setError':
            return { ...state, error: action.error };

        case 'setLastRoomCode':
            return { ...state, lastRoomCode: action.roomCode };

        case 'setWasDisconnected':
            return { ...state, wasDisconnected: action.wasDisconnected };

        default:
            // TypeScript exhaustiveness check
            return state;
    }
}

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Check if the current player is the host.
 */
export function selectIsHost(state: GameClientState): boolean {
    return !!state.gameState && state.gameState.hostId === state.playerId;
}

/**
 * Check if the socket is connected.
 */
export function selectIsConnected(state: GameClientState): boolean {
    return state.connectionStatus === 'connected' || state.connectionStatus === 'reconnecting';
}

/**
 * Get the current player from game state.
 */
export function selectCurrentPlayer(state: GameClientState) {
    if (!state.gameState || !state.playerId) return null;
    return state.gameState.players.find(p => p.id === state.playerId) ?? null;
}

/**
 * Get other players (not the current player).
 */
export function selectOtherPlayers(state: GameClientState) {
    if (!state.gameState || !state.playerId) return [];
    return state.gameState.players.filter(p => p.id !== state.playerId);
}
