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
export { analytics, ANALYTICS_EVENTS, type AnalyticsEvent } from './analytics';

// Crash Reporting
export {
    crashReporting,
    captureException,
    captureMessage,
    addBreadcrumb,
} from './crashReporting';

// Ads
export {
    adsService,
    AdsService,
    AD_PLACEMENTS,
    type AdProvider,
    type AdType,
    type AdPlacement,
    type RewardedAdResult,
} from './ads';

// Notifications
export { notificationsService, type NotificationCategory } from './notifications';

// In-App Purchases
export {
    purchasesService,
    PurchasesService,
    PRODUCT_IDS,
    type PurchaseProvider,
    type ProductPackage,
    type ProductId,
    type PurchaseResult,
} from './purchases';
