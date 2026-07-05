/**
 * Web-safe Ads Service shim.
 *
 * The native implementation imports react-native-google-mobile-ads, which
 * depends on React Native internals that cannot be bundled for web.
 */

export type AdProvider = 'admob' | 'applovin' | 'mock';

export type AdType = 'rewarded' | 'interstitial' | 'banner';

export interface RewardedAdResult {
    rewarded: boolean;
    error?: string;
    rewardAmount?: number;
    rewardType?: string;
}

export const AD_PLACEMENTS = {
    DAILY_BONUS_DOUBLE: 'daily_bonus_double',
    EXTRA_COINS: 'extra_coins',
    EXTRA_CARD: 'extra_card',
    SKIP_INTERSTITIAL: 'skip_interstitial',
    POST_GAME_INTERSTITIAL: 'post_game_interstitial',
    POWER_UP_REWARD: 'power_up_reward',
} as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[keyof typeof AD_PLACEMENTS];

class AdsService {
    private static instance: AdsService;
    private adFree = false;

    private constructor() {}

    public static getInstance(): AdsService {
        if (!AdsService.instance) {
            AdsService.instance = new AdsService();
        }
        return AdsService.instance;
    }

    public async init(): Promise<void> {}

    public setAdFree(adFree: boolean): void {
        this.adFree = adFree;
    }

    public isAdFree(): boolean {
        return this.adFree;
    }

    public async showRewardedAd(): Promise<RewardedAdResult> {
        return { rewarded: true };
    }

    public async showInterstitial(): Promise<boolean> {
        return false;
    }

    public isReady(adType: AdType): boolean {
        return adType !== 'banner';
    }

    public preloadRewarded(): void {}

    public preloadInterstitial(): void {}

    public getProvider(): AdProvider {
        return 'mock';
    }
}

export const adsService = AdsService.getInstance();
export { AdsService };
