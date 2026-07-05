import type { Player } from '@/lib/types';

export interface OpponentProgress {
    player: Player;
    numbersLeft: number;
    isUrgent: boolean;
}

export function getOpponentProgress(players: Player[], myPlayerId: string | null | undefined): OpponentProgress[] {
    return players
        .filter(player => player.id !== myPlayerId)
        .map(player => {
            const numbersLeft = player.cards.reduce((total, card) => {
                return total + card.grid.flat().filter(cell => cell.value !== null && !cell.isMarked).length;
            }, 0);

            return {
                player,
                numbersLeft,
                isUrgent: numbersLeft <= 3,
            };
        });
}
