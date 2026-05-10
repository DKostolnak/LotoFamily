/**
 * Season / Battle Pass Configuration
 *
 * Generates the 50-level reward table for the current season.
 * Pure / deterministic — no I/O, safe to call from store init.
 *
 * Design:
 *  - 50 levels per season
 *  - XP curve: linear from 100 (level 1) to 2500 (level 50)
 *  - Cumulative XP needed: ~62,500 over a 30-day season → ~2,000 XP/day
 *  - Two reward tracks: free + premium
 *  - Premium milestone rewards at levels 10/20/25/30/40/50 (themes, skins, avatars)
 */

export type SeasonRewardType = 'coins' | 'powerup' | 'theme' | 'skin' | 'avatar';

export interface SeasonReward {
    type: SeasonRewardType;
    /** For coins / powerup. */
    amount?: number;
    /** For theme / skin / avatar / powerup item id. */
    itemId?: string;
    track: 'free' | 'premium';
}

export interface SeasonLevel {
    /** 1-indexed (1..50). */
    level: number;
    /** Cumulative XP needed to *reach* this level from XP=0. */
    xpRequired: number;
    freeReward: SeasonReward;
    premiumReward: SeasonReward;
}

export const SEASON_LEVEL_COUNT = 50;
export const SEASON_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SEASON_GRACE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SEASON_PREMIUM_PRICE_USD = '$4.99';
export const SEASON_PREMIUM_PRODUCT_ID = 'season_premium';

/** Level 1 → 100 XP, Level 50 → 2500 XP (incremental cost to reach this level). */
const XP_AT_LEVEL_1 = 100;
const XP_AT_LEVEL_50 = 2500;

/** Per-level XP cost (incremental, not cumulative). */
function incrementalXpForLevel(level: number): number {
    // Linear interpolation between levels 1 and 50
    const t = (level - 1) / (SEASON_LEVEL_COUNT - 1);
    return Math.round(XP_AT_LEVEL_1 + t * (XP_AT_LEVEL_50 - XP_AT_LEVEL_1));
}

/** Free reward pattern, cycles every 5 levels. */
const FREE_REWARD_PATTERN: Omit<SeasonReward, 'track'>[] = [
    { type: 'coins', amount: 25 },
    { type: 'coins', amount: 50 },
    { type: 'coins', amount: 25 },
    { type: 'powerup', itemId: 'peek', amount: 1 },
    { type: 'coins', amount: 100 },
];

/** Premium reward pattern (non-milestone levels), cycles every 5 levels. */
const PREMIUM_REWARD_PATTERN: Omit<SeasonReward, 'track'>[] = [
    { type: 'coins', amount: 50 },
    { type: 'coins', amount: 100 },
    { type: 'powerup', itemId: 'luckyMark', amount: 1 },
    { type: 'coins', amount: 200 },
    { type: 'coins', amount: 500 },
];

/** Premium milestone rewards at specific levels (override the pattern). */
const PREMIUM_MILESTONES: Record<number, Omit<SeasonReward, 'track'>> = {
    10: { type: 'theme', itemId: 'theme_summer' },
    20: { type: 'skin', itemId: 'skin_neon' },
    25: { type: 'avatar', itemId: 'avatar_premium_1' },
    30: { type: 'theme', itemId: 'theme_winter' },
    40: { type: 'skin', itemId: 'skin_holographic' },
    50: { type: 'avatar', itemId: 'avatar_premium_2', amount: 1000 }, // bonus 1000 coins
};

function freeRewardForLevel(level: number): SeasonReward {
    const base = FREE_REWARD_PATTERN[(level - 1) % FREE_REWARD_PATTERN.length];
    return { ...base, track: 'free' };
}

function premiumRewardForLevel(level: number): SeasonReward {
    const milestone = PREMIUM_MILESTONES[level];
    if (milestone) {
        return { ...milestone, track: 'premium' };
    }
    const base = PREMIUM_REWARD_PATTERN[(level - 1) % PREMIUM_REWARD_PATTERN.length];
    return { ...base, track: 'premium' };
}

/**
 * Build the deterministic 50-level reward table for a season.
 * `seasonId` is currently unused but reserved for future seasonal themes.
 */
export function generateSeasonLevels(_seasonId: string): SeasonLevel[] {
    let cumulativeXp = 0;
    return Array.from({ length: SEASON_LEVEL_COUNT }, (_, i) => {
        const level = i + 1;
        cumulativeXp += incrementalXpForLevel(level);
        return {
            level,
            xpRequired: cumulativeXp,
            freeReward: freeRewardForLevel(level),
            premiumReward: premiumRewardForLevel(level),
        };
    });
}

/**
 * Compute current level + XP-into-level given a total seasonXp value
 * and the season's level table.
 *
 * Returns:
 *  - level: 1..50 (the level the user has *reached* — i.e. completed levels + 1)
 *  - xpIntoLevel: XP earned past the start of this level
 *  - xpForNextLevel: XP cost to reach the next level (0 if at max)
 */
export function deriveLevelFromXp(
    seasonXp: number,
    levels: SeasonLevel[]
): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
    let currentLevel = 1;
    let prevCumulative = 0;
    for (let i = 0; i < levels.length; i++) {
        const lvl = levels[i];
        if (seasonXp < lvl.xpRequired) {
            currentLevel = i + 1;
            const xpIntoLevel = seasonXp - prevCumulative;
            const xpForNextLevel = lvl.xpRequired - prevCumulative;
            return { level: currentLevel, xpIntoLevel, xpForNextLevel };
        }
        prevCumulative = lvl.xpRequired;
    }
    // Maxed out
    return { level: SEASON_LEVEL_COUNT, xpIntoLevel: 0, xpForNextLevel: 0 };
}

/**
 * Generate a stable id for the season starting at the given timestamp,
 * e.g. 'season_2026_05'.
 */
export function makeSeasonId(startedAt: number): string {
    const d = new Date(startedAt);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `season_${year}_${month}`;
}
