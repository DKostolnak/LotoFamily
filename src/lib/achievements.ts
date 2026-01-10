/**
 * Achievements System
 * 
 * Defines all unlockable badges and provides functions to check
 * which achievements a player has earned based on their stats.
 */

export interface Achievement {
    id: string;
    name: string;
    icon: string;
    description: string;
    category: 'wins' | 'games' | 'speed' | 'collection' | 'loyalty';
    /** Function to check if achievement is unlocked */
    check: (stats: PlayerAchievementStats) => boolean;
    /** Progress hint for locked achievements */
    getProgress?: (stats: PlayerAchievementStats) => { current: number; target: number };
}

export interface PlayerAchievementStats {
    gamesPlayed: number;
    wins: number;
    flats: number;
    winStreak: number;
    maxWinStreak: number;
    fastestWinMs: number; // 0 means no wins yet
    totalCoinsEarned: number;
    loginStreak: number;
    inventoryCount: number;
}

/**
 * All available achievements
 */
export const ACHIEVEMENTS: Achievement[] = [
    // Win-based achievements
    {
        id: 'first_win',
        name: 'First Victory',
        icon: '🏆',
        description: 'Win your first game',
        category: 'wins',
        check: (s) => s.wins >= 1,
        getProgress: (s) => ({ current: Math.min(s.wins, 1), target: 1 }),
    },
    {
        id: 'streak_3',
        name: 'Hat Trick',
        icon: '🎩',
        description: 'Win 3 games in a row',
        category: 'wins',
        check: (s) => s.maxWinStreak >= 3,
        getProgress: (s) => ({ current: Math.min(s.maxWinStreak, 3), target: 3 }),
    },
    {
        id: 'streak_5',
        name: 'On Fire',
        icon: '🔥',
        description: 'Win 5 games in a row',
        category: 'wins',
        check: (s) => s.maxWinStreak >= 5,
        getProgress: (s) => ({ current: Math.min(s.maxWinStreak, 5), target: 5 }),
    },
    {
        id: 'streak_10',
        name: 'Unstoppable',
        icon: '⚡',
        description: 'Win 10 games in a row',
        category: 'wins',
        check: (s) => s.maxWinStreak >= 10,
        getProgress: (s) => ({ current: Math.min(s.maxWinStreak, 10), target: 10 }),
    },

    // Games played achievements
    {
        id: 'games_10',
        name: 'Getting Started',
        icon: '🎮',
        description: 'Play 10 games',
        category: 'games',
        check: (s) => s.gamesPlayed >= 10,
        getProgress: (s) => ({ current: Math.min(s.gamesPlayed, 10), target: 10 }),
    },
    {
        id: 'games_50',
        name: 'Regular',
        icon: '🎯',
        description: 'Play 50 games',
        category: 'games',
        check: (s) => s.gamesPlayed >= 50,
        getProgress: (s) => ({ current: Math.min(s.gamesPlayed, 50), target: 50 }),
    },
    {
        id: 'games_100',
        name: 'Veteran',
        icon: '🎖️',
        description: 'Play 100 games',
        category: 'games',
        check: (s) => s.gamesPlayed >= 100,
        getProgress: (s) => ({ current: Math.min(s.gamesPlayed, 100), target: 100 }),
    },

    // Speed achievements
    {
        id: 'speed_demon',
        name: 'Speed Demon',
        icon: '⏱️',
        description: 'Win a game in under 60 seconds',
        category: 'speed',
        check: (s) => s.fastestWinMs > 0 && s.fastestWinMs < 60000,
    },

    // Collection achievements
    {
        id: 'flat_master',
        name: 'Flat Master',
        icon: '🏠',
        description: 'Claim 10 flats total',
        category: 'collection',
        check: (s) => s.flats >= 10,
        getProgress: (s) => ({ current: Math.min(s.flats, 10), target: 10 }),
    },
    {
        id: 'collector',
        name: 'Collector',
        icon: '🛍️',
        description: 'Own 5 shop items',
        category: 'collection',
        check: (s) => s.inventoryCount >= 5,
        getProgress: (s) => ({ current: Math.min(s.inventoryCount, 5), target: 5 }),
    },
    {
        id: 'rich',
        name: 'High Roller',
        icon: '💰',
        description: 'Earn 1000 coins total',
        category: 'collection',
        check: (s) => s.totalCoinsEarned >= 1000,
        getProgress: (s) => ({ current: Math.min(s.totalCoinsEarned, 1000), target: 1000 }),
    },

    // Loyalty achievements
    {
        id: 'loyal',
        name: 'Loyal Player',
        icon: '❤️',
        description: 'Play 7 days in a row',
        category: 'loyalty',
        check: (s) => s.loginStreak >= 7,
        getProgress: (s) => ({ current: Math.min(s.loginStreak, 7), target: 7 }),
    },
];

/**
 * Check which achievements a player has newly unlocked
 * @param stats Current player stats
 * @param alreadyUnlocked IDs of already unlocked achievements
 * @returns Array of newly unlocked achievement IDs
 */
export function checkNewAchievements(
    stats: PlayerAchievementStats,
    alreadyUnlocked: string[]
): Achievement[] {
    const unlockedSet = new Set(alreadyUnlocked);

    return ACHIEVEMENTS.filter(achievement => {
        // Skip if already unlocked
        if (unlockedSet.has(achievement.id)) return false;
        // Check if now unlocked
        return achievement.check(stats);
    });
}

/**
 * Get achievement by ID
 */
export function getAchievement(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find(a => a.id === id);
}

/**
 * Get all achievements with unlock status
 */
export function getAchievementsWithStatus(
    stats: PlayerAchievementStats,
    unlockedIds: string[]
): Array<Achievement & { unlocked: boolean; progress?: { current: number; target: number } }> {
    const unlockedSet = new Set(unlockedIds);

    return ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        unlocked: unlockedSet.has(achievement.id),
        progress: !unlockedSet.has(achievement.id) && achievement.getProgress
            ? achievement.getProgress(stats)
            : undefined,
    }));
}
