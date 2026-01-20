import { BaseGameEngine } from '../../../core/engine/BaseGameEngine';
import { NetworkMessage, NetworkPlayer } from '../../../core/network/types';
import type { GameState, Player, GameSettings, LotoCard, CalledNumber } from '../../../types';
import { generateCards } from '@/engine/lotoCardGenerator';

/**
 * LotoGameModule - The source of truth for Loto rules.
 * This can be used by P2P, Offline, or even a local server.
 */
export class LotoGameModule extends BaseGameEngine<GameState> {
    private autoCallInterval: ReturnType<typeof setInterval> | null = null;
    private broadcastCallback: ((message: NetworkMessage) => void) | null = null;

    initialize(config: { host: NetworkPlayer, roomCode: string, settings?: Partial<GameSettings> }): GameState {
        const { host, roomCode, settings } = config;

        const hostCards = generateCards(host.id, settings?.cardsPerPlayer || 1);

        const lotoPlayer: Player = {
            id: host.id,
            name: host.name,
            avatar: host.avatar || '🐻',
            cards: hostCards,
            isHost: true,
            isConnected: true,
            collectedFlats: [],
            score: 0,
        };

        const initialState: GameState = {
            roomId: `loto-${roomCode}`,
            roomCode: roomCode,
            phase: 'lobby',
            settings: {
                gameMode: 'classic',
                maxPlayers: 6,
                cardsPerPlayer: 1,
                autoCallEnabled: true,
                autoCallIntervalMs: 5000,
                language: 'en',
                crazyMode: false,
                isPublic: true,
                ...settings
            },
            players: [lotoPlayer],
            calledNumbers: [],
            currentNumber: null,
            remainingNumbers: this.generateNumberPool(),
            winnerId: null,
            hostId: host.id,
            createdAt: Date.now(),
            flatWinners: { flat1: null, flat2: null },
        };

        this.setState(initialState);
        return initialState;
    }

    setBroadcastCallback(callback: (message: NetworkMessage) => void) {
        this.broadcastCallback = callback;
    }

    handleMessage(message: NetworkMessage): void {
        const { type, payload, senderId } = message;

        switch (type) {
            case 'GAME:MARK_CELL':
                this.markCell(senderId, payload.cardId, payload.row, payload.col);
                break;
            case 'GAME:CLAIM_WIN':
                this.claimWin(senderId, payload.cardId);
                break;
        }
    }

    public startGame() {
        if (!this.state || this.state.phase !== 'lobby') return;
        this.updateState(s => ({ ...s, phase: 'playing', startedAt: Date.now() }));
        if (this.state.settings.autoCallEnabled) this.startAutoCall();
    }

    public markCell(playerId: string, cardId: string, row: number, col: number) {
        this.updateState(s => {
            const player = s.players.find(p => p.id === playerId);
            if (!player) return s;
            const card = player.cards.find(c => c.id === cardId);
            if (!card) return s;

            const cell = card.grid[row]?.[col];
            if (!cell || cell.value === null) return s;

            const isCalled = s.calledNumbers.some(cn => cn.value === cell.value);
            if (isCalled) {
                cell.isMarked = !cell.isMarked;
            }
            return { ...s };
        });
    }

    public claimWin(playerId: string, cardId: string) {
        this.updateState(s => {
            const player = s.players.find(p => p.id === playerId);
            if (!player) return s;
            const card = player.cards.find(c => c.id === cardId);
            if (!card || !this.checkWin(card, s.calledNumbers)) return s;

            this.stopAutoCall();
            return { ...s, phase: 'finished', winnerId: playerId };
        });
    }

    public pauseGame() {
        if (!this.state || this.state.phase !== 'playing') return;
        this.stopAutoCall();
        this.updateState(s => ({ ...s, phase: 'paused' }));
    }

    public resumeGame() {
        if (!this.state || this.state.phase !== 'paused') return;
        this.updateState(s => ({ ...s, phase: 'playing' }));
        if (this.state.settings.autoCallEnabled) this.startAutoCall();
    }

    public restartGame() {
        if (!this.state) return;
        this.stopAutoCall();
        this.updateState(s => ({
            ...s,
            phase: 'lobby',
            winnerId: null,
            currentNumber: null,
            calledNumbers: [],
            remainingNumbers: this.generateNumberPool(),
            flatWinners: { flat1: null, flat2: null },
            startedAt: undefined
        }));
    }

    private checkWin(card: LotoCard, called: CalledNumber[]): boolean {
        const calledSet = new Set(called.map(c => c.value));
        return card.grid.every(row =>
            row.every(cell => cell.value === null || (cell.isMarked && calledSet.has(cell.value)))
        );
    }

    private generateNumberPool(): number[] {
        return Array.from({ length: 90 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    }

    private startAutoCall() {
        this.stopAutoCall();
        this.autoCallInterval = setInterval(() => {
            if (this.state?.phase === 'playing') this.callNextNumber();
        }, this.state?.settings.autoCallIntervalMs || 5000);
    }

    private stopAutoCall() {
        if (this.autoCallInterval) { clearInterval(this.autoCallInterval); this.autoCallInterval = null; }
    }

    public callNextNumber() {
        if (!this.state || this.state.phase !== 'playing' || this.state.remainingNumbers.length === 0) return;
        const [nextNumber, ...remaining] = this.state.remainingNumbers;
        this.updateState(s => ({
            ...s,
            currentNumber: nextNumber,
            calledNumbers: [...s.calledNumbers, { value: nextNumber, timestamp: Date.now() }],
            remainingNumbers: remaining
        }));
        this.broadcastCallback?.({
            type: 'GAME:NUMBER_CALLED',
            payload: nextNumber,
            senderId: this.state.hostId,
            timestamp: Date.now()
        });
    }

    public destroy() {
        this.stopAutoCall();
    }
}
