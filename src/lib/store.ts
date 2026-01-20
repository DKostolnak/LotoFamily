/**
 * Store Module - Backward Compatibility Layer
 * 
 * This file maintains backward compatibility with existing imports.
 * New code should import from './store/index' directly.
 * 
 * @deprecated Import from './store' instead
 */

// Re-export everything from the new modular store
export {
    useGameStore,
    usePlayerProfile,
    useEconomy,
    usePlayerStats,
    useSettings,
    useAppState,
} from './store/index';

export type { GameStore, PlayerStats } from './store/types';

// Re-export DEFAULT_AVATARS from config for backward compatibility
export { DEFAULT_AVATARS } from './config/avatar.config';
