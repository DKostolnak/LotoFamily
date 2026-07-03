/**
 * Purchases Service — In-App Purchases via RevenueCat (react-native-purchases).
 *
 * Behavior by environment:
 *  - Native builds with EXPO_PUBLIC_REVENUECAT_API_KEY_* set → real store
 *    purchases (StoreKit / Play Billing, receipts validated by RevenueCat).
 *  - No API keys / Expo Go / Jest → mock provider; in __DEV__ purchases
 *    always "succeed" so coin-grant and premium flows stay testable.
 *
 * Setup (before production release):
 *  1. Create the products in App Store Connect + Google Play Console using
 *     the SKUs from PRODUCT_IDS (and season.config's SEASON_PREMIUM_PRODUCT_ID).
 *  2. In the RevenueCat dashboard, attach those products to an Offering and
 *     map the non-consumables/subscriptions to the ENTITLEMENT_IDS below.
 *  3. Set EXPO_PUBLIC_REVENUECAT_API_KEY_IOS / _ANDROID (see .env.example).
 *
 * Public API kept stable so call sites (`purchasesService.purchase(...)`) do not change.
 */

import { Platform } from 'react-native';
import { REVENUECAT } from '@/lib/config/env.config';
import { adsService } from './ads';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

// Lazy native module load — throws in Expo Go / Jest where the native
// binding is missing, so we fall back to the mock provider there.
type PurchasesModule = typeof import('react-native-purchases');
type PurchasesStatic = PurchasesModule['default'];
let Purchases: PurchasesStatic | null = null;
let RC_LOG_LEVEL: PurchasesModule['LOG_LEVEL'] | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod: PurchasesModule = require('react-native-purchases');
    Purchases = mod.default;
    RC_LOG_LEVEL = mod.LOG_LEVEL;
} catch {
    Purchases = null;
}

export type PurchaseProvider = 'revenuecat' | 'expo-iap' | 'mock';

export interface ProductPackage {
    id: string;
    title: string;
    description: string;
    /** Localized display price, e.g. "$0.99" or "0,99 €" */
    price: string;
    /** Price in micro units (e.g. $0.99 -> 990000). Useful for analytics. */
    priceAmountMicros: number;
    currency: string;
}

export interface PurchaseResult {
    success: boolean;
    productId?: string;
    transactionId?: string;
    /** Whether this was a restoration of a prior purchase rather than a new one */
    restored?: boolean;
    error?: string;
}

/**
 * Standardized product IDs. These must match the SKUs configured in
 * App Store Connect / Google Play Console / RevenueCat dashboard.
 */
