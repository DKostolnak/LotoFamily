'use client';

/**
 * P2P Connection Module
 * 
 * Provides WebRTC peer-to-peer connectivity using PeerJS.
 * Enables offline multiplayer without a central server.
 */

import Peer, { DataConnection } from 'peerjs';

// Room code prefix to namespace our game
const PEER_PREFIX = 'loto-game-';

export type P2PMessageType =
    | 'player:join'
    | 'player:leave'
    | 'game:state'
    | 'game:start'
    | 'game:numberCalled'
    | 'game:markCell'
    | 'game:claimWin'
    | 'game:claimFlat'
    | 'game:pause'
    | 'game:resume'
    | 'game:restart'
    | 'ping'
    | 'pong';

export interface P2PMessage {
    type: P2PMessageType;
    payload?: unknown;
    senderId: string;
    timestamp: number;
}

export interface P2PPlayer {
    id: string;
    name: string;
    avatarUrl?: string;
}

export type P2PEventHandler = (message: P2PMessage) => void;
export type P2PConnectionHandler = (playerId: string, player?: P2PPlayer) => void;
export type P2PErrorHandler = (error: Error) => void;

/**
 * P2PConnection class
 * Wraps PeerJS to provide simple host/join functionality
 */
export class P2PConnection {
    private peer: Peer | null = null;
    private connections: Map<string, DataConnection> = new Map();
    private isHost: boolean = false;
    private roomCode: string = '';
    private localPlayer: P2PPlayer | null = null;

    // Event handlers
    private onMessage: P2PEventHandler | null = null;
    private onPlayerConnect: P2PConnectionHandler | null = null;
    private onPlayerDisconnect: P2PConnectionHandler | null = null;
    private onError: P2PErrorHandler | null = null;
    private onReady: (() => void) | null = null;

    /**
     * Generate a random 4-character room code
     */
    static generateRoomCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I, O to avoid confusion
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Set event handlers
     */
    setHandlers(handlers: {
        onMessage?: P2PEventHandler;
        onPlayerConnect?: P2PConnectionHandler;
        onPlayerDisconnect?: P2PConnectionHandler;
        onError?: P2PErrorHandler;
        onReady?: () => void;
    }) {
        if (handlers.onMessage) this.onMessage = handlers.onMessage;
        if (handlers.onPlayerConnect) this.onPlayerConnect = handlers.onPlayerConnect;
        if (handlers.onPlayerDisconnect) this.onPlayerDisconnect = handlers.onPlayerDisconnect;
        if (handlers.onError) this.onError = handlers.onError;
        if (handlers.onReady) this.onReady = handlers.onReady;
    }

