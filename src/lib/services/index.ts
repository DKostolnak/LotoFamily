/**
 * Services Module Barrel Export
 */

// Storage
export {
    storageService,
    STORAGE_KEYS,
    type PlayerStats,
    getPlayerName,
    setPlayerName,
    getPlayerAvatar,
    setPlayerAvatar,
    getCoins,
    setCoins,
    getInventory,
    setInventory,
    getStats,
    setStats,
    getActiveTheme,
    setActiveTheme,
    getActiveSkin,
    setActiveSkin,
    getLastDailyBonus,
    setLastDailyBonus,
} from './storage';

// Socket
export {
    socketService,
    type GameSocket,
    type ConnectionStatus,
    type ConnectionConfig,
    type SocketServiceState,
} from './socket';

// Audio
export { audioService } from './audio';

// Analytics
export { analytics } from './analytics';

// Crash Reporting
export {
    crashReporting,
    captureException,
    captureMessage,
    addBreadcrumb,
} from './crashReporting';
