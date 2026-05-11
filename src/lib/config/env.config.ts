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
// SUPABASE CONFIGURATION
// =============================================================================

/**
 * Supabase Project URL + Anon Key
 *
 * Kde ich nájdeš:
 *   1. Choď na https://supabase.com → tvoj projekt
 *   2. Settings → API
 *   3. Skopíruj "Project URL" a "anon public" key
 *
 * Nastav v .env.local pre lokálny vývoj:
 *   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * BEZPEČNOSŤ:
 *   - anon key JE verejný — môžeš ho commitnúť do git (je to zamýšlané)
 *   - Bezpečnosť riadi Row Level Security (RLS) priamo v Supabase
 *   - service_role key (admin) NIKDY nedávaj do mobilnej app!
 */
export const SUPABASE_URL =
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export const SUPABASE_ANON_KEY =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// =============================================================================
// SERVER CONFIGURATION (legacy — bude nahradené Supabase)
// =============================================================================

/**
 * @deprecated Použiť Supabase Realtime namiesto Socket.io
 * Ponechané pre spätú kompatibilitu počas migrácie.
 */
export const SERVER_URL =
    process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:3000';

// =============================================================================
// THIRD-PARTY SERVICE KEYS
// =============================================================================

/**
 * AdMob configuration. Set via EXPO_PUBLIC_ADMOB_* env vars.
 * Leave empty until you have AdMob app + ad unit IDs from the AdMob console.
 */
export const ADMOB = {
    androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID,
    iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID,
    rewardedIdAndroid: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID,
    rewardedIdIos: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS,
    interstitialIdAndroid: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID,
    interstitialIdIos: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS,
} as const;

/**
 * RevenueCat configuration. Set via EXPO_PUBLIC_REVENUECAT_* env vars.
 * Get these keys from app.revenuecat.com -> Project -> API keys.
 */
export const REVENUECAT = {
    apiKeyIos: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
    apiKeyAndroid: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
} as const;

/**
 * Sentry crash-reporting configuration.
 */
export const SENTRY = {
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
} as const;

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

    /** Whether ads are configured (any AdMob app id present) */
    enableAds: !!ADMOB.androidAppId || !!ADMOB.iosAppId,

    /** Whether IAP is configured (any RevenueCat key present) */
    enableIAP: !!REVENUECAT.apiKeyIos || !!REVENUECAT.apiKeyAndroid,
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
// IMPORTANT: replace these with the real hosted URLs before App Store / Play Store
// submission. Apple and Google reject apps without working Privacy Policy and
// Terms URLs. The in-app PrivacyPolicyModal / TermsModal cover the same content
// so users (and reviewers) always have an offline-reachable copy.
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

    supabase: {
        url: SUPABASE_URL,
        anonKey: SUPABASE_ANON_KEY,
    },
    
    features: FEATURES,
    
    eas: {
        projectId: EAS_PROJECT_ID,
        runtimeVersion: RUNTIME_VERSION,
    },
} as const;

export default ENV;
