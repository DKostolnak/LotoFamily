import { describe, expect, it } from 'vitest';
import {
    addPlayer,
    callNextNumber,
    claimFlat,
    createGame,
    generatePlayerId,
    generateRoomCode,
    setWinner,
    startGame,
} from '../gameEngine';
import { POINTS } from '@/lib/constants';
import type { LotoCard, LotoCell } from '@/lib/types';

function buildRow(values: Array<number | null>): LotoCell[] {
    return values.map((value) => ({ value, isMarked: value !== null }));
}

describe('gameEngine', () => {
    it('generates uppercase room codes of expected length', () => {
        const code = generateRoomCode();
        expect(code).toHaveLength(6);
        expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('creates games with merged settings and host player', () => {
        const game = createGame('host-1', 'Host', '🐻', { crazyMode: true, maxPlayers: 6 });
        expect(game.players).toHaveLength(1);
        expect(game.settings.crazyMode).toBe(true);
        expect(game.settings.maxPlayers).toBe(6);
        expect(game.players[0].isHost).toBe(true);
    });

    it('calls next number and reduces pool size', () => {
        let game = createGame('host-1', 'Host', '🐻');
        game = startGame(game);
        const initialRemaining = game.remainingNumbers.length;
        game = callNextNumber(game);
        expect(game.currentNumber).not.toBeNull();
        expect(game.remainingNumbers.length).toBe(initialRemaining - 1);
        expect(game.calledNumbers).toHaveLength(1);
    });

    it('awards points to winner when setWinner is invoked', () => {
        let game = createGame('host-1', 'Host', '🐻');
        game = addPlayer(game, 'player-2', 'Player', '🦊')!;
        game = startGame(game);
        const before = game.players[1].score;
        const updated = setWinner(game, game.players[1].id);
        expect(updated.players[1].score).toBe(before + POINTS.WIN);
        expect(updated.phase).toBe('finished');
    });

    it('allows claiming flat rewards when row is completed', () => {
        let game = createGame('host-1', 'Host', '🐻');
        game = startGame(game);
        const host = game.players[0];
        const completedRow = buildRow([1, 12, 23, 34, 45, 56, 67, 78, 89]);
        const emptyRow = buildRow(Array(9).fill(null));
        const testCard: LotoCard = {
            id: 'card-test',
            playerId: host.id,
            grid: [completedRow, emptyRow, emptyRow],
        };

        game.phase = 'playing';
        game.players[0] = {
            ...host,
            cards: [testCard],
            collectedFlats: [],
        };
        game.calledNumbers = completedRow
            .filter((cell) => cell.value !== null)
            .map((cell) => ({
                value: cell.value!,
                timestamp: Date.now() - 1000,
            }));

        const updated = claimFlat(game, host.id, 1);
        const updatedPlayer = updated.players.find((p) => p.id === host.id)!;

        expect(updatedPlayer.collectedFlats).toContain(1);
        expect(updatedPlayer.score).toBe(POINTS.FLAT_1 + POINTS.FLAT_1_FIRST_BONUS);
        expect(updated.flatWinners.flat1).toBe(host.id);
    });

    it('generates stable player IDs', () => {
        const id = generatePlayerId();
        expect(id.startsWith('player_')).toBe(true);
        expect(id.length).toBeGreaterThan(8);
    });
});
