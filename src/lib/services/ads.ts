/**
 * Ads Service
 *
 * Adapter / placeholder for mobile ad networks (AdMob, AppLovin, etc.).
 *
 * Currently provides a `mock` implementation:
 *  - In __DEV__ rewarded ads always succeed (so feature gating UX can be tested).
 *  - In production builds without configured keys, calls fail gracefully.
 *
 * To wire up real AdMob (preferred for Expo):
 *  1. `npx expo install react-native-google-mobile-ads`
 *  2. Add ad app IDs to `app.config.ts` plugin config (read from env.config.ts -> ADMOB).
 *  3. Replace the bodies marked `// REPLACE WHEN ADMOB CONFIGURED` below with real SDK calls.
 *  4. Set `this.provider = 'admob'` inside `init()` once SDK successfully initializes.
 *
 * Public API kept stable so call sites (`adsService.showRewardedAd(...)`) do not change.
 */

import { ADMOB, FEATURES } from '@/lib/config/env.config';

export type AdProvider = 'admob' | 'applovin' | 'mock';

export type AdType = 'rewarded' | 'interstitial' | 'banner';

export interface RewardedAdResult {
    rewarded: boolean;
    error?: string;
    /** Optional reward amount/type if provided by the network */
    rewardAmount?: number;
    rewardType?: string;
}

/**
 * Standardized placement identifiers.
 * Pass one of these to `showRewardedAd` / `showInterstitial` so analytics
 * and ad-network reporting stay consistent across the app.
 */
export const AD_PLACEMENTS = {
    DAILY_BONUS_DOUBLE: 'daily_bonus_double',
    EXTRA_COINS: 'extra_coins',
    EXTRA_CARD: 'extra_card',
    SKIP_INTERSTITIAL: 'skip_interstitial',
    POST_GAME_INTERSTITIAL: 'post_game_interstitial',
} as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[keyof typeof AD_PLACEMENTS];

class AdsService {
    private static instance: AdsService;
    private initialized = false;
    private provider: AdProvider = 'mock';

    private constructor() {}

    public static getInstance(): AdsService {
        if (!AdsService.instance) {
            AdsService.instance = new AdsService();
        }
        return AdsService.instance;
    }

    /**
     * Initialize the ad SDK. Safe to call multiple times.
     */
    public async init(): Promise<void> {
        if (this.initialized) return;

        if (!FEATURES.enableAds) {
            if (__DEV__) {
                console.log('[Ads] Disabled (no AdMob keys). Using mock provider.');
            }
            this.provider = 'mock';
            this.initialized = true;
            return;
        }

        // REPLACE WHEN ADMOB CONFIGURED:
        // import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
        // await mobileAds().setRequestConfiguration({
        //     maxAdContentRating: MaxAdContentRating.PG,
        //     tagForChildDirectedTreatment: false,
        //     tagForUnderAgeOfConsent: false,
        // });
        // await mobileAds().initialize();
        // this.provider = 'admob';

        if (__DEV__) {
            console.log('[Ads] Initialized (mock placeholder)', {
                hasAndroidId: !!ADMOB.androidAppId,
                hasIosId: !!ADMOB.iosAppId,
            });
        }

        this.initialized = true;
    }

    /**
     * Show a rewarded video ad. Resolves once the ad is closed.
     *
     * Mock behavior: in __DEV__ always grants the reward so flows are testable.
     */
    public async showRewardedAd(placement: string): Promise<RewardedAdResult> {
        if (this.provider === 'mock') {
            if (__DEV__) {
                console.log(`[Ads] Mock rewarded ad shown: ${placement}`);
                return { rewarded: true };
            }
            return { rewarded: false, error: 'Ads not configured' };
        }

        // REPLACE WHEN ADMOB CONFIGURED:
        // const adUnitId = Platform.OS === 'ios' ? ADMOB.rewardedIdIos : ADMOB.rewardedIdAndroid;
        // const rewarded = RewardedAd.createForAdRequest(adUnitId);
        // return new Promise((resolve) => {
        //     let earned = false;
        //     const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => rewarded.show());
        //     const unsubEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (r) => {
        //         earned = true;
        //         resolve({ rewarded: true, rewardAmount: r.amount, rewardType: r.type });
        //     });
        //     const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        //         unsubLoaded(); unsubEarned(); unsubClosed();
        //         if (!earned) resolve({ rewarded: false });
        //     });
        //     rewarded.load();
        // });

        return { rewarded: false, error: 'Provider not implemented' };
    }

    /**
     * Show an interstitial ad. Resolves true if the ad displayed successfully.
     */
    public async showInterstitial(placement: string): Promise<boolean> {
        if (this.provider === 'mock') {
            if (__DEV__) {
                console.log(`[Ads] Mock interstitial shown: ${placement}`);
                return true;
            }
            return false;
        }

        // REPLACE WHEN ADMOB CONFIGURED:
        // const adUnitId = Platform.OS === 'ios' ? ADMOB.interstitialIdIos : ADMOB.interstitialIdAndroid;
        // const interstitial = InterstitialAd.createForAdRequest(adUnitId);
        // ... show + resolve when closed.

        return false;
    }

    /**
     * Whether a preloaded ad of the given type is ready to display immediately.
     */
    public isReady(adType: AdType): boolean {
        if (this.provider === 'mock') {
            // Mock pretends rewarded/interstitial are always ready in dev
            return __DEV__ && adType !== 'banner';
        }

        // REPLACE WHEN ADMOB CONFIGURED:
        // return adType === 'rewarded' ? this.rewardedAd?.loaded ?? false : this.interstitialAd?.loaded ?? false;

        return false;
    }

    /**
     * Preload a rewarded ad in the background to avoid latency at the call site.
     * Call after init and after each successful display.
     */
    public preloadRewarded(): void {
        if (this.provider === 'mock') {
            if (__DEV__) console.log('[Ads] Mock preloadRewarded()');
            return;
        }
        // REPLACE WHEN ADMOB CONFIGURED:
        // this.rewardedAd?.load();
    }

    /**
     * Preload an interstitial ad in the background.
     */
    public preloadInterstitial(): void {
        if (this.provider === 'mock') {
            if (__DEV__) console.log('[Ads] Mock preloadInterstitial()');
            return;
        }
        // REPLACE WHEN ADMOB CONFIGURED:
        // this.interstitialAd?.load();
    }

    /**
     * Read-only provider name (useful for analytics tagging).
     */
    public getProvider(): AdProvider {
        return this.provider;
    }
}

export const adsService = AdsService.getInstance();
export { AdsService };
