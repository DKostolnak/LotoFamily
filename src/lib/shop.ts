/**
 * Shop Domain Types and Data
 * 
 * Defines shop items and categories with proper type safety.
 * Follows Interface Segregation Principle - separate types for different item categories.
 */

import { ThemeId, SkinId } from './config/theme.config';
import { PREMIUM_AVATARS } from './config/avatar.config';

// ============================================================================
// TYPES
// ============================================================================

export type ShopCategory = 'avatar' | 'skin' | 'theme';

interface BaseShopItem {
    readonly id: string;
    readonly name: string;
    readonly icon: string;
    readonly price: number;
    readonly description: string;
    readonly category: ShopCategory;
}

export interface AvatarShopItem extends BaseShopItem {
    readonly category: 'avatar';
}

export interface ThemeShopItem extends BaseShopItem {
    readonly category: 'theme';
    readonly themeId: ThemeId;
}

export interface SkinShopItem extends BaseShopItem {
    readonly category: 'skin';
    readonly skinId: SkinId;
}

export type ShopItem = AvatarShopItem | ThemeShopItem | SkinShopItem;

// ============================================================================
// SHOP INVENTORY
// ============================================================================

const AVATAR_ITEMS: readonly AvatarShopItem[] = PREMIUM_AVATARS.map(a => ({
    ...a,
    category: 'avatar' as const,
}));

const THEME_ITEMS: readonly ThemeShopItem[] = [
    {
        id: 'theme_classic',
        icon: '🪵',
        name: 'Classic Wood',
        price: 0,
        description: 'The original',
        category: 'theme',
        themeId: 'theme_classic',
    },
    {
        id: 'theme_ocean',
        icon: '🌊',
        name: 'Ocean Blue',
        price: 300,
        description: 'Deep sea vibes',
        category: 'theme',
        themeId: 'theme_ocean',
    },
    {
        id: 'theme_royal',
        icon: '👑',
        name: 'Royal Purple',
        price: 500,
        description: 'Regal and elegant',
        category: 'theme',
        themeId: 'theme_royal',
    },
] as const;

const SKIN_ITEMS: readonly SkinShopItem[] = [
    {
        id: 'skin_classic',
        icon: '🔴',
        name: 'Classic Chip',
        price: 0,
        description: 'Standard red marker',
        category: 'skin',
        skinId: 'skin_classic',
    },
    {
        id: 'skin_coin',
        icon: '🪙',
        name: 'Gold Coin',
        price: 1000,
        description: 'Shiny and rich!',
        category: 'skin',
        skinId: 'skin_coin',
    },
    {
        id: 'skin_poker',
        icon: '🔵',
        name: 'Poker Chip',
        price: 600,
        description: 'High stakes style',
        category: 'skin',
        skinId: 'skin_poker',
    },
] as const;

/** All shop items combined */
export const SHOP_ITEMS: readonly ShopItem[] = [
    ...AVATAR_ITEMS,
    ...THEME_ITEMS,
    ...SKIN_ITEMS,
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get items by category
 */
export function getItemsByCategory(category: ShopCategory): readonly ShopItem[] {
    return SHOP_ITEMS.filter(item => item.category === category);
}

/**
 * Get a specific item by ID
 */
export function getItemById(itemId: string): ShopItem | undefined {
    return SHOP_ITEMS.find(item => item.id === itemId);
}

/**
 * Check if an item is free
 */
export function isItemFree(itemId: string): boolean {
    const item = getItemById(itemId);
    return item?.price === 0;
}

/**
 * Get default inventory (free items)
 */
export function getDefaultInventory(): string[] {
    return SHOP_ITEMS
        .filter(item => item.price === 0)
        .map(item => item.id);
}

/**
 * Type guard for theme items
 */
export function isThemeItem(item: ShopItem): item is ThemeShopItem {
    return item.category === 'theme';
}

/**
 * Type guard for skin items
 */
export function isSkinItem(item: ShopItem): item is SkinShopItem {
    return item.category === 'skin';
}

/**
 * Type guard for avatar items
 */
export function isAvatarItem(item: ShopItem): item is AvatarShopItem {
    return item.category === 'avatar';
}
