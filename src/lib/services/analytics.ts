/**
 * Analytics Service
 *
 * Adapter / placeholder for analytics providers (Firebase Analytics, Amplitude, etc.).
 *
 * Currently logs to console in __DEV__. To wire up a real provider:
 *  - Firebase: `npx expo install @react-native-firebase/app @react-native-firebase/analytics`
 *    then replace bodies marked `// REPLACE WHEN ANALYTICS CONFIGURED`.
 *  - Amplitude: `npx expo install @amplitude/analytics-react-native`.
 *
 * Public API is stable — call sites only need `analytics.logEvent(...)`,
 * `analytics.logGameStart(...)`, etc.
 */

import { FEATURES } from '@/lib/config/env.config';

type EventParams = Record<string, string | number | boolean | null | undefined>;

type AnalyticsProvider = 'firebase' | 'amplitude' | 'mock';

/**
 * Standardized event names. Use these constants rather than raw strings
 * so the analytics taxonomy stays consistent.
 */
export const ANALYTICS_EVENTS = {
    GAME_START: 'game_start',
    GAME_END: 'game_end',
    GAME_WIN: 'game_win',
    PURCHASE_ATTEMPT: 'purchase_attempt',
    PURCHASE_SUCCESS: 'purchase_success',
    AD_SHOWN: 'ad_shown',
    AD_REWARDED: 'ad_rewarded',
    DAILY_BONUS_CLAIMED: 'daily_bonus_claimed',
    SHOP_OPENED: 'shop_opened',
    SETTINGS_CHANGED: 'settings_changed',
} as const;

export type AnalyticsEvent =
    (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

class AnalyticsService {
    private static instance: AnalyticsService;
    private initialized = false;
    private provider: AnalyticsProvider = 'mock';

    private constructor() {}

    public static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    public async init(): Promise<void> {
        if (this.initialized) return;

        if (!FEATURES.enableAnalytics) {
            if (__DEV__) {
                console.log('[Analytics] Disabled for this environment (mock).');
            }
            this.provider = 'mock';
            this.initialized = true;
            return;
        }

        // REPLACE WHEN ANALYTICS CONFIGURED:
        // import analytics from '@react-native-firebase/analytics';
        // await analytics().setAnalyticsCollectionEnabled(true);
        // this.provider = 'firebase';

        console.log('[Analytics] Initialized (mock placeholder)');
        this.initialized = true;
    }

    public logEvent(eventName: string, params?: EventParams): void {
        if (__DEV__) {
            console.log(`[Analytics] Event: ${eventName}`, params);
        }

        if (this.provider === 'mock') return;

        // REPLACE WHEN ANALYTICS CONFIGURED:
        // analytics().logEvent(eventName, params);
    }

    public setUserProperty(name: string, value: string): void {
        if (__DEV__) {
            console.log(`[Analytics] User Property: ${name} = ${value}`);
        }

        if (this.provider === 'mock') return;

        // REPLACE WHEN ANALYTICS CONFIGURED:
        // analytics().setUserProperty(name, value);
    }

    public setUserId(userId: string): void {
        if (__DEV__) {
            console.log(`[Analytics] User ID: ${userId}`);
        }

        if (this.provider === 'mock') return;

        // REPLACE WHEN ANALYTICS CONFIGURED:
        // analytics().setUserId(userId);
    }

    public logScreenView(screenName: string, screenClass?: string): void {
        if (__DEV__) {
            console.log(`[Analytics] Screen View: ${screenName}`, { screenClass });
        }

        if (this.provider === 'mock') return;

        // REPLACE WHEN ANALYTICS CONFIGURED:
        // analytics().logScreenView({ screen_name: screenName, screen_class: screenClass ?? screenName });
    }

    // =========================================================================
    // GAME-SPECIFIC HELPERS
    // =========================================================================

    public logGameStart(
        mode: 'offline' | 'online',
        settings?: Record<string, unknown>
    ): void {
        this.logEvent(ANALYTICS_EVENTS.GAME_START, {
            mode,
            ...flattenForAnalytics(settings),
        });
    }

    public logGameEnd(result: 'win' | 'loss', durationMs: number): void {
        this.logEvent(ANALYTICS_EVENTS.GAME_END, {
            result,
            duration_ms: durationMs,
            duration_s: Math.round(durationMs / 1000),
        });

        if (result === 'win') {
            this.logEvent(ANALYTICS_EVENTS.GAME_WIN, {
                duration_ms: durationMs,
            });
        }
    }

    public logPurchaseAttempt(productId: string): void {
        this.logEvent(ANALYTICS_EVENTS.PURCHASE_ATTEMPT, { product_id: productId });
    }

    public logPurchaseSuccess(
        productId: string,
        value: number,
        currency: string
    ): void {
        this.logEvent(ANALYTICS_EVENTS.PURCHASE_SUCCESS, {
            product_id: productId,
            value,
            currency,
        });
    }

    public logAdShown(
        placement: string,
        adType: 'rewarded' | 'interstitial'
    ): void {
        this.logEvent(ANALYTICS_EVENTS.AD_SHOWN, {
            placement,
            ad_type: adType,
        });
    }

    public logAdRewarded(placement: string): void {
        this.logEvent(ANALYTICS_EVENTS.AD_REWARDED, { placement });
    }

    public getProvider(): AnalyticsProvider {
        return this.provider;
    }
}

/**
 * Flatten arbitrary settings to analytics-safe primitives.
 * Most analytics providers reject nested objects/arrays.
 */
function flattenForAnalytics(
    obj: Record<string, unknown> | undefined
): EventParams {
    if (!obj) return {};
    const out: EventParams = {};
    for (const [k, v] of Object.entries(obj)) {
        if (
            typeof v === 'string' ||
            typeof v === 'number' ||
            typeof v === 'boolean' ||
            v === null ||
            v === undefined
        ) {
            out[k] = v;
        } else {
            out[k] = JSON.stringify(v);
        }
    }
    return out;
}

export const analytics = AnalyticsService.getInstance();
export { AnalyticsService };
