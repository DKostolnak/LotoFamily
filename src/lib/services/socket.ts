/**
 * Socket Service - Real-time multiplayer connection
 * 
 * Provides a type-safe Socket.io client for React Native.
 * Handles connection lifecycle, reconnection, and event management.
 */

import { io, Socket } from 'socket.io-client';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    GameSettings,
} from '@/lib/types';
import { k_serverUrl } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface ConnectionConfig {
    serverUrl: string;
    autoConnect?: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface SocketServiceState {
    socket: GameSocket | null;
    status: ConnectionStatus;
    serverUrl: string | null;
    error: string | null;
    reconnectAttempt: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/** Default server URL for local development */
const k_defaultServerUrl = k_serverUrl;

/** Reconnection attempts before giving up */
const k_maxReconnectAttempts = 5;

/** Base delay between reconnection attempts (ms) */
const k_reconnectDelayMs = 1000;

// ============================================================================
// SOCKET SERVICE CLASS
// ============================================================================

/**
 * Singleton socket service for managing the game connection.
 * 
 * Usage:
 * ```typescript
 * const socket = socketService.connect('http://localhost:3000');
 * socket.emit('room:create', playerName, avatar, settings);
 * ```
 */
class SocketService {
    private static m_instance: SocketService;
    private m_socket: GameSocket | null = null;
    private m_status: ConnectionStatus = 'disconnected';
    private m_serverUrl: string | null = null;
    private m_error: string | null = null;
    private m_reconnectAttempt: number = 0;
    private m_listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): SocketService {
        if (!SocketService.m_instance) {
            SocketService.m_instance = new SocketService();
        }
        return SocketService.m_instance;
    }

    // ========================================================================
    // CONNECTION MANAGEMENT
    // ========================================================================

    /**
     * Connect to the game server
     */
    public connect(serverUrl: string = k_defaultServerUrl): GameSocket {
        // If already connected to same server, return existing socket
        if (this.m_socket?.connected && this.m_serverUrl === serverUrl) {
            return this.m_socket;
        }

        // Disconnect existing connection if any
        this.disconnect();

        this.m_serverUrl = serverUrl;
        this.m_status = 'connecting';
        this.m_error = null;

        this.m_socket = io(serverUrl, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: k_maxReconnectAttempts,
            reconnectionDelay: k_reconnectDelayMs,
            reconnectionDelayMax: k_reconnectDelayMs * 5,
            timeout: 10000,
        });

        this.setupConnectionListeners();

        return this.m_socket;
    }

    /**
     * Disconnect from the server
     */
    public disconnect(): void {
        if (this.m_socket) {
            this.m_socket.removeAllListeners();
            this.m_socket.disconnect();
            this.m_socket = null;
        }
        this.m_status = 'disconnected';
        this.m_serverUrl = null;
        this.m_error = null;
    }

    /**
     * Get the current socket instance
     */
    public getSocket(): GameSocket | null {
        return this.m_socket;
    }

    /**
     * Get connection status
     */
    public getStatus(): ConnectionStatus {
        return this.m_status;
    }

    /**
     * Check if connected
     */
    public isConnected(): boolean {
        return this.m_status === 'connected' && this.m_socket?.connected === true;
    }

    /**
     * Get current state
     */
    public getState(): SocketServiceState {
        return {
            socket: this.m_socket,
            status: this.m_status,
            serverUrl: this.m_serverUrl,
            error: this.m_error,
            reconnectAttempt: this.m_reconnectAttempt,
        };
    }

    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================

    private setupConnectionListeners(): void {
        if (!this.m_socket) return;

        this.m_socket.on('connect', () => {
            console.log('[Socket] Connected to server');
            this.m_status = 'connected';
            this.m_error = null;
            this.notifyListeners('connection', true);
        });

        this.m_socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            this.m_status = 'disconnected';
            this.notifyListeners('connection', false);
        });

        this.m_socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
            this.m_status = 'error';
            this.m_error = error.message;
            this.notifyListeners('error', error.message);
        });

        // Server info event
        this.m_socket.on('server:info', (url) => {
            console.log('[Socket] Server URL:', url);
            this.m_serverUrl = url;
        });

        // Error event
        this.m_socket.on('error', (error) => {
            console.error('[Socket] Server error:', error.message);
            this.m_error = error.message;
            this.notifyListeners('error', error.message);
        });
    }

    // ========================================================================
    // LISTENER MANAGEMENT
    // ========================================================================

    /**
     * Subscribe to service events (connection, error, etc.)
     */
    public subscribe(event: string, callback: (...args: unknown[]) => void): () => void {
        if (!this.m_listeners.has(event)) {
            this.m_listeners.set(event, new Set());
        }
        this.m_listeners.get(event)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.m_listeners.get(event)?.delete(callback);
        };
    }

    private notifyListeners(event: string, ...args: unknown[]): void {
        this.m_listeners.get(event)?.forEach(callback => callback(...args));
    }

    // ========================================================================
    // GAME ACTIONS (Convenience methods)
    // ========================================================================

    /**
     * Create a new game room
     */
    public createRoom(
        playerName: string,
        avatar: string,
        settings: Partial<GameSettings>,
        token?: string
    ): void {
        this.m_socket?.emit('room:create', { playerName, avatar, settings, token });
    }

    /**
     * Join an existing room
     */
    public joinRoom(
        roomCode: string,
        playerName: string,
        avatar: string,
        token?: string
    ): void {
        this.m_socket?.emit('room:join', { roomCode, playerName, avatar, token });
    }

    /**
     * Leave the current room
     */
    public leaveRoom(): void {
        this.m_socket?.emit('room:leave');
    }

    /**
     * Start the game (host only)
     */
    public startGame(options?: { autoCallIntervalMs: number }): void {
        this.m_socket?.emit('game:start', options);
    }

    /**
     * Send a chat message to the room
     */
    public sendChatMessage(roomId: string, message: string): void {
        this.m_socket?.emit('room:chat' as any, { roomId, message });
    }

    /**
     * Call the next number (host only)
     */
    public callNumber(): void {
        this.m_socket?.emit('game:callNumber');
    }

    /**
     * Mark a cell on player's card
     */
    public markCell(cardId: string, row: number, col: number): void {
        this.m_socket?.emit('game:markCell', cardId, row, col);
    }

    /**
     * Claim win (full card)
     */
    public claimWin(cardId: string): void {
        this.m_socket?.emit('game:claimWin', cardId);
    }

    /**
     * Claim flat bonus
     */
    public claimFlat(flatType: number): void {
        this.m_socket?.emit('game:claimFlat', flatType);
    }

    /**
     * Pause game (host only)
     */
    public pauseGame(): void {
        this.m_socket?.emit('game:pause');
    }

    /**
     * Resume game (host only)
     */
    public resumeGame(): void {
        this.m_socket?.emit('game:resume');
    }

    /**
     * Restart game (host only)
     */
    public restartGame(): void {
        this.m_socket?.emit('game:restart');
    }
}

// Export singleton instance
export const socketService = SocketService.getInstance();

// Export class for testing
export { SocketService };
