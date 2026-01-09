/**
 * Economy Emitter Utility
 *
 * Centralized helper for emitting economy updates to clients.
 * Ensures consistent data format across all handlers.
 */

import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '../../lib/types';
import * as persistence from '../persistence';
import { getTier } from '../../lib/ranking';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

/**
 * Emit economy update to a single player socket.
 *
 * @param socket - The player's socket connection
 * @param token - The player's persistent token
 * @returns true if emission was successful, false if player not found
 */
export function emitEconomyUpdate(socket: TypedSocket, token: string): boolean {
    const playerData = persistence.getPlayer(token);
    if (!playerData) {
        return false;
    }

    const tier = getTier(playerData.rp || 0);

    socket.emit('economy:update', {
        coins: playerData.coins,
        rp: playerData.rp || 0,
        tier: tier.name,
        inventory: playerData.inventory,
    });

    return true;
}

/**
 * Emit economy update to a specific player by socket ID.
 * Used when broadcasting to a room but needing player-specific data.
 *
 * @param io - The Socket.IO server instance
 * @param socketId - The player's socket ID
 * @param token - The player's persistent token
 * @returns true if emission was successful
 */
export function emitEconomyUpdateToPlayer(
    io: TypedServer,
    socketId: string,
    token: string
): boolean {
    const playerData = persistence.getPlayer(token);
    if (!playerData) {
        return false;
    }

    const tier = getTier(playerData.rp || 0);

    io.to(socketId).emit('economy:update', {
        coins: playerData.coins,
        rp: playerData.rp || 0,
        tier: tier.name,
        inventory: playerData.inventory,
    });

    return true;
}
