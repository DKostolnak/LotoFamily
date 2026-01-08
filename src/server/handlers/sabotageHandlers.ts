/**
 * Sabotage Handlers - Socket events for sabotage system
 */

import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, SabotageType, LotoCard, LotoCardGrid } from '../../lib/types';
import { SABOTAGE_COSTS, FREEZE_DURATION_MS } from '../../lib/constants';
import { sabotageLog } from '../../lib/logger';
import * as store from '../store';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

/**
 * Shuffle card positions
 */
function shuffleCardPositions(card: LotoCard): LotoCard {
    const allCells = card.grid.flat().map(cell => ({ ...cell }));

    for (let i = allCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
    }

    const newGrid: LotoCardGrid = [
        allCells.slice(0, 9),
        allCells.slice(9, 18),
        allCells.slice(18, 27),
    ] as LotoCardGrid;

    return { ...card, grid: newGrid };
}

interface SabotageHandlerContext {
    io: TypedServer;
    socket: TypedSocket;
}

export function handleUseSabotage(
    { io, socket }: SabotageHandlerContext,
    targetId: string,
    type: SabotageType,
    getRoomCode: (socket: TypedSocket) => string | undefined
): void {
    const roomCode = getRoomCode(socket);
    if (!roomCode) return;

    const game = store.getGame(roomCode);
    if (!game) return;

    const attacker = game.players.find(p => p.id === socket.id);
    if (!attacker) return;

    const cost = SABOTAGE_COSTS[type];
    if ((attacker.energy || 0) < cost) {
        socket.emit('game:error', 'Not enough energy');
        return;
    }

    // Pay the cost
    attacker.energy = (attacker.energy || 0) - cost;

    // Apply effect to target
    const targetIndex = game.players.findIndex(p => p.id === targetId);
    if (targetIndex === -1) return;

    const target = game.players[targetIndex];

    if (!target.activeDebuffs) {
        target.activeDebuffs = {};
    }

    switch (type) {
        case 'snowball':
            target.activeDebuffs.frozenUntil = Date.now() + FREEZE_DURATION_MS;
            break;

        case 'ink_splat':
            const splat = {
                id: Math.random().toString(36).substring(7),
                x: 20 + Math.random() * 60,
                y: 20 + Math.random() * 60,
            };
            target.activeDebuffs.inkSplats = [
                ...(target.activeDebuffs.inkSplats || []),
                splat,
            ];
            break;

        case 'swap_hand':
            target.cards = target.cards.map(card => shuffleCardPositions(card));
            break;
    }

    store.setGame(roomCode, game);
    io.to(roomCode).emit('game:state', game);
    io.to(roomCode).emit('game:sabotageEffect', socket.id, targetId, type);

    sabotageLog.info(`${socket.id} used ${type} on ${targetId}`);
}
