import { Server, Socket } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents } from '../../lib/types';
import * as persistence from '../persistence';
import { getTier } from '../../lib/ranking';
import { SHOP_ITEMS } from '../../lib/shopData';

type Context = {
    io: Server<ClientToServerEvents, ServerToClientEvents>;
    socket: Socket<ClientToServerEvents, ServerToClientEvents>;
};

export function handlePurchaseItem(
    { io, socket }: Context,
    token: string,
    itemId: string,
    clientCost: number // We receive this but validate against server data
) {
    // Validate token exists
    if (!token || typeof token !== 'string') {
        socket.emit('error', { message: 'Invalid token' });
        return;
    }

    // Find item in server-side shop data (source of truth)
    const shopItem = SHOP_ITEMS.find(item => item.id === itemId);
    if (!shopItem) {
        socket.emit('error', { message: 'Item not found' });
        return;
    }

    // Check if already owned
    const player = persistence.getPlayer(token);
    if (!player) {
        socket.emit('error', { message: 'Player not found' });
        return;
    }

    if (player.inventory.includes(itemId)) {
        socket.emit('error', { message: 'Item already owned' });
        return;
    }

    // Use SERVER price, not client price (security fix)
    const actualCost = shopItem.price;

    const success = persistence.spendCoins(token, actualCost);
    if (success) {
        persistence.addInventoryItem(token, itemId);
        const updatedPlayer = persistence.getPlayer(token);
        if (updatedPlayer) {
            const tier = getTier(updatedPlayer.rp || 0);
            socket.emit('economy:update', {
                coins: updatedPlayer.coins,
                rp: updatedPlayer.rp || 0,
                tier: tier.name,
                inventory: updatedPlayer.inventory
            });
        }
    } else {
        socket.emit('error', { message: 'Insufficient funds' });
    }
}

export function handleSyncEconomy({ socket }: Context, token: string) {
    const player = persistence.getPlayer(token);
    if (player) {
        const tier = getTier(player.rp || 0);
        socket.emit('economy:update', {
            coins: player.coins,
            rp: player.rp || 0,
            tier: tier.name,
            inventory: player.inventory
        });
    } else {
        // New player or lost session, create default
        const newPlayer = persistence.createOrUpdatePlayer(token, {});
        const tier = getTier(newPlayer.rp || 0);
        socket.emit('economy:update', {
            coins: newPlayer.coins,
            rp: newPlayer.rp || 0,
            tier: tier.name,
            inventory: newPlayer.inventory
        });
    }
}

export function handleDailyBonus({ socket }: Context, token: string) {
    // Validate token
    if (!token || typeof token !== 'string') {
        socket.emit('error', { message: 'Invalid token' });
        return;
    }

    // Server-side validation of 24h timer
    const bonusAmount = persistence.claimDailyBonus(token);

    if (bonusAmount === 0) {
        socket.emit('error', { message: 'Daily bonus already claimed. Try again in 24 hours.' });
        return;
    }

    const player = persistence.getPlayer(token);
    if (player) {
        const tier = getTier(player.rp || 0);
        socket.emit('economy:update', {
            coins: player.coins,
            rp: player.rp || 0,
            tier: tier.name,
            inventory: player.inventory
        });
    }
}
