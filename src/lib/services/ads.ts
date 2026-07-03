/**
 * Ads Service — Google AdMob via react-native-google-mobile-ads.
 *
 * Behavior by environment:
 *  - Native dev/preview builds without AdMob env keys → Google TEST ad units
 *    (real SDK, test creatives — safe to click, earns nothing).
 *  - Production builds with EXPO_PUBLIC_ADMOB_* keys set → real ads.
 *  - Expo Go / Jest (native module unavailable) → mock provider; in __DEV__
 *    rewarded ads always "succeed" so gated flows stay testable.
 *
 * init() also runs the compliance flow required by Google & Apple:
 *  1. UMP consent form (GDPR — required for EU users)
 *  2. App Tracking Transparency prompt (iOS)
 *  3. SDK initialization + ad preloading
 *
 * Public API kept stable so call sites (`adsService.showRewardedAd(...)`) do not change.
 */

import { Platform } from 'react-native';
import { ADMOB, IS_PRODUCTION } from '@/lib/config/env.config';
import type { RewardedAd, InterstitialAd } from 'react-native-google-mobile-ads';

// Lazy native module load — throws in Expo Go / Jest where the native
// binding is missing, so we fall back to the mock provider there.
type GmaModule = typeof import('react-native-google-mobile-ads');
let gma: GmaModule | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    gma = require('react-native-google-mobile-ads');
} catch {
    gma = null;
}

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
    POWER_UP_REWARD: 'power_up_reward',
} as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[keyof typeof AD_PLACEMENTS];

/** How long showRewardedAd waits for an unloaded ad before giving up. */
const REWARDED_LOAD_TIMEOUT_MS = 12_000;

/** Minimum spacing between interstitials so they never feel spammy. */
const INTERSTITIAL_MIN_INTERVAL_MS = 120_000;

class AdsService {
    private static instance: AdsService;
    private initialized = false;
    private provider: AdProvider = 'mock';

    private rewardedAd: RewardedAd | null = null;
    private rewardedLoaded = false;
    private interstitialAd: InterstitialAd | null = null;
    private interstitialLoaded = false;
    private lastInterstitialAt = 0;
    /** Set via setAdFree() once the user buys Remove Ads / Premium. */
    private adFree = false;

    private constructor() {}

    public static getInstance(): AdsService {
        if (!AdsService.instance) {
            AdsService.instance = new AdsService();
        }
        return AdsService.instance;
    }

    /**
     * Initialize the ad SDK, gathering GDPR consent and the iOS tracking
     * permission first (Google's recommended order). Safe to call multiple
     * times; never throws.
     */
    public async init(): Promise<void> {
        if (this.initialized) return;
        this.initialized = true;

        if (!gma) {
            this.provider = 'mock';
            if (__DEV__) {
                console.log('[Ads] Native module unavailable (Expo Go / tests). Using mock provider.');
            }
            return;
        }

        // 1) UMP consent (GDPR). Shows the consent form only when required
        // (EU users, first launch). Failures (e.g. offline) must not block
        // the app — the SDK then serves limited/non-personalized ads.
        try {
            await gma.AdsConsent.gatherConsent();
        } catch (e) {
            if (__DEV__) console.warn('[Ads] Consent flow failed (continuing):', e);
        }

        // 2) iOS App Tracking Transparency. Must come after the UMP form so
        // the prompts appear in Apple's expected order.
        if (Platform.OS === 'ios') {
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const tracking = require('expo-tracking-transparency');
                await tracking.requestTrackingPermissionsAsync();
            } catch {
                // Module missing (Expo Go) or user dismissed — non-personalized ads still work.
            }
        }

