export interface ShopItem {
    id: string;
    name: string;
    icon: string;
    price: number;
    description: string;
    category: 'avatar' | 'skin' | 'theme';
    /** Theme Style Identifier */
    themeClass?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
    // Avatars
    { id: 'avatar_unicorn', icon: '🦄', name: 'Unicorn', price: 500, description: 'Magical and unique!', category: 'avatar' },
    { id: 'avatar_robot', icon: '🤖', name: 'Robot', price: 300, description: 'Beep boop!', category: 'avatar' },
    { id: 'avatar_alien', icon: '👽', name: 'Alien', price: 300, description: 'Greetings earthling.', category: 'avatar' },
    { id: 'avatar_dragon', icon: '🐲', name: 'Dragon', price: 1000, description: 'Legendary power!', category: 'avatar' },
    { id: 'avatar_ghost', icon: '👻', name: 'Ghost', price: 250, description: 'Boo!', category: 'avatar' },

    // Card Themes (Classic is default/free)
    { id: 'theme_classic', icon: '🪵', name: 'Classic Wood', price: 0, description: 'The original', category: 'theme', themeClass: 'classic' },
    { id: 'theme_ocean', icon: '🌊', name: 'Ocean Blue', price: 300, description: 'Deep sea vibes', category: 'theme', themeClass: 'ocean' },
    { id: 'theme_royal', icon: '👑', name: 'Royal Purple', price: 500, description: 'Regal and elegant', category: 'theme', themeClass: 'royal' },

    // Marker Skins
    { id: 'skin_classic', icon: '🔴', name: 'Classic Chip', price: 0, description: 'Standard red marker', category: 'skin' },
    { id: 'skin_coin', icon: '🪙', name: 'Gold Coin', price: 1000, description: 'Shiny and rich!', category: 'skin' },
    { id: 'skin_poker', icon: '🔵', name: 'Poker Chip', price: 600, description: 'High stakes style', category: 'skin' },
];

export const DEFAULT_THEME = 'theme_classic';
export const DEFAULT_SKIN = 'skin_classic';
