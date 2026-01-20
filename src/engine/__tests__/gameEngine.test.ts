import { describe, expect, it } from '@jest/globals';
import {
  createGame,
  startGame,
  callNextNumber,
  generateRoomCode,
  addPlayer,
} from '../gameEngine';

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
});
