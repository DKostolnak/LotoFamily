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
            NSMicrophoneUsageDescription: 'LOTO uses speech synthesis for number announcements.',
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
        ],
    },
    
    web: {
        favicon: './assets/favicon.png',
        bundler: 'metro',
    },
    
    plugins: [
        'expo-router',
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
