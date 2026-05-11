import { BaseGameEngine } from '../../../core/engine/BaseGameEngine';
import type { NetworkMessage, NetworkPlayer, GameState, Player, GameSettings, LotoCard, CalledNumber } from '../../../types';
import { generateCards } from '@/engine/lotoCardGenerator';

/**
 * LotoGameModule - The source of truth for Loto rules.
 * Transport-agnostic: can be driven by Offline, Online (Socket.io), or any local driver.
 */
export class LotoGameModule extends BaseGameEngine<GameState> {
    private autoCallInterval: ReturnType<typeof setInterval> | null = null;

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

    handleMessage(message: NetworkMessage): void {
        const { type, payload, senderId } = message;

        switch (type) {
            case 'GAME:MARK_CELL': {
                const p = payload as { cardId: string; row: number; col: number };
                this.markCell(senderId, p.cardId, p.row, p.col);
                break;
            }
            case 'GAME:CLAIM_WIN': {
                const p = payload as { cardId: string };
                this.claimWin(senderId, p.cardId);
                break;
            }
            case 'GAME:CLAIM_FLAT': {
                const p = payload as { flatType: number };
                this.claimFlat(senderId, p.flatType);
                break;
            }
        }
    }

    /**
     * Verejný updateState — potrebný pre useSupabaseGame (host pridáva hráčov)
     */
    public patchState(updater: (state: GameState) => GameState): void {
        this.updateState(updater);
    }

    public startGame() {
        if (!this.state || this.state.phase !== 'lobby') return;
        // Guard against re-entrant start: if a timer already exists we are already starting/started.
        if (this.autoCallInterval) return;
        this.updateState(s => (s.phase === 'lobby' ? { ...s, phase: 'playing', startedAt: Date.now() } : s));
        if (this.state?.settings.autoCallEnabled) this.startAutoCall();
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
            if (!isCalled) return s;

            // Fully immutable update: rebuild the affected card -> player -> players array.
            const newGrid = card.grid.map((r, ri) =>
                r.map((c, ci) => (ri === row && ci === col ? { ...c, isMarked: !c.isMarked } : c))
            );
            const newCard = { ...card, grid: newGrid };
            const newCards = player.cards.map(c => (c.id === cardId ? newCard : c));
            const newPlayer = { ...player, cards: newCards };
            const newPlayers = s.players.map(p => (p.id === playerId ? newPlayer : p));

            return { ...s, players: newPlayers };
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

    public claimFlat(playerId: string, flatType: number) {
        this.updateState(s => {
            if (flatType === 1 && !s.flatWinners.flat1) {
                return { ...s, flatWinners: { ...s.flatWinners, flat1: playerId } };
            }
            if (flatType === 2 && !s.flatWinners.flat2) {
                return { ...s, flatWinners: { ...s.flatWinners, flat2: playerId } };
            }
            return s;
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
        // Win = all numbers on the card have actually been CALLED.
        // isMarked is purely a UI convenience and must not be part of the win rule
        // (this matches gameModes.classicMode and keeps offline/online behaviour identical).
        const calledSet = new Set(called.map(c => c.value));
        return card.grid.every(row =>
            row.every(cell => cell.value === null || calledSet.has(cell.value))
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
    }

    public destroy() {
        this.stopAutoCall();
    }
}
