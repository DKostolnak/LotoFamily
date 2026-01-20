/**
 * Library Module - Barrel Export
 * 
 * Central export point for all library modules.
 * Import from '@/lib' instead of individual files.
 * 
 * Organized by concern:
 * - config: Configuration values and constants
 * - i18n: Internationalization
 * - services: External services (storage, audio, etc.)
 * - shop: Shop domain logic
 * - store: State management
 * - types: TypeScript type definitions
 */

// ============================================================================
// Configuration
// ============================================================================
export * from './config';

// ============================================================================
// Internationalization
// ============================================================================
export { translations, getTranslations, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './i18n';
export type { Language, TranslationKeys } from './i18n';

// ============================================================================
// State Management
// ============================================================================
export { 
    useGameStore, 
    usePlayerProfile, 
    useEconomy, 
    usePlayerStats, 
    useSettings, 
    useAppState 
} from './store';
export type { GameStore, PlayerStats } from './store';

// ============================================================================
// Shop Domain
// ============================================================================
export {
    SHOP_ITEMS,
    getItemsByCategory,
    getItemById,
    isItemFree,
    getDefaultInventory,
    isThemeItem,
    isSkinItem,
    isAvatarItem,
} from './shop';
export type { ShopItem, ShopCategory, AvatarShopItem, ThemeShopItem, SkinShopItem } from './shop';

// ============================================================================
// Types
// ============================================================================
export * from './types';
