'use client';

/**
 * P2P Game Engine
 * 
 * Client-side game logic for peer-to-peer mode.
 * The host runs this engine and broadcasts state to all players.
 */

import type { GameState, Player, GameSettings, LotoCard, CalledNumber } from '../types';
import { generateCards } from '../../engine/lotoCardGenerator';
import { P2PMessage, P2PPlayer } from './peerConnection';

// ============================================================================
// TYPES
// ============================================================================

export interface P2PGameState extends Omit<GameState, 'serverUrl'> {
    isP2P: true;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_SETTINGS: GameSettings = {
    gameMode: 'classic',
    maxPlayers: 6,
    cardsPerPlayer: 1,
    autoCallEnabled: true,
    autoCallIntervalMs: 5000,
    language: 'en',
    crazyMode: false,
};

// ============================================================================
// P2P GAME ENGINE
// ============================================================================

export class P2PGameEngine {
    private state: P2PGameState | null = null;
    private autoCallInterval: ReturnType<typeof setInterval> | null = null;
    private onStateChange: ((state: P2PGameState) => void) | null = null;
    private onBroadcast: ((message: P2PMessage) => void) | null = null;

    /**
     * Initialize a new game as host
     */
    createGame(hostPlayer: P2PPlayer, roomCode: string, settings?: Partial<GameSettings>): P2PGameState {
        const now = Date.now();
        const hostId = hostPlayer.id;

        // Generate card for host
        const hostCards = this.generateCardsInternal(hostId, settings?.cardsPerPlayer || 1);

        const player: Player = {
            id: hostId,
            name: hostPlayer.name,
            avatarUrl: hostPlayer.avatarUrl,
            cards: hostCards,
            isHost: true,
            isConnected: true,
            collectedFlats: [],
            score: 0,
        };

        this.state = {
            isP2P: true,
            roomId: `p2p-${roomCode}`,
            roomCode: roomCode,
            phase: 'lobby',
            settings: { ...DEFAULT_SETTINGS, ...settings },
            players: [player],
            calledNumbers: [],
            currentNumber: null,
            remainingNumbers: this.initializeNumberPool(),
            winnerId: null,
            hostId: hostId,
            createdAt: now,
            flatWinners: { flat1: null, flat2: null },
        };

        this.notifyStateChange();
        return this.state;
    }

    /**
     * Add a player to the game
     */
    addPlayer(player: P2PPlayer): Player | null {
        if (!this.state || this.state.phase !== 'lobby') return null;
        if (this.state.players.length >= this.state.settings.maxPlayers) return null;

        // Check if player already exists
        if (this.state.players.find(p => p.id === player.id)) return null;

        // Generate cards for new player
        const cards = this.generateCardsInternal(player.id, this.state.settings.cardsPerPlayer);

        const newPlayer: Player = {
            id: player.id,
            name: player.name,
            avatarUrl: player.avatarUrl,
            cards: cards,
            isHost: false,
            isConnected: true,
            collectedFlats: [],
            score: 0,
        };

        this.state.players.push(newPlayer);
        this.notifyStateChange();

        return newPlayer;
    }

    /**
     * Remove a player from the game
     */
    removePlayer(playerId: string): void {
        if (!this.state) return;

        this.state.players = this.state.players.filter(p => p.id !== playerId);
        this.notifyStateChange();
    }

    /**
     * Start the game
     */
    startGame(): void {
        if (!this.state || this.state.phase !== 'lobby') return;
        if (this.state.players.length < 1) return; // At least host

        this.state.phase = 'playing';
        this.state.startedAt = Date.now();
        this.state.remainingNumbers = this.initializeNumberPool();
        this.state.calledNumbers = [];
        this.state.currentNumber = null;

        // Reset player cards
        this.state.players = this.state.players.map(p => ({
            ...p,
            cards: this.generateCardsInternal(p.id, this.state!.settings.cardsPerPlayer),
            collectedFlats: [],
            score: 0,
        }));

        this.notifyStateChange();

        // Start auto-call if enabled
        if (this.state.settings.autoCallEnabled) {
            this.startAutoCall();
        }
    }

    /**
     * Call the next number
     */
    callNextNumber(): number | null {
        if (!this.state || this.state.phase !== 'playing') return null;
        if (this.state.remainingNumbers.length === 0) return null;

        const [nextNumber, ...remaining] = this.state.remainingNumbers;

        const calledNumber: CalledNumber = {
            value: nextNumber,
            timestamp: Date.now(),
        };

        this.state.currentNumber = nextNumber;
        this.state.calledNumbers.push(calledNumber);
        this.state.remainingNumbers = remaining;

        this.notifyStateChange();

        // Broadcast number called
        this.broadcast({
            type: 'game:numberCalled',
            payload: nextNumber,
            senderId: this.state.hostId,
            timestamp: Date.now(),
        });

        return nextNumber;
    }

