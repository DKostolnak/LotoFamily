/**
 * Generic Network Messaging Types
 * Can be used for both Socket.io and P2P connections.
 */

export type MessageType = string;

export interface NetworkMessage<T = any> {
    type: MessageType;
    payload: T;
    senderId: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface NetworkPlayer {
    id: string;
    name: string;
    avatar?: string;
    isHost: boolean;
    [key: string]: any;
}

export interface ConnectionState {
    isConnected: boolean;
    isConnecting: boolean;
    isHost: boolean;
    error: string | null;
    roomCode: string | null;
}

/**
 * Base Interface for any Network Provider (Socket, P2P, etc.)
 */
export interface INetworkProvider {
    connect(config: any): Promise<void>;
    disconnect(): void;
    send(message: NetworkMessage): void;
    broadcast(message: NetworkMessage): void;
    subscribe(callback: (message: NetworkMessage) => void): () => void;
    getState(): ConnectionState;
}
