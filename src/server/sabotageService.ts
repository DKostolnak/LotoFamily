import type { SabotageType, Player, GameState } from '@/lib/types';
import { shuffleCardPositions } from './cardUtils';

/**
 * Sabotage costs by type
 */
export const SABOTAGE_COSTS: Record<SabotageType, number> = {
    snowball: 30,
    ink_splat: 20,
    swap_hand: 50,
};

/**
 * Check if player can afford sabotage
 */
export function canAffordSabotage(player: Player, type: SabotageType): boolean {
    return (player.energy || 0) >= SABOTAGE_COSTS[type];
}

/**
 * Apply sabotage effect to target player
 * Returns the modified player and any announcements
 */
export function applySabotage(
    target: Player,
    type: SabotageType
): { player: Player; announcement?: string } {
    const updatedTarget = { ...target };

    if (!updatedTarget.activeDebuffs) {
        updatedTarget.activeDebuffs = {};
    }

    switch (type) {
        case 'snowball':
            updatedTarget.activeDebuffs.frozenUntil = Date.now() + 5000;
            return {
                player: updatedTarget,
                announcement: `${target.name} has been frozen!`
            };

        case 'ink_splat':
            const splat = {
                id: Math.random().toString(36).substring(7),
                x: 20 + Math.random() * 60,
                y: 20 + Math.random() * 60
            };
            updatedTarget.activeDebuffs.inkSplats = [
                ...(updatedTarget.activeDebuffs.inkSplats || []),
                splat
            ];
            return {
                player: updatedTarget,
                announcement: `${target.name} got ink splattered!`
            };

        case 'swap_hand':
            updatedTarget.cards = updatedTarget.cards.map(card =>
                shuffleCardPositions(card)
            );
            return {
                player: updatedTarget,
                announcement: `${target.name}'s cards were shuffled!`
            };

        default:
            return { player: updatedTarget };
    }
}

/**
 * Process a sabotage action
 * Returns updated game state or null if invalid
 */
export function processSabotage(
    game: GameState,
    attackerId: string,
    targetId: string,
    type: SabotageType
): GameState | null {
    const attackerIndex = game.players.findIndex(p => p.id === attackerId);
    const targetIndex = game.players.findIndex(p => p.id === targetId);

    if (attackerIndex === -1 || targetIndex === -1) return null;

    const attacker = game.players[attackerIndex];
    if (!canAffordSabotage(attacker, type)) return null;

    // Deduct cost
    const updatedAttacker = {
        ...attacker,
        energy: (attacker.energy || 0) - SABOTAGE_COSTS[type]
    };

    // Apply effect
    const { player: updatedTarget } = applySabotage(game.players[targetIndex], type);

    // Update players array
    const updatedPlayers = [...game.players];
    updatedPlayers[attackerIndex] = updatedAttacker;
    updatedPlayers[targetIndex] = updatedTarget;

    return { ...game, players: updatedPlayers };
}