    /**
     * Mark a cell on a player's card
     */
    markCell(playerId: string, cardId: string, row: number, col: number): boolean {
        if (!this.state || this.state.phase !== 'playing') return false;

        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return false;

        const card = player.cards.find(c => c.id === cardId);
        if (!card) return false;

        const cell = card.grid[row]?.[col];
        if (!cell || cell.value === null) return false;

        // Check if number has been called
        const isCalled = this.state.calledNumbers.some(cn => cn.value === cell.value);

        if (isCalled && !cell.isMarked) {
            cell.isMarked = true;
            this.notifyStateChange();
            return true;
        } else if (cell.isMarked) {
            // Unmark
            cell.isMarked = false;
            this.notifyStateChange();
            return true;
        }

        return false;
    }

    /**
     * Claim a win
     */
    claimWin(playerId: string, cardId: string): boolean {
        if (!this.state || this.state.phase !== 'playing') return false;

        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return false;

        const card = player.cards.find(c => c.id === cardId);
        if (!card) return false;

        // Check if all numbers are marked correctly
        const isWin = this.checkCardComplete(card);

        if (isWin) {
            this.state.winnerId = playerId;
            this.state.phase = 'finished';
            this.stopAutoCall();
            this.notifyStateChange();
            return true;
        }

        return false;
    }

    /**
     * Pause the game
     */
    pauseGame(): void {
        if (!this.state || this.state.phase !== 'playing') return;

        this.state.phase = 'paused';
        this.stopAutoCall();
        this.notifyStateChange();
    }

    /**
     * Resume the game
     */
    resumeGame(): void {
        if (!this.state || this.state.phase !== 'paused') return;

        this.state.phase = 'playing';
        if (this.state.settings.autoCallEnabled) {
            this.startAutoCall();
        }
        this.notifyStateChange();
    }

    /**
     * Restart the game
     */
    restartGame(): void {
        if (!this.state) return;

        this.stopAutoCall();
        this.state.phase = 'lobby';
        this.state.winnerId = null;
        this.state.currentNumber = null;
        this.state.calledNumbers = [];
        this.state.remainingNumbers = this.initializeNumberPool();
        this.state.flatWinners = { flat1: null, flat2: null };
        this.state.startedAt = undefined;

        this.notifyStateChange();
    }

    /**
     * Get current state
     */
    getState(): P2PGameState | null {
        return this.state;
    }

    /**
     * Set state change handler
     */
    setOnStateChange(handler: (state: P2PGameState) => void): void {
        this.onStateChange = handler;
    }

    /**
     * Set broadcast handler
     */
    setOnBroadcast(handler: (message: P2PMessage) => void): void {
        this.onBroadcast = handler;
    }

    /**
     * Handle incoming message from peer
     */
    handleMessage(message: P2PMessage): void {
        if (!this.state) return;

        switch (message.type) {
            case 'game:markCell': {
                const { cardId, row, col } = message.payload as { cardId: string; row: number; col: number };
                this.markCell(message.senderId, cardId, row, col);
                break;
            }
            case 'game:claimWin': {
                const { cardId } = message.payload as { cardId: string };
                this.claimWin(message.senderId, cardId);
                break;
            }
            case 'player:leave': {
                this.removePlayer(message.senderId);
                break;
            }
        }
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.stopAutoCall();
        this.state = null;
        this.onStateChange = null;
        this.onBroadcast = null;
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    private notifyStateChange(): void {
        if (this.state && this.onStateChange) {
            this.onStateChange({ ...this.state });
        }
    }

    private broadcast(message: P2PMessage): void {
        if (this.onBroadcast) {
            this.onBroadcast(message);
        }
    }

    private generateCardsInternal(playerId: string, count: number): LotoCard[] {
        return generateCards(playerId, count);
    }

    private initializeNumberPool(): number[] {
        const numbers = Array.from({ length: 90 }, (_, i) => i + 1);
        // Fisher-Yates shuffle
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        return numbers;
    }

    private checkCardComplete(card: LotoCard): boolean {
        // Check if all non-null cells are marked with called numbers
        for (const row of card.grid) {
            for (const cell of row) {
                if (cell.value !== null) {
                    if (!cell.isMarked) return false;
                    // Verify the number was actually called
                    const wasCalled = this.state?.calledNumbers.some(cn => cn.value === cell.value);
                    if (!wasCalled) return false;
                }
            }
        }
        return true;
    }

    private startAutoCall(): void {
        if (!this.state) return;

        this.stopAutoCall();

        this.autoCallInterval = setInterval(() => {
            if (this.state?.phase === 'playing') {
                const number = this.callNextNumber();
                if (number === null || this.state.remainingNumbers.length === 0) {
                    this.stopAutoCall();
                }
            }
        }, this.state.settings.autoCallIntervalMs);
    }

    private stopAutoCall(): void {
        if (this.autoCallInterval) {
            clearInterval(this.autoCallInterval);
            this.autoCallInterval = null;
        }
    }
}

// Export singleton
export const p2pGameEngine = new P2PGameEngine();
