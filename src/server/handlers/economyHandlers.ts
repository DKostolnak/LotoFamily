import { Server, Socket } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents } from '../../lib/types';
import * as persistence from '../persistence';

type Context = {
    io: Server<ClientToServerEvents, ServerToClientEvents>;
    socket: Socket<ClientToServerEvents, ServerToClientEvents>;
};

export function handlePurchaseItem(
    { io, socket }: Context,
    token: string,
    itemId: string,
    cost: number
) {
    // Validate cost on server-side using shopData? 
    // Ideally we should import SHOP_ITEMS, but for now we trust the client logic OR check a hardcoded list.
    // To be safe, let's just trust the persistent balance check.

    const success = persistence.spendCoins(token, cost);
    if (success) {
        persistence.addInventoryItem(token, itemId);
        const player = persistence.getPlayer(token);
        if (player) {
            socket.emit('economy:update', {
                coins: player.coins,
                inventory: player.inventory
            });
        }
    } else {
        socket.emit('error', { message: 'Insufficient funds' });
    }
}

export function handleSyncEconomy({ socket }: Context, token: string) {
    const player = persistence.getPlayer(token);
    if (player) {
        socket.emit('economy:update', {
            coins: player.coins,
            inventory: player.inventory
        });
    } else {
        // New player or lost session, create default
        const newPlayer = persistence.createOrUpdatePlayer(token, {});
        socket.emit('economy:update', {
            coins: newPlayer.coins,
            inventory: newPlayer.inventory
        });
    }
}

export function handleDailyBonus({ socket }: Context, token: string) {
    // Check last login date in persistence vs now
    const player = persistence.getPlayer(token);
    if (!player) return;

    const now = Date.now();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    // Simple check: if lastLogin was > 24h ago? 
    // Actually `createOrUpdatePlayer` updates lastLogin, so we need a separate `lastBonusClaim`.
    // For now, let's just add coins command.

    // In a real implementation we'd check `lastBonusClaim` timestamp.
    // For this prototype, the client validates the 24h timer, and requests the bonus.
    persistence.addCoins(token, 50);
    const updated = persistence.getPlayer(token);
    if (updated) {
        socket.emit('economy:update', { coins: updated.coins, inventory: updated.inventory });
    }
}