export const PRODUCT_IDS = {
    COINS_SMALL: 'coins_small',
    COINS_MEDIUM: 'coins_medium',
    COINS_LARGE: 'coins_large',
    REMOVE_ADS: 'remove_ads',
    PREMIUM_MONTHLY: 'premium_monthly',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

/**
 * RevenueCat entitlement identifiers. Configure these in the RevenueCat
 * dashboard and attach the corresponding products to them.
 */
export const ENTITLEMENT_IDS = {
    /** Non-consumable: permanently disables interstitial ads */
    REMOVE_ADS: 'remove_ads',
    /** Subscription: no ads + perks */
    PREMIUM: 'premium',
} as const;

/**
 * How many in-game coins each consumable coin pack grants.
 * Single source of truth for the grant logic in the shop UI.
 */
export const COIN_PACK_AMOUNTS: Record<string, number> = {
    [PRODUCT_IDS.COINS_SMALL]: 1_000,
    [PRODUCT_IDS.COINS_MEDIUM]: 5_500,
    [PRODUCT_IDS.COINS_LARGE]: 12_000,
};

const MOCK_PRODUCTS: ProductPackage[] = [
    {
        id: PRODUCT_IDS.COINS_SMALL,
        title: '1,000 Coins',
        description: 'Starter pack',
        price: '$0.99',
        priceAmountMicros: 990_000,
        currency: 'USD',
    },
    {
        id: PRODUCT_IDS.COINS_MEDIUM,
        title: '5,500 Coins',
        description: 'Best value',
        price: '$4.99',
        priceAmountMicros: 4_990_000,
        currency: 'USD',
    },
    {
        id: PRODUCT_IDS.COINS_LARGE,
        title: '12,000 Coins',
        description: 'Deluxe pack',
        price: '$9.99',
        priceAmountMicros: 9_990_000,
        currency: 'USD',
    },
    {
        id: PRODUCT_IDS.REMOVE_ADS,
        title: 'Remove Ads',
        description: 'Permanent',
        price: '$2.99',
        priceAmountMicros: 2_990_000,
        currency: 'USD',
    },
    {
        id: PRODUCT_IDS.PREMIUM_MONTHLY,
        title: 'Premium Monthly',
        description: 'No ads + 2x coins',
        price: '$4.99',
        priceAmountMicros: 4_990_000,
        currency: 'USD',
    },
];

class PurchasesService {
    private static instance: PurchasesService;
    private initialized = false;
    private provider: PurchaseProvider = 'mock';
    private currentUserId: string | null = null;

    private constructor() {}

    public static getInstance(): PurchasesService {
        if (!PurchasesService.instance) {
            PurchasesService.instance = new PurchasesService();
        }
        return PurchasesService.instance;
    }

    /**
     * Initialize the IAP SDK. Call once on app start, after the authenticated
     * user id is known (so receipts attach to the right account and purchases
     * survive reinstall / device switch). Never throws.
     */
    public async init(userId: string): Promise<void> {
        this.currentUserId = userId;

        if (this.initialized) return;
        this.initialized = true;

        const apiKey = Platform.OS === 'ios' ? REVENUECAT.apiKeyIos : REVENUECAT.apiKeyAndroid;

        if (!Purchases || !apiKey) {
            this.provider = 'mock';
            if (__DEV__) {
                console.log('[IAP] Mock provider', {
                    nativeModule: !!Purchases,
                    hasApiKey: !!apiKey,
                });
            }
            return;
        }

        try {
            if (__DEV__ && RC_LOG_LEVEL) {
                await Purchases.setLogLevel(RC_LOG_LEVEL.DEBUG);
            }
            Purchases.configure({ apiKey, appUserID: userId });
            this.provider = 'revenuecat';

            // Restore the ad-free entitlement state (e.g. after reinstall).
            const info = await Purchases.getCustomerInfo();
            this.applyEntitlements(info);
        } catch (e) {
            this.provider = 'mock';
            if (__DEV__) console.warn('[IAP] RevenueCat init failed, using mock provider:', e);
        }
    }

    /**
     * Fetch available products with store-localized prices.
     */
    public async getProducts(): Promise<ProductPackage[]> {
        if (this.provider !== 'revenuecat' || !Purchases) {
            return MOCK_PRODUCTS;
        }

        try {
            const packages = await this.getAllPackages();
            return packages.map((pkg) => ({
                id: pkg.product.identifier,
                title: pkg.product.title,
                description: pkg.product.description,
                price: pkg.product.priceString,
                priceAmountMicros: Math.round(pkg.product.price * 1_000_000),
                currency: pkg.product.currencyCode,
            }));
        } catch (e) {
            if (__DEV__) console.warn('[IAP] getProducts failed:', e);
            return [];
        }
    }

    /**
     * Initiate a purchase for the given product SKU.
     */
    public async purchase(productId: string): Promise<PurchaseResult> {
        if (this.provider !== 'revenuecat' || !Purchases) {
            if (__DEV__) {
                console.log(`[IAP] Mock purchase: ${productId}`);
                return {
                    success: true,
                    productId,
                    transactionId: `mock_${Date.now()}`,
                };
            }
            return { success: false, error: 'IAP not configured' };
        }

        try {
            const packages = await this.getAllPackages();
            const pkg = packages.find((p) => p.product.identifier === productId);
            if (!pkg) return { success: false, error: 'Product not found' };

            const { customerInfo, transaction } = await Purchases.purchasePackage(pkg);
            this.applyEntitlements(customerInfo);
            return {
                success: true,
                productId,
                transactionId: transaction?.transactionIdentifier ?? undefined,
            };
        } catch (e: unknown) {
            const err = e as { userCancelled?: boolean; message?: string };
            if (err?.userCancelled) return { success: false, error: 'cancelled' };
            if (__DEV__) console.warn('[IAP] purchase failed:', e);
            return { success: false, error: err?.message ?? 'Purchase failed' };
        }
    }

    /**
     * Restore previously-purchased non-consumables (Remove Ads, Premium) and
     * active subscriptions. Returns the list of active entitlement IDs.
     * Apple REQUIRES a visible "Restore Purchases" button that calls this.
     */
    public async restorePurchases(): Promise<string[]> {
        if (this.provider !== 'revenuecat' || !Purchases) {
            if (__DEV__) console.log('[IAP] Mock restorePurchases()');
            return [];
        }

        try {
            const info = await Purchases.restorePurchases();
            this.applyEntitlements(info);
            return Object.keys(info.entitlements.active);
        } catch (e) {
            if (__DEV__) console.warn('[IAP] restore failed:', e);
            return [];
        }
    }

    /**
     * Whether the user has any active subscription (e.g. Premium Monthly).
     */
    public async hasActiveSubscription(): Promise<boolean> {
        if (this.provider !== 'revenuecat' || !Purchases) return false;

        try {
            const info = await Purchases.getCustomerInfo();
            return !!info.entitlements.active[ENTITLEMENT_IDS.PREMIUM];
        } catch {
            return false;
        }
    }

    /**
     * Whether the user is entitled to an ad-free experience
     * (Remove Ads non-consumable or an active Premium subscription).
     */
    public async hasRemovedAds(): Promise<boolean> {
        if (this.provider !== 'revenuecat' || !Purchases) return false;

        try {
            const info = await Purchases.getCustomerInfo();
            return this.isAdFree(info);
        } catch {
            return false;
        }
    }

    public getProvider(): PurchaseProvider {
        return this.provider;
    }

    public getUserId(): string | null {
        return this.currentUserId;
    }

    // ------------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------------

    /** All packages across all offerings (current first, deduped by product id). */
    private async getAllPackages(): Promise<PurchasesPackage[]> {
        if (!Purchases) return [];
        const offerings = await Purchases.getOfferings();
        const seen = new Set<string>();
        const result: PurchasesPackage[] = [];
        const offeringList = [
            ...(offerings.current ? [offerings.current] : []),
            ...Object.values(offerings.all),
        ];
        for (const offering of offeringList) {
            for (const pkg of offering.availablePackages) {
                if (!seen.has(pkg.product.identifier)) {
                    seen.add(pkg.product.identifier);
                    result.push(pkg);
                }
            }
        }
        return result;
    }

    private isAdFree(info: CustomerInfo): boolean {
        return (
            !!info.entitlements.active[ENTITLEMENT_IDS.REMOVE_ADS] ||
            !!info.entitlements.active[ENTITLEMENT_IDS.PREMIUM]
        );
    }

    /** Push the ad-free entitlement into the ads service (single source: RevenueCat). */
    private applyEntitlements(info: CustomerInfo): void {
        adsService.setAdFree(this.isAdFree(info));
    }
}

export const purchasesService = PurchasesService.getInstance();
export { PurchasesService };
