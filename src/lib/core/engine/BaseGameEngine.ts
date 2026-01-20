import { NetworkMessage, NetworkPlayer } from '../network/types';

/**
 * Base Game Engine Class
 * Provides core logic for multiplayer 2D games:
 * - Player management
 * - Game phase management
 * - Event-based architecture
 */
export abstract class BaseGameEngine<TState = any> {
    protected state: TState | null = null;
    protected players: Map<string, NetworkPlayer> = new Map();
    protected hostId: string | null = null;

    private onStateChangeListeners: Set<(state: TState) => void> = new Set();

    constructor() { }

    /**
     * Initialize the game state
     */
    abstract initialize(config: any): TState;

    /**
     * Handle incoming network messages
     */
    abstract handleMessage(message: NetworkMessage): void;

    /**
     * Update the game state
     */
    protected updateState(updater: (state: TState) => TState): void {
        if (!this.state) return;
        this.state = updater(this.state);
        this.notifyStateChange();
    }

    /**
     * Synchronize state manually
     */
    protected setState(newState: TState): void {
        this.state = newState;
        this.notifyStateChange();
    }

    /**
     * Add a player to the internal map
     */
    public addPlayer(player: NetworkPlayer): void {
        this.players.set(player.id, player);
    }

    /**
     * Remove a player from the internal map
     */
    public removePlayer(playerId: string): void {
        this.players.delete(playerId);
    }

    /**
     * Get reference to all players
     */
    public getPlayers(): NetworkPlayer[] {
        return Array.from(this.players.values());
    }

    /**
     * Subscribe to state changes
     */
    public onStateChange(callback: (state: TState) => void): () => void {
        this.onStateChangeListeners.add(callback);
        if (this.state) callback(this.state);
        return () => this.onStateChangeListeners.delete(callback);
    }

    private notifyStateChange(): void {
        if (this.state) {
            this.onStateChangeListeners.forEach(listener => listener(this.state!));
        }
    }

    public getState(): TState | null {
        return this.state;
    }
}
