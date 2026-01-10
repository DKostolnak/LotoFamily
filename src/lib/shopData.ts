export interface ShopItem {
    id: string;
    name: string;
    icon: string;
    price: number;
    description: string;
    category: 'avatar' | 'skin' | 'theme';
    /** CSS class name for themes */
    themeClass?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
    // Avatars
    { id: 'avatar_unicorn', icon: '🦄', name: 'Unicorn', price: 500, description: 'Magical and unique!', category: 'avatar' },
    { id: 'avatar_robot', icon: '🤖', name: 'Robot', price: 300, description: 'Beep boop!', category: 'avatar' },
    { id: 'avatar_alien', icon: '👽', name: 'Alien', price: 300, description: 'Greetings earthling.', category: 'avatar' },
    { id: 'avatar_dragon', icon: '🐲', name: 'Dragon', price: 1000, description: 'Legendary power!', category: 'avatar' },
    { id: 'avatar_ghost', icon: '👻', name: 'Ghost', price: 250, description: 'Boo!', category: 'avatar' },
    { id: 'avatar_clown', icon: '🤡', name: 'Clown', price: 200, description: 'Honk honk!', category: 'avatar' },
    { id: 'avatar_cowboy', icon: '🤠', name: 'Cowboy', price: 200, description: 'Yee-haw!', category: 'avatar' },
    { id: 'avatar_hero', icon: '🦸', name: 'Hero', price: 400, description: 'Saving the day!', category: 'avatar' },
    { id: 'avatar_princess', icon: '👸', name: 'Princess', price: 400, description: 'Royalty.', category: 'avatar' },
    { id: 'avatar_santa', icon: '🎅', name: 'Santa', price: 500, description: 'Ho ho ho!', category: 'avatar' },

    // Card Themes (Classic is default/free)
    { id: 'theme_classic', icon: '🪵', name: 'Classic Wood', price: 0, description: 'The original', category: 'theme', themeClass: 'classic' },
    { id: 'theme_ocean', icon: '🌊', name: 'Ocean Blue', price: 300, description: 'Deep sea vibes', category: 'theme', themeClass: 'ocean' },
    { id: 'theme_royal', icon: '👑', name: 'Royal Purple', price: 500, description: 'Regal and elegant', category: 'theme', themeClass: 'royal' },
    { id: 'theme_neon', icon: '💜', name: 'Neon Nights', price: 800, description: 'Cyberpunk glow', category: 'theme', themeClass: 'neon' },
    { id: 'theme_nature', icon: '🌿', name: 'Forest Green', price: 400, description: 'Natural calm', category: 'theme', themeClass: 'nature' },
];

/** Get the CSS class for a theme by its ID */
export function getThemeClass(themeId: string): string {
    const item = SHOP_ITEMS.find(i => i.id === themeId);
    return item?.themeClass || 'classic';
}

/** Default theme (always available) */
export const DEFAULT_THEME = 'theme_classic';
