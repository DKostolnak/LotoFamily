/**
 * Environment Configuration
 * 
 * Centralized environment variable access following Expo best practices.
 * Uses EXPO_PUBLIC_ prefix for client-side variables.
 * Access app config values via Constants.expoConfig.
 * 
 * @see https://docs.expo.dev/guides/environment-variables/
 */

import Constants from 'expo-constants';

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

type AppVariant = 'development' | 'preview' | 'production';

/**
 * Current app variant (set via APP_VARIANT env var in eas.json)
 * Available at runtime via Constants.expoConfig.extra
 */
export const APP_VARIANT: AppVariant = 
    (Constants.expoConfig?.extra?.appVariant as AppVariant) ?? 'production';

export const IS_DEVELOPMENT = APP_VARIANT === 'development';
export const IS_PREVIEW = APP_VARIANT === 'preview';
export const IS_PRODUCTION = APP_VARIANT === 'production';

// __DEV__ is a React Native global for detecting debug builds
export const IS_DEBUG = __DEV__;

// =============================================================================
// APP METADATA
// =============================================================================

/**
 * App version from app.config.ts
 * Accessed via Constants.expoConfig (not importing app.json directly)
 */
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const APP_BUILD_NUMBER = 
    Constants.expoConfig?.ios?.buildNumber ?? 
    Constants.expoConfig?.android?.versionCode?.toString() ?? 
    '1';

export const APP_NAME = Constants.expoConfig?.name ?? 'LOTO';
export const APP_SLUG = Constants.expoConfig?.slug ?? 'loto-bingo';

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================

/**
 * Socket.io server URL
 * 
 * Set via EXPO_PUBLIC_SERVER_URL environment variable.
 * - In development: Uses localhost or local network IP
 * - In preview/production: Uses deployed server URL
 * 
 * Configure in:
 * - .env.local for local development
 * - eas.json for EAS builds
 */
export const SERVER_URL = 
    process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:3000';

// =============================================================================
// FEATURE FLAGS
// =============================================================================

/**
 * Feature flags that can be toggled per environment
 */
export const FEATURES = {
    /** Enable detailed console logging */
    enableLogging: IS_DEBUG || IS_DEVELOPMENT,
    
    /** Enable performance monitoring */
    enablePerformanceMonitoring: IS_PRODUCTION,
    
    /** Enable crash reporting */
    enableCrashReporting: IS_PRODUCTION || IS_PREVIEW,
    
    /** Show developer tools in UI */
    showDevTools: IS_DEVELOPMENT,
    
    /** Enable analytics */
    enableAnalytics: IS_PRODUCTION,
} as const;

// =============================================================================
// EAS UPDATE
// =============================================================================

/**
 * EAS Update configuration
 * Runtime version is used to determine update compatibility
 */
export const EAS_PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId ?? '';
export const RUNTIME_VERSION = Constants.expoConfig?.runtimeVersion;

// =============================================================================
// APP STORE CONFIGURATION
// =============================================================================

/**
 * App Store IDs for rating and deep linking
 * Update these values after your app is published
 */
export const APP_STORE_ID = '6741234567'; // Apple App Store ID (numeric)
export const PLAY_STORE_ID = 'com.loto.bingo'; // Google Play Store package name
export const PRIVACY_POLICY_URL = 'https://loto-game.app/privacy';
export const TERMS_OF_SERVICE_URL = 'https://loto-game.app/terms';
export const SUPPORT_EMAIL = 'support@loto-game.app';

// =============================================================================
// EXPORTS FOR CONVENIENCE
// =============================================================================

export const ENV = {
    variant: APP_VARIANT,
    isDevelopment: IS_DEVELOPMENT,
    isPreview: IS_PREVIEW,
    isProduction: IS_PRODUCTION,
    isDebug: IS_DEBUG,
    
    app: {
        name: APP_NAME,
        slug: APP_SLUG,
        version: APP_VERSION,
        buildNumber: APP_BUILD_NUMBER,
    },
    
    server: {
        url: SERVER_URL,
    },
    
    features: FEATURES,
    
    eas: {
        projectId: EAS_PROJECT_ID,
        runtimeVersion: RUNTIME_VERSION,
    },
} as const;

export default ENV;
