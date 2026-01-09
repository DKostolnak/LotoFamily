export type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Master';

export interface TierInfo {
    name: Tier;
    minRp: number;
    color: string;
    icon: string;
}

export const TIERS: TierInfo[] = [
    { name: 'Bronze', minRp: 0, color: '#cd7f32', icon: '🥉' },
    { name: 'Silver', minRp: 200, color: '#c0c0c0', icon: '🥈' },
    { name: 'Gold', minRp: 500, color: '#ffd700', icon: '🥇' },
    { name: 'Diamond', minRp: 1000, color: '#b9f2ff', icon: '💎' },
    { name: 'Master', minRp: 2000, color: '#ff00ff', icon: '👑' },
];

export function getTier(rp: number): TierInfo {
    // Iterate in reverse to find the highest matching tier
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (rp >= TIERS[i].minRp) {
            return TIERS[i];
        }
    }
    return TIERS[0];
}

export function getNextTier(rp: number): { tier: TierInfo | null; remaining: number } {
    const current = getTier(rp);
    const currentIndex = TIERS.findIndex(t => t.name === current.name);

    if (currentIndex < TIERS.length - 1) {
        const next = TIERS[currentIndex + 1];
        return { tier: next, remaining: next.minRp - rp };
    }

    return { tier: null, remaining: 0 };
}
