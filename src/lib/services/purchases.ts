/**
 * Purchases Service
 *
 * Adapter / placeholder for In-App Purchases.
 *
 * Recommended provider: RevenueCat (handles iOS + Android + receipt validation
 * + subscription state across devices). Alternative: `expo-in-app-purchases`
 * if you want a thinner StoreKit/Play Billing wrapper.
 *
 * Currently returns mock products and "successful" mock purchases in __DEV__.
 *
 * To wire up RevenueCat:
 *  1. `npx expo install react-native-purchases`
 *  2. Configure products & entitlements in RevenueCat dashboard.
 *  3. Provide API keys via env vars (see env.config.ts -> REVENUECAT).
 *  4. Replace bodies marked `// REPLACE WHEN REVENUECAT CONFIGURED` below.
 */

import { FEATURES, REVENUECAT } from '@/lib/config/env.config';

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
 * Standardized product IDs. These should match the SKUs configured in
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
     * Initialize IAP SDK. Should be called once on app start, after the
     * authenticated user id is known (so receipts attach to the right account).
     */
    public async init(userId: string): Promise<void> {
        this.currentUserId = userId;

        if (this.initialized) return;

        if (!FEATURES.enableIAP) {
            if (__DEV__) {
                console.log('[IAP] Disabled (no RevenueCat keys). Using mock provider.');
            }
            this.provider = 'mock';
            this.initialized = true;
            return;
        }

        // REPLACE WHEN REVENUECAT CONFIGURED:
        // import Purchases from 'react-native-purchases';
        // const apiKey = Platform.OS === 'ios' ? REVENUECAT.apiKeyIos : REVENUECAT.apiKeyAndroid;
        // Purchases.configure({ apiKey, appUserID: userId });
        // this.provider = 'revenuecat';

        if (__DEV__) {
            console.log('[IAP] Initialized (mock placeholder)', {
                userId,
                hasIosKey: !!REVENUECAT.apiKeyIos,
                hasAndroidKey: !!REVENUECAT.apiKeyAndroid,
            });
        }

        this.initialized = true;
    }

    /**
     * Fetch available products. Mock returns a hardcoded list; the real
     * implementation should fetch SKUs from the store at runtime so prices
     * are localized to the user's region.
     */
    public async getProducts(): Promise<ProductPackage[]> {
        if (this.provider === 'mock') {
            return MOCK_PRODUCTS;
        }

        // REPLACE WHEN REVENUECAT CONFIGURED:
        // const offerings = await Purchases.getOfferings();
        // return (offerings.current?.availablePackages ?? []).map((pkg) => ({
        //     id: pkg.product.identifier,
        //     title: pkg.product.title,
        //     description: pkg.product.description,
        //     price: pkg.product.priceString,
        //     priceAmountMicros: Math.round(pkg.product.price * 1_000_000),
        //     currency: pkg.product.currencyCode,
        // }));

        return [];
    }

    /**
     * Initiate a purchase. The mock implementation pretends the user
     * succeeded so coin-grant flows can be tested end-to-end.
     */
    public async purchase(productId: string): Promise<PurchaseResult> {
        if (this.provider === 'mock') {
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

        // REPLACE WHEN REVENUECAT CONFIGURED:
        // try {
        //     const offerings = await Purchases.getOfferings();
        //     const pkg = offerings.current?.availablePackages.find((p) => p.product.identifier === productId);
        //     if (!pkg) return { success: false, error: 'Product not found' };
        //     const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);
        //     return { success: true, productId: productIdentifier, transactionId: customerInfo.originalAppUserId };
        // } catch (e: any) {
        //     if (e.userCancelled) return { success: false, error: 'cancelled' };
        //     return { success: false, error: e.message };
        // }

        return { success: false, error: 'Provider not implemented' };
    }

    /**
     * Restore previously-purchased non-consumables (Remove Ads, lifetime
     * upgrades) and active subscriptions. Returns a list of active product IDs.
     */
    public async restorePurchases(): Promise<string[]> {
        if (this.provider === 'mock') {
            if (__DEV__) console.log('[IAP] Mock restorePurchases()');
            return [];
        }

        // REPLACE WHEN REVENUECAT CONFIGURED:
        // const customerInfo = await Purchases.restorePurchases();
        // return Object.keys(customerInfo.entitlements.active);

        return [];
    }

    /**
     * Whether the user has any active subscription (e.g. Premium Monthly).
     */
    public async hasActiveSubscription(): Promise<boolean> {
        if (this.provider === 'mock') return false;

        // REPLACE WHEN REVENUECAT CONFIGURED:
        // const info = await Purchases.getCustomerInfo();
        // return Object.keys(info.entitlements.active).length > 0;

        return false;
    }

    /**
     * Whether the user has purchased the "Remove Ads" non-consumable.
     */
    public async hasRemovedAds(): Promise<boolean> {
        if (this.provider === 'mock') return false;

        // REPLACE WHEN REVENUECAT CONFIGURED:
        // const info = await Purchases.getCustomerInfo();
        // return !!info.entitlements.active['remove_ads'];

        return false;
    }

    public getProvider(): PurchaseProvider {
        return this.provider;
    }

    public getUserId(): string | null {
        return this.currentUserId;
    }
}

export const purchasesService = PurchasesService.getInstance();
export { PurchasesService };
