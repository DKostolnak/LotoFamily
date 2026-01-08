/**
 * Storage Service
 * 
 * Provides a type-safe wrapper around localStorage with SSR safety.
 * Centralizes all storage key definitions and access patterns.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface IStorageService {
    get<T>(key: string): T | null;
    getString(key: string): string | null;
    set<T>(key: string, value: T): void;
    remove(key: string): void;
    clear(): void;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * Centralized storage key definitions.
 * Using const object ensures consistency across the app.
 */
export const STORAGE_KEYS = {
    /** Player reconnection token */
    PLAYER_TOKEN: 'loto_playerToken',
    /** Player's selected avatar emoji */
    PLAYER_AVATAR: 'loto_playerAvatar',
    /** Player's display name */
    PLAYER_NAME: 'loto_playerName',
    /** Last joined room code for auto-reconnect */
    LAST_ROOM: 'loto_lastRoom',
    /** Audio mute preference */
    AUDIO_MUTED: 'loto_muted',
    /** Selected language */
    LANGUAGE: 'loto_language',
    /** Battery saver mode preference */
    BATTERY_SAVER: 'loto_batterySaver',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// ============================================================================
// STORAGE SERVICE IMPLEMENTATION
// ============================================================================

/**
 * Safely get the localStorage object.
 * Returns null during SSR or if localStorage is unavailable.
 */
function getStorage(): Storage | null {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        return window.localStorage;
    } catch {
        // localStorage may be blocked by privacy settings
        return null;
    }
}

/**
 * StorageService singleton instance.
 * Provides safe access to localStorage with type conversion.
 */
export const storageService: IStorageService = {
    /**
     * Gets a JSON-parsed value from storage.
     * @param key - Storage key
     * @returns Parsed value or null if not found
     */
    get<T>(key: string): T | null {
        const storage = getStorage();
        if (!storage) return null;

        try {
            const value = storage.getItem(key);
            if (value === null) return null;
            return JSON.parse(value) as T;
        } catch {
            return null;
        }
    },

    /**
     * Gets a raw string value from storage.
     * Use this for values that don't need JSON parsing.
     * @param key - Storage key
     * @returns String value or null if not found
     */
    getString(key: string): string | null {
        const storage = getStorage();
        if (!storage) return null;
        return storage.getItem(key);
    },

    /**
     * Sets a value in storage (JSON stringified).
     * @param key - Storage key
     * @param value - Value to store
     */
    set<T>(key: string, value: T): void {
        const storage = getStorage();
        if (!storage) return;

        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            storage.setItem(key, stringValue);
        } catch {
            // Storage may be full or blocked
        }
    },

    /**
     * Removes a value from storage.
     * @param key - Storage key to remove
     */
    remove(key: string): void {
        const storage = getStorage();
        if (!storage) return;
        storage.removeItem(key);
    },

    /**
     * Clears all game-related storage.
     * Only removes keys defined in STORAGE_KEYS.
     */
    clear(): void {
        const storage = getStorage();
        if (!storage) return;

        Object.values(STORAGE_KEYS).forEach(key => {
            storage.removeItem(key);
        });
    },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a stable unique ID for player identification.
 * Uses crypto.randomUUID when available, falls back to manual generation.
 */
export function generateUniqueId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Ensures a player token exists in storage.
 * Creates one if it doesn't exist.
 * @returns The player token
 */
export function ensurePlayerToken(): string {
    const existing = storageService.getString(STORAGE_KEYS.PLAYER_TOKEN);
    if (existing) {
        return existing;
    }

    const newToken = generateUniqueId();
    storageService.set(STORAGE_KEYS.PLAYER_TOKEN, newToken);
    return newToken;
}

/**
 * Gets the player token if it exists.
 * @returns Token or null
 */
export function getPlayerToken(): string | null {
    return storageService.getString(STORAGE_KEYS.PLAYER_TOKEN);
}

/**
 * Clears the player token (for logout).
 */
export function clearPlayerToken(): void {
    storageService.remove(STORAGE_KEYS.PLAYER_TOKEN);
}

// ============================================================================
// PLAYER PROFILE HELPERS
// ============================================================================

export const DEFAULT_AVATARS = ['🐻', '🦊', '🐱', '🐼', '🦁', '🐯', '🐨', '🐸'] as const;

/**
 * Gets the saved player avatar or generates a random one.
 */
export function getPlayerAvatar(): string {
    const saved = storageService.getString(STORAGE_KEYS.PLAYER_AVATAR);
    if (saved) return saved;

    const random = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
    storageService.set(STORAGE_KEYS.PLAYER_AVATAR, random);
    return random;
}

/**
 * Saves the player's avatar choice.
 */
export function setPlayerAvatar(avatar: string): void {
    storageService.set(STORAGE_KEYS.PLAYER_AVATAR, avatar);
}

/**
 * Gets the saved player name.
 */
export function getPlayerName(): string | null {
    return storageService.getString(STORAGE_KEYS.PLAYER_NAME);
}

/**
 * Saves the player's name.
 */
export function setPlayerName(name: string): void {
    storageService.set(STORAGE_KEYS.PLAYER_NAME, name);
}

/**
 * Gets the last joined room code.
 */
export function getLastRoomCode(): string | null {
    return storageService.getString(STORAGE_KEYS.LAST_ROOM);
}

/**
 * Saves the last joined room code.
 */
export function setLastRoomCode(code: string): void {
    storageService.set(STORAGE_KEYS.LAST_ROOM, code);
}

/**
 * Clears the last room code (on leave/kick).
 */
export function clearLastRoomCode(): void {
    storageService.remove(STORAGE_KEYS.LAST_ROOM);
}
