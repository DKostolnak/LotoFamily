/**
 * Daily Quests Configuration
 *
 * Local, offline-first daily missions — the core daily-retention loop.
 * Quests are generated deterministically from the local date, so every
 * player gets the same set on the same day without any server.
 *
 * Design (R-Soft style): quests are short, always achievable in 1-2
 * practice games, and reset at LOCAL midnight (intuitive for players).
 */

// ============================================================================
// TYPES
// ============================================================================

/** Progress event types. Must match `trackProgress(type)` call sites. */
export type QuestType =
    | 'GAMES_PLAYED'
    | 'NUMBERS_MARKED'
    | 'GAMES_WON'
    | 'POWERUP_USED';

export interface QuestDef {
    /** Stable id, unique within the catalog. */
    readonly id: string;
    readonly type: QuestType;
    readonly target: number;
    /** Coin reward on claim. */
    readonly reward: number;
}

// ============================================================================
// CATALOG
// ============================================================================

/** Variants for the "play games" slot. */
const PLAY_VARIANTS: readonly QuestDef[] = [
    { id: 'play_2', type: 'GAMES_PLAYED', target: 2, reward: 75 },
    { id: 'play_3', type: 'GAMES_PLAYED', target: 3, reward: 100 },
];

/** Variants for the "mark numbers" slot. */
const MARK_VARIANTS: readonly QuestDef[] = [
    { id: 'mark_30', type: 'NUMBERS_MARKED', target: 30, reward: 75 },
    { id: 'mark_50', type: 'NUMBERS_MARKED', target: 50, reward: 100 },
];

/** Variants for the "challenge" slot. */
const CHALLENGE_VARIANTS: readonly QuestDef[] = [
    { id: 'win_1', type: 'GAMES_WON', target: 1, reward: 150 },
    { id: 'powerup_1', type: 'POWERUP_USED', target: 1, reward: 50 },
];

export const DAILY_QUEST_COUNT = 3;

// ============================================================================
// GENERATION
// ============================================================================

/** Local-date key (YYYY-MM-DD). Quests reset at local midnight. */
export function todayKey(now: Date = new Date()): string {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Small deterministic string hash (FNV-ish) for date-seeded selection. */
function hashKey(key: string): number {
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) {
        h ^= key.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
}

/**
 * Deterministic daily quest set: one "play" quest, one "mark" quest and
 * one challenge. Same date → same quests for every player.
 */
export function getQuestsForDay(dateKey: string): QuestDef[] {
    const h = hashKey(dateKey);
    return [
        PLAY_VARIANTS[h % PLAY_VARIANTS.length],
        MARK_VARIANTS[(h >>> 3) % MARK_VARIANTS.length],
        CHALLENGE_VARIANTS[(h >>> 6) % CHALLENGE_VARIANTS.length],
    ];
}
