export interface IGameEngine<TState, TAction> {
    getState(): TState;
    onStateChange(callback: (state: TState) => void): () => void;
    handleAction(action: TAction): void;
    initialize(config: any): void;
    destroy(): void;
}

export interface GameAction {
    type: string;
    payload: any;
    senderId: string;
    timestamp: number;
}
