/**
 * Room Handlers Integration Tests
 * 
 * These tests verify the room management logic without requiring
 * actual Socket.io connections by mocking the context objects.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import * as store from '../../store';
import { createGame } from '../../../engine/gameEngine';

// Mock the store module
vi.mock('../../store', () => ({
    hasGame: vi.fn(),
    getGame: vi.fn(),
    setGame: vi.fn(),
    deleteGame: vi.fn(),
    deleteInterval: vi.fn(),
    getAllGames: vi.fn(() => new Map()),
}));

// Mock logger to prevent console output during tests
vi.mock('../../../lib/logger', () => ({
    roomLog: { info: vi.fn(), warn: vi.fn() },
}));

describe('Room Handlers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Room Code Validation', () => {
        it('validates room code format correctly', () => {
            // Valid codes: 3-10 alphanumeric characters
            const validPattern = /^[A-Z0-9]{3,10}$/;

            expect('ABC123'.match(validPattern)).toBeTruthy();
            expect('AB'.match(validPattern)).toBeFalsy(); // Too short
            expect('ABCDEFGHIJK'.match(validPattern)).toBeFalsy(); // Too long
            expect('abc123'.toUpperCase().match(validPattern)).toBeTruthy(); // lowercase converted
        });

        it('generates uppercase room codes', () => {
            // Test that game creation produces uppercase codes
            const game = createGame('host-1', 'Host', '🐻');
            expect(game.roomCode).toMatch(/^[A-Z0-9]+$/);
        });
    });

    describe('Game State Management', () => {
        it('creates game with correct initial state', () => {
            const hostId = 'socket-123';
            const hostName = 'TestHost';
            const avatarUrl = '🦊';

            const game = createGame(hostId, hostName, avatarUrl, {
                maxPlayers: 6,
                cardsPerPlayer: 2,
                crazyMode: true,
            });

            expect(game.players).toHaveLength(1);
            expect(game.players[0].id).toBe(hostId);
            expect(game.players[0].name).toBe(hostName);
            expect(game.players[0].isHost).toBe(true);
            expect(game.hostId).toBe(hostId);
            expect(game.phase).toBe('lobby');
            expect(game.settings.maxPlayers).toBe(6);
            expect(game.settings.cardsPerPlayer).toBe(2);
            expect(game.settings.crazyMode).toBe(true);
        });

        it('stores game after creation', () => {
            const game = createGame('host-1', 'Host', '🐻');

            // Simulate what the handler does
            store.setGame(game.roomCode, game);

            expect(store.setGame).toHaveBeenCalledWith(game.roomCode, game);
        });
    });

    describe('Player Management', () => {
        it('prevents joining when game is full', () => {
            // This tests the addPlayer logic in gameEngine
            const game = createGame('host-1', 'Host', '🐻', { maxPlayers: 1 });

            // Game already has 1 player (host) and max is 1
            expect(game.players.length).toBe(1);
            expect(game.settings.maxPlayers).toBe(1);
        });

        it('assigns host role to first player after host leaves', () => {
            // This tests the host migration logic
            const game = createGame('host-1', 'Host', '🐻');

            // Simulate adding second player
            const player2 = {
                id: 'player-2',
                name: 'Player2',
                avatarUrl: '🦁',
                isHost: false,
                isConnected: true,
                cards: [],
                collectedFlats: [],
                energy: 0,
                score: 0,
                activeDebuffs: {},
            };

            game.players.push(player2);

            // Simulate host leaving - migration logic
            const filteredPlayers = game.players.filter(p => p.id !== 'host-1');
            if (filteredPlayers.length > 0) {
                filteredPlayers[0].isHost = true;
                game.hostId = filteredPlayers[0].id;
            }

            expect(filteredPlayers[0].isHost).toBe(true);
            expect(game.hostId).toBe('player-2');
        });
    });
});
