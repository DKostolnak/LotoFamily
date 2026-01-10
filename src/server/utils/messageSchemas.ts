/**
 * Message Validation Schemas
 * Zod schemas for validating Socket.io event payloads
 */

import { z } from 'zod';

// ============================================================================
// ROOM EVENTS
// ============================================================================

export const RoomCreatePayloadSchema = z.object({
    playerName: z.string().min(1).max(20),
    avatarUrl: z.string().max(500000).optional(), // Allow data URLs up to ~500KB
    settings: z.object({
        gameMode: z.enum(['classic', 'speed', 'crazy']).optional(),
        maxPlayers: z.number().int().min(2).max(10).optional(),
        cardsPerPlayer: z.number().int().min(1).max(6).optional(),
        autoCallEnabled: z.boolean().optional(),
        autoCallIntervalMs: z.number().int().min(1000).max(30000).optional(),
        language: z.enum(['en', 'sk', 'ru', 'uk']).optional(),
        crazyMode: z.boolean().optional(),
        customRoomCode: z.string().regex(/^[A-Z0-9]{3,10}$/).optional(),
    }).optional(),
    token: z.string().min(8).max(64).optional(),
});

export const RoomJoinPayloadSchema = z.object({
    roomCode: z.string().regex(/^[A-Z0-9]{3,10}$/),
    playerName: z.string().min(1).max(20),
    avatarUrl: z.string().max(500000).optional(),
    token: z.string().min(8).max(64).optional(),
});

export const KickPlayerPayloadSchema = z.object({
    targetPlayerId: z.string().min(1),
});

export const UpdateProfilePayloadSchema = z.object({
    name: z.string().min(1).max(20),
    avatarUrl: z.string().max(500000).optional(),
});

// ============================================================================
// GAME EVENTS
// ============================================================================

export const MarkCellPayloadSchema = z.object({
    cardId: z.string().min(1),
    row: z.number().int().min(0).max(2),
    col: z.number().int().min(0).max(8),
});

export const ClaimWinPayloadSchema = z.object({
    cardId: z.string().min(1),
});

export const ClaimFlatPayloadSchema = z.object({
    flatType: z.number().int().min(1).max(2),
});

export const GameStartPayloadSchema = z.object({
    autoCallIntervalMs: z.number().int().min(1000).max(30000).optional(),
}).optional();

// ============================================================================
// ECONOMY EVENTS
// ============================================================================

export const PurchasePayloadSchema = z.object({
    itemId: z.string().min(1).max(50),
});

// ============================================================================
// P2P MESSAGE SCHEMA
// ============================================================================

export const P2PMessageSchema = z.object({
    type: z.enum([
        'player:join',
        'player:leave',
        'game:state',
        'game:start',
        'game:numberCalled',
        'game:markCell',
        'game:claimWin',
        'game:claimFlat',
        'game:pause',
        'game:resume',
        'game:restart',
        'ping',
        'pong',
    ]),
    payload: z.unknown().optional(),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate payload and return result
 */
export function validatePayload<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errorMessages = result.error.issues
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
    return { success: false, error: errorMessages };
}
