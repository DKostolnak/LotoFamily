import { describe, expect, it } from '@jest/globals';
import {
  createGame,
  startGame,
  callNextNumber,
  generateRoomCode,
  addPlayer,
  removePlayer,
  autoMarkBots,
} from '../gameEngine';
import { generateLotoCard, markCell } from '../lotoCardGenerator';
import { gameModes } from '../gameModes';
import type { GameState, LotoCard } from '@/lib/types';

describe('gameEngine (mobile)', () => {
  it('generates a 6-char room code', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it('creates a lobby game with a host player', () => {
    const state = createGame('host-1', 'Host', '🙂');
    expect(state.phase).toBe('lobby');
    expect(state.players).toHaveLength(1);
    expect(state.players[0].isHost).toBe(true);
    expect(state.hostId).toBe('host-1');
    expect(state.roomCode).toHaveLength(6);
  });

  it('starts game and calls numbers uniquely', () => {
    let state = createGame('host-1', 'Host', '🙂');
    state = startGame(state);
    expect(state.phase).toBe('playing');

    const seen = new Set<number>();
    for (let i = 0; i < 10; i++) {
      state = callNextNumber(state);
      expect(typeof state.currentNumber).toBe('number');
      const num = state.currentNumber!;
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(90);
      expect(seen.has(num)).toBe(false);
      seen.add(num);
    }

    expect(state.calledNumbers).toHaveLength(10);
  });

  it('adds a non-host player with cards', () => {
    let state = createGame('host-1', 'Host', '🙂', { cardsPerPlayer: 2 });
    const next = addPlayer(state, 'p2', 'Player2', '😎');
    expect(next).not.toBeNull();
    state = next!;
    const p2 = state.players.find(p => p.id === 'p2');
    expect(p2).toBeTruthy();
    expect(p2!.isHost).toBe(false);
    expect(p2!.cards).toHaveLength(2);
  });

  describe('removePlayer', () => {
    it('reassigns host when host leaves and clears isHost on others', () => {
      let state = createGame('host-1', 'Host', '🙂');
      state = addPlayer(state, 'p2', 'Player2', '😎')!;
      state = addPlayer(state, 'p3', 'Player3', '🐱')!;

      const next = removePlayer(state, 'host-1');

      expect(next.hostId).toBe('p2');
      const hosts = next.players.filter(p => p.isHost);
      expect(hosts).toHaveLength(1);
      expect(hosts[0].id).toBe('p2');
      // No leftover host flag on others
      expect(next.players.find(p => p.id === 'p3')!.isHost).toBe(false);
    });

    it('handles last player leaving', () => {
      const state = createGame('host-1', 'Host', '🙂');
      const next = removePlayer(state, 'host-1');
      expect(next.players).toHaveLength(0);
    });
  });

  describe('autoMarkBots', () => {
    it('marks every occurrence of the current number across the bot card in one call', () => {
      // Build a bot with a hand-crafted card containing the same number twice
      // (impossible in real cards within one column, but we put it in the same card to
      // exercise the "multi-match within one card" loop logic).
      const card: LotoCard = {
        id: 'c1',
        playerId: 'bot-1',
        grid: [
          [
            { value: 7, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
          ],
          [
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
          ],
          [
            { value: 7, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
            { value: null, isMarked: false },
          ],
        ],
      };

      const state: GameState = {
        roomId: 'r1',
        roomCode: 'ABC123',
        phase: 'playing',
        settings: {
          gameMode: 'classic',
          maxPlayers: 6,
          cardsPerPlayer: 1,
          autoCallEnabled: false,
          autoCallIntervalMs: 5000,
          language: 'en',
          crazyMode: false,
          isPublic: false,
        },
        players: [
          {
            id: 'bot-1',
            name: 'Bot',
            avatar: '🤖',
            cards: [card],
            isHost: true,
            isConnected: true,
            isBot: true,
            collectedFlats: [],
            score: 0,
          },
        ],
        calledNumbers: [{ value: 7, timestamp: 1 }],
        currentNumber: 7,
        remainingNumbers: [],
        winnerId: null,
        hostId: 'bot-1',
        createdAt: 1,
        flatWinners: { flat1: null, flat2: null },
      };

      const next = autoMarkBots(state);
      const updatedCard = next.players[0].cards[0];
      expect(updatedCard.grid[0][0].isMarked).toBe(true);
      expect(updatedCard.grid[2][0].isMarked).toBe(true);
    });

    it('returns same state reference when nothing changes', () => {
      const state = startGame(createGame('h1', 'H', '🙂'));
      // No currentNumber set yet
      const next = autoMarkBots(state);
      expect(next).toBe(state);
    });
  });

  describe('gameModes.classic', () => {
    it('detects a full-card win when all numbers are called', () => {
      const card = generateLotoCard('p1');
      const allNumbers: number[] = [];
      for (const row of card.grid) {
        for (const cell of row) {
          if (cell.value !== null) allNumbers.push(cell.value);
        }
      }
      expect(gameModes.classic.checkWin(card, allNumbers)).toBe(true);
      // Missing one number => no win
      expect(gameModes.classic.checkWin(card, allNumbers.slice(1))).toBe(false);
    });
  });

  describe('generateLotoCard', () => {
    it('produces 15 numbers with 5 per row', () => {
      for (let i = 0; i < 20; i++) {
        const card = generateLotoCard('p' + i);
        expect(card.grid).toHaveLength(3);
        let total = 0;
        for (const row of card.grid) {
          expect(row).toHaveLength(9);
          const rowCount = row.filter(c => c.value !== null).length;
          expect(rowCount).toBe(5);
          total += rowCount;
        }
        expect(total).toBe(15);
      }
    });
  });

  describe('markCell immutability', () => {
    it('does not mutate the original card or grid', () => {
      const card = generateLotoCard('p1');
      // Find first cell with a value
      let r = -1;
      let c = -1;
      outer: for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 9; j++) {
          if (card.grid[i][j].value !== null) {
            r = i;
            c = j;
            break outer;
          }
        }
      }
      expect(r).toBeGreaterThanOrEqual(0);

      const originalIsMarked = card.grid[r][c].isMarked;
      const originalGrid = card.grid;
      const originalRow = card.grid[r];
      const originalCell = card.grid[r][c];

      const updated = markCell(card, r, c);

      expect(updated).not.toBe(card);
      expect(updated.grid).not.toBe(originalGrid);
      expect(updated.grid[r]).not.toBe(originalRow);
      expect(updated.grid[r][c]).not.toBe(originalCell);

      // Original untouched
      expect(card.grid[r][c].isMarked).toBe(originalIsMarked);
      // New value flipped
      expect(updated.grid[r][c].isMarked).toBe(!originalIsMarked);
    });
  });
});
