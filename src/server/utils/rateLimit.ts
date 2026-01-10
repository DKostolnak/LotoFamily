/**
 * Rate Limiting Utility
 * Simple in-memory rate limiter for Socket.io events
 */

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

// Store: socketId -> { action -> entry }
const rateLimits = new Map<string, Map<string, RateLimitEntry>>();

// Default limits per action
const ACTION_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
    'game:markCell': { maxRequests: 30, windowMs: 10000 }, // 30 marks per 10 seconds
    'economy:purchase': { maxRequests: 5, windowMs: 60000 }, // 5 purchases per minute
    'economy:claimBonus': { maxRequests: 2, windowMs: 60000 }, // 2 attempts per minute
    'room:create': { maxRequests: 3, windowMs: 60000 }, // 3 rooms per minute
    'room:join': { maxRequests: 10, windowMs: 60000 }, // 10 joins per minute
    default: { maxRequests: 60, windowMs: 60000 }, // 60 requests per minute default
};

/**
 * Check if a socket is rate limited for a specific action
 * @returns true if rate limited, false if allowed
 */
export function isRateLimited(socketId: string, action: string): boolean {
    const now = Date.now();
    const limits = ACTION_LIMITS[action] || ACTION_LIMITS.default;

    // Get or create socket's rate limit map
    let socketLimits = rateLimits.get(socketId);
    if (!socketLimits) {
        socketLimits = new Map();
        rateLimits.set(socketId, socketLimits);
    }

    // Get or create action entry
    let entry = socketLimits.get(action);
    if (!entry || now - entry.windowStart > limits.windowMs) {
        // New window
        entry = { count: 1, windowStart: now };
        socketLimits.set(action, entry);
        return false;
    }

    // Check limit
    if (entry.count >= limits.maxRequests) {
        return true; // Rate limited
    }

    // Increment and allow
    entry.count++;
    return false;
}

/**
 * Clean up rate limit entries for disconnected sockets
 */
export function cleanupSocket(socketId: string): void {
    rateLimits.delete(socketId);
}

/**
 * Periodic cleanup of stale entries (call every few minutes)
 */
export function cleanupStaleEntries(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [socketId, socketLimits] of rateLimits.entries()) {
        let hasActiveEntries = false;

        for (const [action, entry] of socketLimits.entries()) {
            if (now - entry.windowStart > maxAge) {
                socketLimits.delete(action);
            } else {
                hasActiveEntries = true;
            }
        }

        if (!hasActiveEntries) {
            rateLimits.delete(socketId);
        }
    }
}