        // 3) SDK init + content rating suitable for a family game.
        try {
            await gma.default().setRequestConfiguration({
                maxAdContentRating: gma.MaxAdContentRating.PG,
                tagForChildDirectedTreatment: false,
                tagForUnderAgeOfConsent: false,
            });
            await gma.default().initialize();
            this.provider = 'admob';
            this.preloadRewarded();
            this.preloadInterstitial();
            if (__DEV__) {
                console.log('[Ads] AdMob initialized', {
                    rewardedUnit: this.getRewardedUnitId(),
                    interstitialUnit: this.getInterstitialUnitId(),
                });
            }
        } catch (e) {
            this.provider = 'mock';
            if (__DEV__) console.warn('[Ads] AdMob init failed, using mock provider:', e);
        }
    }

    /**
     * Mark the user as ad-free (Remove Ads purchase / Premium subscription).
     * Interstitials stop entirely; rewarded ads stay available because the
     * user opts into those for rewards.
     */
    public setAdFree(adFree: boolean): void {
        this.adFree = adFree;
    }

    public isAdFree(): boolean {
        return this.adFree;
    }

    /**
     * Show a rewarded video ad. Resolves once the ad is closed.
     * Uses the preloaded ad when available; otherwise loads on demand
     * (bounded by REWARDED_LOAD_TIMEOUT_MS).
     */
    public async showRewardedAd(placement: string): Promise<RewardedAdResult> {
        if (this.provider !== 'admob' || !gma) {
            if (__DEV__) {
                console.log(`[Ads] Mock rewarded ad shown: ${placement}`);
                return { rewarded: true };
            }
            return { rewarded: false, error: 'Ads not configured' };
        }

        const lib = gma;
        // Prefer the preloaded instance; build a fresh one otherwise.
        let ad = this.rewardedLoaded ? this.rewardedAd : null;
        if (!ad) {
            const unitId = this.getRewardedUnitId();
            if (!unitId) return { rewarded: false, error: 'Ads not configured' };
            ad = lib.RewardedAd.createForAdRequest(unitId);
        }
        const target = ad;
        // The preloaded instance is being consumed either way.
        this.rewardedAd = null;
        this.rewardedLoaded = false;

        return new Promise<RewardedAdResult>((resolve) => {
            let earned = false;
            let rewardAmount: number | undefined;
            let rewardType: string | undefined;
            let settled = false;
            const subs: (() => void)[] = [];
            let timeout: ReturnType<typeof setTimeout> | null = null;

            const finish = (result: RewardedAdResult) => {
                if (settled) return;
                settled = true;
                if (timeout) clearTimeout(timeout);
                subs.forEach((unsub) => unsub());
                this.preloadRewarded();
                resolve(result);
            };

            subs.push(
                target.addAdEventListener(lib.RewardedAdEventType.EARNED_REWARD, (reward) => {
                    earned = true;
                    rewardAmount = reward?.amount;
                    rewardType = reward?.type;
                })
            );
            subs.push(
                target.addAdEventListener(lib.AdEventType.CLOSED, () =>
                    finish({ rewarded: earned, rewardAmount, rewardType })
                )
            );
            subs.push(
                target.addAdEventListener(lib.AdEventType.ERROR, (error) =>
                    finish({ rewarded: false, error: error?.message ?? 'Ad failed to load' })
                )
            );

            if (target.loaded) {
                target.show().catch((e) => finish({ rewarded: false, error: String(e) }));
            } else {
                subs.push(
                    target.addAdEventListener(lib.RewardedAdEventType.LOADED, () => {
                        target.show().catch((e) => finish({ rewarded: false, error: String(e) }));
                    })
                );
                timeout = setTimeout(
                    () => finish({ rewarded: false, error: 'Ad load timeout' }),
                    REWARDED_LOAD_TIMEOUT_MS
                );
                target.load();
            }
        });
    }

    /**
     * Show an interstitial ad. Resolves true if the ad displayed.
     *
     * Never blocks the user: shows only when an ad is already preloaded,
     * respects the ad-free entitlement, and is frequency-capped to at most
     * one per INTERSTITIAL_MIN_INTERVAL_MS.
     */
    public async showInterstitial(placement: string): Promise<boolean> {
        if (this.provider !== 'admob' || !gma) {
            if (__DEV__) {
                console.log(`[Ads] Mock interstitial shown: ${placement}`);
                return true;
            }
            return false;
        }

        if (this.adFree) return false;
        if (Date.now() - this.lastInterstitialAt < INTERSTITIAL_MIN_INTERVAL_MS) return false;

        const lib = gma;
        const ad = this.interstitialAd;
        if (!ad || !this.interstitialLoaded) {
            // Not ready — kick off a load for next time, skip this one.
            this.preloadInterstitial();
            return false;
        }
        this.interstitialAd = null;
        this.interstitialLoaded = false;

        return new Promise<boolean>((resolve) => {
            let settled = false;
            const subs: (() => void)[] = [];

            const finish = (shown: boolean) => {
                if (settled) return;
                settled = true;
                subs.forEach((unsub) => unsub());
                this.preloadInterstitial();
                resolve(shown);
            };

            subs.push(ad.addAdEventListener(lib.AdEventType.CLOSED, () => finish(true)));
            subs.push(ad.addAdEventListener(lib.AdEventType.ERROR, () => finish(false)));

            this.lastInterstitialAt = Date.now();
            ad.show().catch(() => finish(false));
        });
    }

    /**
     * Whether a preloaded ad of the given type is ready to display immediately.
     */
    public isReady(adType: AdType): boolean {
        if (this.provider !== 'admob') {
            // Mock pretends rewarded/interstitial are always ready in dev
            return __DEV__ && adType !== 'banner';
        }
        if (adType === 'rewarded') return this.rewardedLoaded;
        if (adType === 'interstitial') return this.interstitialLoaded;
        return false;
    }

    /**
     * Preload a rewarded ad in the background to avoid latency at the call site.
     * Called automatically after init and after each display.
     */
    public preloadRewarded(): void {
        if (this.provider !== 'admob' || !gma) return;
        if (this.rewardedAd) return; // already loading/loaded
        const unitId = this.getRewardedUnitId();
        if (!unitId) return;

        const ad = gma.RewardedAd.createForAdRequest(unitId);
        this.rewardedAd = ad;
        this.rewardedLoaded = false;
        ad.addAdEventListener(gma.RewardedAdEventType.LOADED, () => {
            if (this.rewardedAd === ad) this.rewardedLoaded = true;
        });
        ad.addAdEventListener(gma.AdEventType.ERROR, () => {
            if (this.rewardedAd === ad) {
                this.rewardedAd = null;
                this.rewardedLoaded = false;
            }
        });
        ad.load();
    }

    /**
     * Preload an interstitial ad in the background.
     */
    public preloadInterstitial(): void {
        if (this.provider !== 'admob' || !gma) return;
        if (this.interstitialAd) return; // already loading/loaded
        const unitId = this.getInterstitialUnitId();
        if (!unitId) return;

        const ad = gma.InterstitialAd.createForAdRequest(unitId);
        this.interstitialAd = ad;
        this.interstitialLoaded = false;
        ad.addAdEventListener(gma.AdEventType.LOADED, () => {
            if (this.interstitialAd === ad) this.interstitialLoaded = true;
        });
        ad.addAdEventListener(gma.AdEventType.ERROR, () => {
            if (this.interstitialAd === ad) {
                this.interstitialAd = null;
                this.interstitialLoaded = false;
            }
        });
        ad.load();
    }

    /**
     * Read-only provider name (useful for analytics tagging).
     */
    public getProvider(): AdProvider {
        return this.provider;
    }

    // ------------------------------------------------------------------------
    // Ad unit resolution: env-configured IDs win; dev/preview builds fall back
    // to Google's public test units; production without IDs disables ads.
    // ------------------------------------------------------------------------

    private getRewardedUnitId(): string | null {
        const envId = Platform.OS === 'ios' ? ADMOB.rewardedIdIos : ADMOB.rewardedIdAndroid;
        if (envId) return envId;
        if (__DEV__ || !IS_PRODUCTION) return gma?.TestIds.REWARDED ?? null;
        return null;
    }

    private getInterstitialUnitId(): string | null {
        const envId = Platform.OS === 'ios' ? ADMOB.interstitialIdIos : ADMOB.interstitialIdAndroid;
        if (envId) return envId;
        if (__DEV__ || !IS_PRODUCTION) return gma?.TestIds.INTERSTITIAL ?? null;
        return null;
    }
}

export const adsService = AdsService.getInstance();
export { AdsService };
