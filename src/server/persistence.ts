import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');

export interface PersistentPlayer {
    id: string; // Token
    name: string;
    coins: number;
    inventory: string[];
    stats: {
        gamesPlayed: number;
        wins: number;
        flats: number;
    };
    lastLogin: number;
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
        fs.writeFileSync(PLAYERS_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
        console.error('[Persistence] Error saving players:', e);
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
        inventory: [],
        stats: { gamesPlayed: 0, wins: 0, flats: 0 },
        lastLogin: Date.now()
    };

    const updated = { ...existing, ...data, lastLogin: Date.now() };
    players.set(token, updated);
    savePersistence();
    return updated;
}

export function addCoins(token: string, amount: number): number {
    const player = getPlayer(token);
    if (!player) return 0;
    player.coins += amount;
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
