export interface ShopItem {
    id: string;
    name: string;
    icon: string;
    price: number;
    description: string;
    category: 'avatar' | 'skin';
}

export const SHOP_ITEMS: ShopItem[] = [
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
];
