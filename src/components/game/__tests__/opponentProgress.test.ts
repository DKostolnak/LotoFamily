import { getOpponentProgress } from '../opponentProgress';
import type { LotoCard, Player } from '@/lib/types';

function createCard(playerId: string, id: string, values: (number | null)[], markedValues: number[]): LotoCard {
    return {
        id,
        playerId,
        grid: [
            values.slice(0, 9).map(value => ({ value, isMarked: value !== null && markedValues.includes(value) })),
            values.slice(9, 18).map(value => ({ value, isMarked: value !== null && markedValues.includes(value) })),
            values.slice(18, 27).map(value => ({ value, isMarked: value !== null && markedValues.includes(value) })),
        ],
    };
}

function createPlayer(id: string, cards: LotoCard[]): Player {
    return {
        id,
        name: id,
        avatar: '🙂',
        cards,
        isHost: false,
        isConnected: true,
        collectedFlats: [],
        score: 0,
    };
}

describe('getOpponentProgress', () => {
    it('excludes me and counts unmarked numbered cells across opponent cards', () => {
        const players = [
            createPlayer('me', [
                createCard('me', 'my-card', [1, 2, 3, null, null, null, null, null, null, ...Array(18).fill(null)], [1]),
            ]),
            createPlayer('opponent-a', [
                createCard('opponent-a', 'a-card-1', [4, 5, 6, null, null, null, null, null, null, ...Array(18).fill(null)], [4]),
                createCard('opponent-a', 'a-card-2', [7, 8, null, null, null, null, null, null, null, ...Array(18).fill(null)], []),
            ]),
            createPlayer('opponent-b', [
                createCard('opponent-b', 'b-card-1', [9, 10, 11, null, null, null, null, null, null, ...Array(18).fill(null)], []),
            ]),
        ];

        expect(getOpponentProgress(players, 'me')).toEqual([
            {
                player: players[1],
                numbersLeft: 4,
                isUrgent: false,
            },
            {
                player: players[2],
                numbersLeft: 3,
                isUrgent: true,
            },
        ]);
    });
});