    /**
     * Create a new room as host
     */
    async createRoom(player: P2PPlayer, roomCode?: string): Promise<string> {
        this.isHost = true;
        this.localPlayer = player;
        this.roomCode = roomCode || P2PConnection.generateRoomCode();

        const peerId = PEER_PREFIX + this.roomCode;

        return new Promise((resolve, reject) => {
            try {
                this.peer = new Peer(peerId, {
                    debug: 1, // Minimal logging
                });

                this.peer.on('open', (id) => {
                    console.log('[P2P] Host ready with ID:', id);
                    this.onReady?.();
                    resolve(this.roomCode);
                });

                this.peer.on('connection', (conn) => {
                    this.handleIncomingConnection(conn);
                });

                this.peer.on('error', (err) => {
                    console.error('[P2P] Peer error:', err);
                    if (err.type === 'unavailable-id') {
                        reject(new Error('Room code already in use. Try a different code.'));
                    } else {
                        this.onError?.(err);
                        reject(err);
                    }
                });

                this.peer.on('disconnected', () => {
                    console.log('[P2P] Disconnected from signaling server');
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Join an existing room
     */
    async joinRoom(player: P2PPlayer, roomCode: string): Promise<void> {
        this.isHost = false;
        this.localPlayer = player;
        this.roomCode = roomCode.toUpperCase();

        const hostPeerId = PEER_PREFIX + this.roomCode;

        return new Promise((resolve, reject) => {
            try {
                // Generate unique ID for this player
                const myPeerId = PEER_PREFIX + this.roomCode + '-' + player.id.slice(0, 8);

                this.peer = new Peer(myPeerId, {
                    debug: 1,
                });

                this.peer.on('open', () => {
                    console.log('[P2P] Connecting to host:', hostPeerId);

                    const conn = this.peer!.connect(hostPeerId, {
                        reliable: true,
                        metadata: { player: this.localPlayer }
                    });

                    conn.on('open', () => {
                        console.log('[P2P] Connected to host!');
                        this.connections.set('host', conn);
                        this.setupConnectionHandlers(conn, 'host');

                        // Send join message
                        this.send({
                            type: 'player:join',
                            payload: this.localPlayer,
                            senderId: player.id,
                            timestamp: Date.now(),
                        });

                        this.onReady?.();
                        resolve();
                    });

                    conn.on('error', (err) => {
                        console.error('[P2P] Connection error:', err);
                        reject(new Error('Failed to connect to room. Check the code.'));
                    });

                    // Timeout for connection
                    setTimeout(() => {
                        if (!conn.open) {
                            reject(new Error('Connection timeout. Room not found.'));
                        }
                    }, 10000);
                });

                this.peer.on('error', (err) => {
                    console.error('[P2P] Peer error:', err);
                    this.onError?.(err);
                    reject(err);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Handle incoming connection (host only)
     */
    private handleIncomingConnection(conn: DataConnection) {
        const playerId = conn.metadata?.player?.id || conn.peer;
        console.log('[P2P] Player connecting:', playerId);

        conn.on('open', () => {
            console.log('[P2P] Player connected:', playerId);
            this.connections.set(playerId, conn);
            this.setupConnectionHandlers(conn, playerId);

            const player = conn.metadata?.player as P2PPlayer;
            this.onPlayerConnect?.(playerId, player);
        });
    }

    /**
     * Set up handlers for a connection
     */
    private setupConnectionHandlers(conn: DataConnection, peerId: string) {
        conn.on('data', (data) => {
            const message = data as P2PMessage;
            console.log('[P2P] Message received:', message.type);
            this.onMessage?.(message);

            // If host, broadcast to other players
            if (this.isHost && message.type !== 'ping' && message.type !== 'pong') {
                this.broadcast(message, peerId);
            }
        });

        conn.on('close', () => {
            console.log('[P2P] Connection closed:', peerId);
            this.connections.delete(peerId);
            this.onPlayerDisconnect?.(peerId);
        });

        conn.on('error', (err) => {
            console.error('[P2P] Connection error:', peerId, err);
            this.onError?.(err);
        });
    }

    /**
     * Send a message to all connected peers (or host if player)
     */
    send(message: P2PMessage): void {
        this.connections.forEach((conn) => {
            if (conn.open) {
                conn.send(message);
            }
        });
    }

    /**
     * Broadcast message to all except sender
     */
    broadcast(message: P2PMessage, excludeId?: string): void {
        this.connections.forEach((conn, peerId) => {
            if (conn.open && peerId !== excludeId) {
                conn.send(message);
            }
        });
    }

    /**
     * Send message to specific peer
     */
    sendTo(peerId: string, message: P2PMessage): void {
        const conn = this.connections.get(peerId);
        if (conn?.open) {
            conn.send(message);
        }
    }

    /**
     * Get connection info
     */
    getInfo() {
        return {
            isHost: this.isHost,
            roomCode: this.roomCode,
            connectedPeers: Array.from(this.connections.keys()),
            localPlayer: this.localPlayer,
        };
    }

    /**
     * Disconnect and cleanup
     */
    disconnect(): void {
        console.log('[P2P] Disconnecting...');

        this.connections.forEach((conn) => {
            conn.close();
        });
        this.connections.clear();

        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        this.isHost = false;
        this.roomCode = '';
        this.localPlayer = null;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.peer !== null && !this.peer.destroyed;
    }

    /**
     * Get number of connected players
     */
    getPlayerCount(): number {
        return this.connections.size + 1; // +1 for self
    }
}

// Export singleton for easy use
export const p2pConnection = new P2PConnection();
