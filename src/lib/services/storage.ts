import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_AVATARS, getRandomAvatar } from '../config/avatar.config';

export const STORAGE_KEYS = {
    PLAYER_TOKEN: 'loto_playerToken',
    PLAYER_AVATAR: 'loto_playerAvatar',
    PLAYER_NAME: 'loto_playerName',
    LAST_ROOM: 'loto_lastRoom',
    AUDIO_MUTED: 'loto_muted',
    LANGUAGE: 'loto_language',
    BATTERY_SAVER: 'loto_batterySaver',
    COINS: 'loto_coins',
    INVENTORY: 'loto_inventory',
    LAST_DAILY_BONUS: 'loto_lastDailyBonus',
    ACTIVE_THEME: 'loto_activeTheme',
    ACTIVE_SKIN: 'loto_activeSkin',
    STATS: 'loto_stats',
} as const;

export class StorageService {
    private static instance: StorageService;
    private memoryCache: Map<string, any> = new Map();

    private constructor() {
        // Hydrate cache on init if needed (async in RN, so maybe not full sync)
    }

    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    // Async methods for RN
    public async get<T>(key: string): Promise<T | null> {
        try {
            const value = await AsyncStorage.getItem(key);
            if (value === null) return null;
            return JSON.parse(value) as T;
        } catch {
            return null;
        }
    }

    public async getString(key: string): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(key);
        } catch {
            return null;
        }
    }

    public async set<T>(key: string, value: T): Promise<void> {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            await AsyncStorage.setItem(key, stringValue);
            this.memoryCache.set(key, value);
        } catch { }
    }

    public async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
            this.memoryCache.delete(key);
        } catch { }
    }
}

export const storageService = StorageService.getInstance();

// Re-export for backward compatibility
export { DEFAULT_AVATARS };

export const getPlayerAvatar = async () => {
    const saved = await storageService.getString(STORAGE_KEYS.PLAYER_AVATAR);
    if (saved) return saved;
    const random = getRandomAvatar();
    await storageService.set(STORAGE_KEYS.PLAYER_AVATAR, random);
    return random;
};

export const setPlayerAvatar = async (avatar: string) => {
    await storageService.set(STORAGE_KEYS.PLAYER_AVATAR, avatar);
};

export const getPlayerName = async () => storageService.getString(STORAGE_KEYS.PLAYER_NAME);
export const setPlayerName = async (name: string) => storageService.set(STORAGE_KEYS.PLAYER_NAME, name);

export const getCoins = async () => (await storageService.get<number>(STORAGE_KEYS.COINS)) ?? 1000;
export const setCoins = async (coins: number) => storageService.set(STORAGE_KEYS.COINS, coins);

export const getInventory = async () => (await storageService.get<string[]>(STORAGE_KEYS.INVENTORY)) ?? ['theme_classic', 'skin_classic'];
export const setInventory = async (inventory: string[]) => storageService.set(STORAGE_KEYS.INVENTORY, inventory);

export const getLastDailyBonus = async () => (await storageService.get<number>(STORAGE_KEYS.LAST_DAILY_BONUS)) ?? 0;
export const setLastDailyBonus = async (time: number) => storageService.set(STORAGE_KEYS.LAST_DAILY_BONUS, time);

export const getActiveTheme = async () => (await storageService.getString(STORAGE_KEYS.ACTIVE_THEME)) ?? 'theme_classic';
export const setActiveTheme = async (id: string) => storageService.set(STORAGE_KEYS.ACTIVE_THEME, id);

export const getActiveSkin = async () => (await storageService.getString(STORAGE_KEYS.ACTIVE_SKIN)) ?? 'skin_classic';
export const setActiveSkin = async (id: string) => storageService.set(STORAGE_KEYS.ACTIVE_SKIN, id);

// ============================================================================
// PLAYER STATS - Properly typed (ISP fix)
// ============================================================================

export interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    totalEarnings: number;
    xp: number;
    fastestWinMs?: number;
    longestStreak?: number;
    currentStreak?: number;
}

const DEFAULT_STATS: PlayerStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalEarnings: 0,
    xp: 0,
};

export const getStats = async (): Promise<PlayerStats> => {
    const saved = await storageService.get<PlayerStats>(STORAGE_KEYS.STATS);
    return saved ?? DEFAULT_STATS;
};

export const setStats = async (stats: PlayerStats): Promise<void> => {
    await storageService.set(STORAGE_KEYS.STATS, stats);
};


