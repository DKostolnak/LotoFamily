/**
 * Avatar Configuration
 * 
 * Centralized avatar management.
 * Single source of truth - eliminates duplicate DEFAULT_AVATARS definitions.
 */

// ============================================================================
// DEFAULT AVATARS (Free for all players)
// ============================================================================

export const DEFAULT_AVATARS = [
    '🐻', // Bear
    '🦁', // Lion
    '🐯', // Tiger
    '🐼', // Panda
    '🐨', // Koala
    '🐸', // Frog
    '🐙', // Octopus
    '🦊', // Fox
] as const;

export type DefaultAvatar = typeof DEFAULT_AVATARS[number];

// ============================================================================
// PREMIUM AVATARS (Purchasable)
// ============================================================================

export interface PremiumAvatar {
    readonly id: string;
    readonly icon: string;
    readonly name: string;
    readonly price: number;
    readonly description: string;
}

export const PREMIUM_AVATARS: readonly PremiumAvatar[] = [
    { id: 'avatar_unicorn', icon: '🦄', name: 'Unicorn', price: 500, description: 'Magical and unique!' },
    { id: 'avatar_robot', icon: '🤖', name: 'Robot', price: 300, description: 'Beep boop!' },
    { id: 'avatar_alien', icon: '👽', name: 'Alien', price: 300, description: 'Greetings earthling.' },
    { id: 'avatar_dragon', icon: '🐲', name: 'Dragon', price: 1000, description: 'Legendary power!' },
    { id: 'avatar_ghost', icon: '👻', name: 'Ghost', price: 250, description: 'Boo!' },
] as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get a random default avatar
 */
export function getRandomAvatar(): DefaultAvatar {
    const index = Math.floor(Math.random() * DEFAULT_AVATARS.length);
    return DEFAULT_AVATARS[index];
}

/**
 * Check if an avatar is a default (free) avatar
 */
export function isDefaultAvatar(avatar: string): avatar is DefaultAvatar {
    return (DEFAULT_AVATARS as readonly string[]).includes(avatar);
}

/**
 * Get all available avatars for a player based on their inventory
 */
export function getAvailableAvatars(inventory: string[]): string[] {
    const purchasedIcons = PREMIUM_AVATARS
        .filter(a => inventory.includes(a.id))
        .map(a => a.icon);
    
    return [...DEFAULT_AVATARS, ...purchasedIcons];
}

/**
 * Get the next avatar in rotation
 */
export function getNextAvatar(currentAvatar: string, inventory: string[]): string {
    const available = getAvailableAvatars(inventory);
    const currentIndex = available.indexOf(currentAvatar);
    const nextIndex = (currentIndex + 1) % available.length;
    return available[nextIndex] ?? DEFAULT_AVATARS[0];
}
