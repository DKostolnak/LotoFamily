import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');

export interface PersistentPlayer {
    id: string; // Token
    name: string;
    coins: number;
    rp: number;
    inventory: string[];
    achievements: string[]; // Unlocked achievement IDs
    stats: {
        gamesPlayed: number;
        wins: number;
        flats: number;
        // Achievement-related stats
        winStreak: number;
        maxWinStreak: number;
        fastestWinMs: number; // 0 = no wins yet
        totalCoinsEarned: number;
        loginStreak: number;
        lastPlayDate: string; // YYYY-MM-DD for login streak tracking
    };
    lastLogin: number;
    lastBonusClaim: number; // Timestamp of last daily bonus claim
}

// In-memory cache
let players: Map<string, PersistentPlayer> = new Map();

export function initPersistence() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }
    if (fs.existsSync(PLAYERS_FILE)) {
        try {
            const data = fs.readFileSync(PLAYERS_FILE, 'utf-8');
            const json = JSON.parse(data);
            players = new Map(Object.entries(json));
            console.log(`[Persistence] Loaded ${players.size} players.`);
        } catch (e) {
            console.error('[Persistence] Error loading players:', e);
        }
    }
}

export function savePersistence() {
    try {
        const obj = Object.fromEntries(players);
        const tempPath = PLAYERS_FILE + '.tmp';

        // Write to temp file first
        fs.writeFileSync(tempPath, JSON.stringify(obj, null, 2));

        // Atomic rename (safe on POSIX systems)
        fs.renameSync(tempPath, PLAYERS_FILE);
    } catch (e) {
        console.error('[Persistence] Error saving players:', e);
        // Clean up temp file if it exists
        try {
            const tempPath = PLAYERS_FILE + '.tmp';
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        } catch { /* ignore cleanup errors */ }
    }
}

export function getPlayer(token: string): PersistentPlayer | undefined {
    return players.get(token);
}

export function createOrUpdatePlayer(token: string, data: Partial<PersistentPlayer>): PersistentPlayer {
    const existing = players.get(token) || {
        id: token,
        name: 'Player',
        coins: 100, // Starting bonus
        rp: 0,
        inventory: [],
        achievements: [],
        stats: {
            gamesPlayed: 0,
            wins: 0,
            flats: 0,
            winStreak: 0,
            maxWinStreak: 0,
            fastestWinMs: 0,
            totalCoinsEarned: 100, // Include starting bonus
            loginStreak: 1,
            lastPlayDate: new Date().toISOString().split('T')[0],
        },
        lastLogin: Date.now(),
        lastBonusClaim: 0 // Never claimed
    };

    // Check login streak
    const today = new Date().toISOString().split('T')[0];
    if (existing.stats.lastPlayDate) {
        const lastDate = new Date(existing.stats.lastPlayDate);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
            // Consecutive day - increment streak
            existing.stats.loginStreak = (existing.stats.loginStreak || 0) + 1;
        } else if (daysDiff > 1) {
            // Missed a day - reset streak
            existing.stats.loginStreak = 1;
        }
        // Same day (daysDiff === 0) - no change
    }
    existing.stats.lastPlayDate = today;

    const updated = { ...existing, ...data, lastLogin: Date.now() };
    players.set(token, updated);
    savePersistence();
    return updated;
}

export function addCoins(token: string, amount: number): number {
    const player = getPlayer(token);
    if (!player) return 0;
    player.coins += amount;
    // Track total coins earned for achievements
    if (amount > 0) {
        player.stats.totalCoinsEarned = (player.stats.totalCoinsEarned || 0) + amount;
    }
    savePersistence();
    return player.coins;
}

export function spendCoins(token: string, amount: number): boolean {
    const player = getPlayer(token);
    if (!player || player.coins < amount) return false;
    player.coins -= amount;
    savePersistence();
    return true;
}

export function addInventoryItem(token: string, itemId: string): boolean {
    const player = getPlayer(token);
    if (!player) return false;
    if (!player.inventory.includes(itemId)) {
        player.inventory.push(itemId);
        savePersistence();
        return true;
    }
    return false;
}

export function addRp(token: string, amount: number): number {
    const player = getPlayer(token);
    if (!player) return 0;
    player.rp = (player.rp || 0) + amount;
    savePersistence();
    return player.rp;
}

const DAILY_BONUS_AMOUNT = 50;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Attempt to claim daily bonus
 * @returns bonus amount if successful, 0 if already claimed today
 */
export function claimDailyBonus(token: string): number {
    const player = getPlayer(token);
    if (!player) return 0;

    const now = Date.now();
    const lastClaim = player.lastBonusClaim || 0;

    // Check if 24h have passed
    if (now - lastClaim < MS_PER_DAY) {
        return 0; // Already claimed today
    }

    // Award bonus
    player.coins += DAILY_BONUS_AMOUNT;
    player.stats.totalCoinsEarned = (player.stats.totalCoinsEarned || 0) + DAILY_BONUS_AMOUNT;
    player.lastBonusClaim = now;
    savePersistence();

    return DAILY_BONUS_AMOUNT;
}

// ============================================================================
// ACHIEVEMENT HELPERS
// ============================================================================

/**
 * Unlock an achievement for a player
 * @returns true if newly unlocked, false if already had it
 */
export function unlockAchievement(token: string, achievementId: string): boolean {
    const player = getPlayer(token);
    if (!player) return false;

    if (!player.achievements) {
        player.achievements = [];
    }

    if (player.achievements.includes(achievementId)) {
        return false; // Already unlocked
    }

    player.achievements.push(achievementId);
    savePersistence();
    return true;
}

/**
 * Record a game win and update streak stats
 * @param gameDurationMs How long the game took in milliseconds
 */
export function recordWin(token: string, gameDurationMs: number): void {
    const player = getPlayer(token);
    if (!player) return;

    // Increment wins
    player.stats.wins = (player.stats.wins || 0) + 1;

    // Update win streak
    player.stats.winStreak = (player.stats.winStreak || 0) + 1;
    player.stats.maxWinStreak = Math.max(
        player.stats.maxWinStreak || 0,
        player.stats.winStreak
    );

    // Track fastest win
    if (player.stats.fastestWinMs === 0 || gameDurationMs < player.stats.fastestWinMs) {
        player.stats.fastestWinMs = gameDurationMs;
    }

    savePersistence();
}

/**
 * Record a game played (without winning)
 * Resets win streak
 */
export function recordGamePlayed(token: string, didWin: boolean): void {
    const player = getPlayer(token);
    if (!player) return;

    player.stats.gamesPlayed = (player.stats.gamesPlayed || 0) + 1;

    // Reset win streak if didn't win
    if (!didWin) {
        player.stats.winStreak = 0;
    }

    savePersistence();
}

/**
 * Get player's achievement stats for checking unlocks
 */
export function getAchievementStats(token: string) {
    const player = getPlayer(token);
    if (!player) return null;

    return {
        gamesPlayed: player.stats.gamesPlayed || 0,
        wins: player.stats.wins || 0,
        flats: player.stats.flats || 0,
        winStreak: player.stats.winStreak || 0,
        maxWinStreak: player.stats.maxWinStreak || 0,
        fastestWinMs: player.stats.fastestWinMs || 0,
        totalCoinsEarned: player.stats.totalCoinsEarned || 0,
        loginStreak: player.stats.loginStreak || 0,
        inventoryCount: player.inventory?.length || 0,
    };
}
