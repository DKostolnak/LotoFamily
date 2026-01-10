/**
 * Input Sanitization Utilities
 * Protects against XSS and malformed input
 */

/**
 * Sanitize player name
 * - Removes HTML tags
 * - Trims whitespace
 * - Limits length
 * - Provides fallback for empty names
 */
export function sanitizeName(name: string, maxLength = 20): string {
    if (!name || typeof name !== 'string') {
        return 'Player';
    }

    // Remove HTML tags
    let clean = name.replace(/<[^>]*>/g, '');

    // Remove potentially dangerous characters
    clean = clean.replace(/[<>\"\'&]/g, '');

    // Trim and limit length
    clean = clean.trim().substring(0, maxLength);

    // Fallback for empty result
    return clean || 'Player';
}

/**
 * Sanitize room code
 * - Uppercase
 * - Alphanumeric only
 * - Trims whitespace
 */
export function sanitizeRoomCode(code: string): string {
    if (!code || typeof code !== 'string') {
        return '';
    }

    return code
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10);
}

/**
 * Validate token format
 * Tokens should be alphanumeric with dashes/underscores
 */
export function isValidToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
        return false;
    }

    // Allow alphanumeric, dashes, underscores, reasonable length
    return /^[a-zA-Z0-9_-]{8,64}$/.test(token);
}

/**
 * Sanitize avatar URL
 * - Allows emoji (single characters)
 * - Validates URLs (http/https/data)
 * - Rejects potentially dangerous content
 */
export function sanitizeAvatarUrl(avatarUrl: string): string {
    if (!avatarUrl || typeof avatarUrl !== 'string') {
        return '👤';
    }

    const trimmed = avatarUrl.trim();

    // Allow emoji (short strings without HTML)
    if (trimmed.length <= 4 && !trimmed.includes('<')) {
        return trimmed;
    }

    // Allow data URLs for uploaded avatars
    if (trimmed.startsWith('data:image/')) {
        // Basic validation - limit size to prevent memory attacks
        if (trimmed.length > 500000) { // ~500KB limit
            return '👤';
        }
        return trimmed;
    }

    // Allow https URLs
    if (trimmed.startsWith('https://')) {
        // Additional validation could go here (domain whitelist, etc.)
        return trimmed.substring(0, 2048); // URL length limit
    }

    // Default fallback
    return '👤';
}
