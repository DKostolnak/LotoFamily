// @ts-ignore
import Peer, { DataConnection } from 'peerjs';
import { INetworkProvider, NetworkMessage, ConnectionState, NetworkPlayer } from './types';

/**
 * Modular P2P Provider using PeerJS
 * Can be reused for any game by changing the namespace and messages.
 */
export class P2PProvider implements INetworkProvider {
    private peer: any | null = null;
    private connections: Map<string, any> = new Map();
    private state: ConnectionState = {
        isConnected: false,
        isConnecting: false,
        isHost: false,
        error: null,
        roomCode: null,
    };
    private subscribers: Set<(message: NetworkMessage) => void> = new Set();
    private playerInfo: NetworkPlayer | null = null;
    private namespace: string;

    constructor(namespace: string = 'game-app') {
        this.namespace = namespace;
    }

    async connect(config: { player: NetworkPlayer, roomCode?: string, isHost: boolean }): Promise<void> {
        this.state.isConnecting = true;
        this.state.isHost = config.isHost;
        this.playerInfo = config.player;

        const peerId = config.isHost
            ? `${this.namespace}-${config.roomCode}`
            : `${this.namespace}-${config.roomCode}-${config.player.id.slice(0, 8)}`;

        return new Promise((resolve, reject) => {
            try {
                // In a real mobile app, we might use a custom STUN/TURN server
                this.peer = new Peer(peerId, {
                    debug: 1,
                });

                this.peer.on('open', (id: string) => {
                    this.state.isConnected = true;
                    this.state.isConnecting = false;
                    this.state.roomCode = config.roomCode || null;

                    if (!config.isHost) {
                        this.connectToHost(`${this.namespace}-${config.roomCode}`)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        resolve();
                    }
                });

                this.peer.on('connection', (conn: any) => {
                    this.handleIncomingConnection(conn);
                });

                this.peer.on('error', (err: any) => {
                    this.state.error = err.message;
                    this.state.isConnecting = false;
                    reject(err);
                });

            } catch (error: any) {
                this.state.error = error.message;
                this.state.isConnecting = false;
                reject(error);
            }
        });
    }

    private async connectToHost(hostId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.peer) return reject('Peer not initialized');

            const conn = this.peer.connect(hostId, {
                reliable: true,
                metadata: { player: this.playerInfo }
            });

            conn.on('open', () => {
                this.connections.set('host', conn);
                this.setupConnection(conn, 'host');
                resolve();
            });

            conn.on('error', (err: any) => reject(err));
        });
    }

    private handleIncomingConnection(conn: any) {
        conn.on('open', () => {
            const remoteId = conn.metadata?.player?.id || conn.peer;
            this.connections.set(remoteId, conn);
            this.setupConnection(conn, remoteId);

            this.notifySubscribers({
                type: 'SYSTEM:PLAYER_CONNECTED',
                payload: conn.metadata?.player,
                senderId: remoteId,
                timestamp: Date.now()
            });
        });
    }

    private setupConnection(conn: any, id: string) {
        conn.on('data', (data: any) => {
            const message = data as NetworkMessage;
            this.notifySubscribers(message);

            if (this.state.isHost && message.type !== 'SYSTEM:SYNC') {
                this.broadcast(message, id);
            }
        });

        conn.on('close', () => {
            this.connections.delete(id);
            this.notifySubscribers({
                type: 'SYSTEM:PLAYER_DISCONNECTED',
                payload: { id },
                senderId: id,
                timestamp: Date.now()
            });
        });
    }

    disconnect(): void {
        this.connections.forEach(c => c.close());
        this.connections.clear();
        this.peer?.destroy();
        this.peer = null;
        this.state = {
            isConnected: false,
            isConnecting: false,
            isHost: false,
            error: null,
            roomCode: null,
        };
    }

    send(message: NetworkMessage): void {
        if (this.state.isHost) {
            this.broadcast(message);
        } else {
            const hostConn = this.connections.get('host');
            if (hostConn?.open) {
                hostConn.send(message);
            }
        }
    }

    broadcast(message: NetworkMessage, excludeId?: string): void {
        this.connections.forEach((conn, id) => {
            if (conn.open && id !== excludeId) {
                conn.send(message);
            }
        });
    }

    subscribe(callback: (message: NetworkMessage) => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notifySubscribers(message: NetworkMessage) {
        this.subscribers.forEach(sub => sub(message));
    }

    getState(): ConnectionState {
        return { ...this.state };
    }
}
