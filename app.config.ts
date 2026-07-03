import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Expo Configuration
 * 
 * This file provides type-safe, dynamic configuration for the Expo app.
 * Preferred over app.json for advanced configuration needs.
 * 
 * Features:
 * - Environment-based app variants (development/preview/production)
 * - Continuous Native Generation (CNG) via prebuild
 * - EAS Update for OTA updates
 * - Typed routes for navigation safety
 * 
 * @see https://docs.expo.dev/workflow/configuration/
 * @see https://docs.expo.dev/workflow/continuous-native-generation/
 */

// Environment detection
const APP_VARIANT = process.env.APP_VARIANT as 'development' | 'preview' | 'production' | undefined;
const IS_DEV = APP_VARIANT === 'development';
const IS_PREVIEW = APP_VARIANT === 'preview';

// App identifiers per environment (allows multiple installs on same device)
const getAppIdentifier = (): string => {
    if (IS_DEV) return 'com.loto.bingo.dev';
    if (IS_PREVIEW) return 'com.loto.bingo.preview';
    return 'com.loto.bingo';
};

// App name per environment
const getAppName = (): string => {
    if (IS_DEV) return 'LOTO (Dev)';
    if (IS_PREVIEW) return 'LOTO (Preview)';
    return 'LOTO - Classic Bingo';
};

// AdMob app IDs — real IDs come from env (EXPO_PUBLIC_ADMOB_*_APP_ID set at
// prebuild time). Without them we fall back to Google's public TEST app IDs
// so development and preview builds can render test ads. Production release
// MUST provide real IDs (see .env.example).
const ADMOB_ANDROID_APP_ID =
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || 'ca-app-pub-3940256099942544~3347511713';
const ADMOB_IOS_APP_ID =
    process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || 'ca-app-pub-3940256099942544~1458002511';

const USER_TRACKING_DESCRIPTION =
    'This identifier will be used to show you more relevant ads and helps keep the game free.';

// Google's recommended SKAdNetwork IDs for AdMob attribution on iOS.
// @see https://developers.google.com/admob/ios/ios14#skadnetwork
const SK_AD_NETWORK_ITEMS = [
    'cstr6suwn9.skadnetwork',
    '4fzdc2evr5.skadnetwork',
    '4pfyvq9l8r.skadnetwork',
    '2fnua5tdw4.skadnetwork',
    'ydx93a7ass.skadnetwork',
    '5a6flpkh64.skadnetwork',
    'p78axxw29g.skadnetwork',
    'v72qych5uu.skadnetwork',
    'ludvb6z3bs.skadnetwork',
    'cp8zw746q7.skadnetwork',
    '3sh42y64q3.skadnetwork',
    'c6k4g5qg8m.skadnetwork',
    's39g8k73mm.skadnetwork',
    '3qy4746246.skadnetwork',
    'hs6bdukanm.skadnetwork',
    'mlmmfzh3r3.skadnetwork',
    'v4nxqhlyqp.skadnetwork',
    'wzmmz9fp6w.skadnetwork',
    'su67r6k2v3.skadnetwork',
    'yclnxrl5pm.skadnetwork',
    '7ug5zh24hu.skadnetwork',
    'gta9lk7p23.skadnetwork',
    'vutu7akeur.skadnetwork',
    'y5ghdn5j9k.skadnetwork',
    'v9wttpbfk9.skadnetwork',
    'n38lu8286q.skadnetwork',
    '47vhws6wlr.skadnetwork',
    'kbd757ywx3.skadnetwork',
    '9t245vhmpl.skadnetwork',
    'a2p9lx4jpn.skadnetwork',
    '22mmun2rn5.skadnetwork',
    '44jx6755aq.skadnetwork',
    'k674qkevps.skadnetwork',
    '4468km3ulz.skadnetwork',
    '2u9pt9hc89.skadnetwork',
    '8s468mfl3y.skadnetwork',
    'ppxm28t8ap.skadnetwork',
    'uw77j35x4d.skadnetwork',
    'pwa73g5rt2.skadnetwork',
    '578prtvx9j.skadnetwork',
    '4dzt52r2t5.skadnetwork',
    'tl55sbb4fm.skadnetwork',
    'e5fvkxwrpn.skadnetwork',
    '8c4e2ghe7u.skadnetwork',
    '3rd42ekr43.skadnetwork',
    '3qcr597p9d.skadnetwork',
];

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: getAppName(),
    slug: 'loto-bingo',
    version: '1.0.0',
    scheme: 'loto-bingo',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    
    // Runtime versioning for OTA updates
    // Using 'appVersion' policy: updates are compatible with same app version
    runtimeVersion: {
        policy: 'appVersion',
    },
    
    // EAS Update configuration
    updates: {
        fallbackToCacheTimeout: 0,
        url: 'https://u.expo.dev/78564da5-2ed9-4f63-ac75-818782594c60',
        // Request headers set in eas.json per channel (preview/production)
    },
    
    splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#1a1109',
    },
    
    ios: {
        bundleIdentifier: getAppIdentifier(),
        buildNumber: '1',
        supportsTablet: true,
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
        },
        privacyManifests: {
            NSPrivacyAccessedAPITypes: [
                {
                    NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
                    NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
                },
            ],
        },
    },
    
    android: {
        package: getAppIdentifier(),
        versionCode: 1,
        adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#1a1109',
        },
        edgeToEdgeEnabled: true,
        permissions: [
            'INTERNET',
            'VIBRATE',
            'ACCESS_NETWORK_STATE',
        ],
        blockedPermissions: [
            'RECORD_AUDIO',
            'ACCESS_FINE_LOCATION',
            'ACCESS_COARSE_LOCATION',
        ],
    },
    
    web: {
        favicon: './assets/favicon.png',
        bundler: 'metro',
    },
    
    plugins: [
        'expo-router',
        'expo-updates',
        'expo-audio',
        'expo-asset',
        [
            'expo-notifications',
            {
                icon: './assets/icon.png',
                color: '#ffd700',
            },
        ],
        [
            'expo-tracking-transparency',
            {
                userTrackingPermission: USER_TRACKING_DESCRIPTION,
            },
        ],
        [
            'react-native-google-mobile-ads',
            {
                androidAppId: ADMOB_ANDROID_APP_ID,
                iosAppId: ADMOB_IOS_APP_ID,
                userTrackingUsageDescription: USER_TRACKING_DESCRIPTION,
                skAdNetworkItems: SK_AD_NETWORK_ITEMS,
            },
        ],
        // Sentry source-map upload — only active when the org/project are
        // configured (needs SENTRY_AUTH_TOKEN in EAS secrets). Runtime crash
        // reporting works without this; it only makes stack traces readable.
        ...(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
            ? [
                  [
                      '@sentry/react-native/expo',
                      {
                          organization: process.env.SENTRY_ORG,
                          project: process.env.SENTRY_PROJECT,
                      },
                  ] as [string, object],
              ]
            : []),
    ],
    
    experiments: {
        typedRoutes: true,
    },
    
    extra: {
        eas: {
            projectId: '78564da5-2ed9-4f63-ac75-818782594c60',
        },
        // Runtime-accessible environment info (via Constants.expoConfig.extra)
        appVariant: APP_VARIANT ?? 'production',
    },
});
