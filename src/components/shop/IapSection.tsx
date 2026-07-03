/**
 * IapSection — real-money purchases inside the Shop ("Coins" tab).
 *
 * Sells consumable coin packs and the Remove Ads non-consumable, and hosts
 * the "Restore Purchases" button Apple requires for review. Products and
 * localized prices come from purchasesService (RevenueCat); with the mock
 * provider (dev / Expo Go) purchases always succeed so the flow is testable.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { RefreshCw } from 'lucide-react-native';
import {
    purchasesService,
    PRODUCT_IDS,
    COIN_PACK_AMOUNTS,
    type ProductPackage,
} from '@/lib/services/purchases';
import { adsService } from '@/lib/services/ads';
import { analytics, ANALYTICS_EVENTS } from '@/lib/services/analytics';
import { useGameStore } from '@/lib/store';
import { useToast } from '@/components/ToastProvider';
import { translations } from '@/lib/i18n';
import { SPACING, RADII, FONT_WEIGHTS, TEXT_STYLES } from '@/lib/config';

/** Display order + icons for the products this section sells. */
const IAP_DISPLAY: { id: string; icon: string; bestValue?: boolean }[] = [
    { id: PRODUCT_IDS.COINS_SMALL, icon: '💰' },
    { id: PRODUCT_IDS.COINS_MEDIUM, icon: '💎', bestValue: true },
    { id: PRODUCT_IDS.COINS_LARGE, icon: '👑' },
    { id: PRODUCT_IDS.REMOVE_ADS, icon: '🚫' },
];

export const IapSection = () => {
    const language = useGameStore((s) => s.language);
    const addCoins = useGameStore((s) => s.addCoins);
    const syncToSupabase = useGameStore((s) => s.syncToSupabase);
    const { showToast } = useToast();
    const t = translations[language];

    const [products, setProducts] = useState<ProductPackage[] | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [busyProductId, setBusyProductId] = useState<string | null>(null);
    const [restoring, setRestoring] = useState(false);
    const [adsRemoved, setAdsRemoved] = useState(adsService.isAdFree());

    const loadProducts = useCallback(async () => {
        setLoadFailed(false);
        try {
            const all = await purchasesService.getProducts();
            const wanted = IAP_DISPLAY.map((d) => d.id);
            const filtered = all
                .filter((p) => wanted.includes(p.id))
                .sort((a, b) => wanted.indexOf(a.id) - wanted.indexOf(b.id));
            setProducts(filtered);
            if (filtered.length === 0) setLoadFailed(true);
        } catch {
            setProducts([]);
            setLoadFailed(true);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const handleBuy = async (product: ProductPackage) => {
        if (busyProductId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setBusyProductId(product.id);
        analytics.logEvent(ANALYTICS_EVENTS.PURCHASE_ATTEMPT, { product_id: product.id });

        try {
            const result = await purchasesService.purchase(product.id);
            if (!result.success) {
                // Silent for user-cancelled; toast for real failures.
                if (result.error !== 'cancelled') {
                    showToast(t.iapPurchaseFailed, 'error', '⚠️');
                }
                return;
            }

            analytics.logEvent(ANALYTICS_EVENTS.PURCHASE_SUCCESS, { product_id: product.id });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

            const coinAmount = COIN_PACK_AMOUNTS[product.id];
            if (coinAmount) {
                addCoins(coinAmount);
                syncToSupabase().catch(() => {});
                showToast(t.iapCoinsGranted.replace('{amount}', String(coinAmount)), 'success', '💰');
            } else if (product.id === PRODUCT_IDS.REMOVE_ADS) {
                // Entitlement is applied to adsService inside purchasesService.
                setAdsRemoved(true);
                showToast(t.iapPurchaseSuccess, 'success', '🎉');
            } else {
                showToast(t.iapPurchaseSuccess, 'success', '🎉');
            }
        } finally {
            setBusyProductId(null);
        }
    };

    const handleRestore = async () => {
        if (restoring) return;
        Haptics.selectionAsync().catch(() => {});
        setRestoring(true);
        try {
            const restored = await purchasesService.restorePurchases();
            setAdsRemoved(adsService.isAdFree());
            if (restored.length > 0) {
                showToast(t.iapRestoreSuccess, 'success', '✅');
            } else {
                showToast(t.iapRestoreNone, 'info', 'ℹ️');
            }
        } finally {
            setRestoring(false);
        }
    };

    // ── Loading / error states ──────────────────────────────────────────
    if (products === null) {
        return (
            <View style={{ paddingVertical: SPACING.xxl, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#ffd700" />
            </View>
        );
    }

    if (loadFailed) {
        return (
            <View style={{ paddingVertical: SPACING.xl, alignItems: 'center', gap: SPACING.md }}>
                <Text style={[TEXT_STYLES.bodySmall, { color: '#d4b896', textAlign: 'center' }]}>
                    {t.iapUnavailable}
                </Text>
                <TouchableOpacity
                    onPress={loadProducts}
                    accessibilityRole="button"
                    accessibilityLabel={t.iapRestorePurchases}
                    style={{
                        minWidth: 44,
                        minHeight: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: SPACING.lg,
                        borderRadius: RADII.pill,
                        borderWidth: 1.5,
                        borderColor: 'rgba(255, 215, 0, 0.5)',
                    }}
                >
                    <RefreshCw size={16} color="#ffd700" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>
        );
    }

    // ── Product list ────────────────────────────────────────────────────
    return (
        <View style={{ gap: SPACING.md }}>
            {products.map((product) => {
                const display = IAP_DISPLAY.find((d) => d.id === product.id);
                const isRemoveAds = product.id === PRODUCT_IDS.REMOVE_ADS;
                const owned = isRemoveAds && adsRemoved;
                const busy = busyProductId === product.id;
                const title = isRemoveAds ? t.iapRemoveAdsTitle : product.title;
                const description = isRemoveAds ? t.iapRemoveAdsDesc : product.description;

                return (
                    <View
                        key={product.id}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: SPACING.md,
                            padding: SPACING.md,
                            borderRadius: RADII.lg,
                            backgroundColor: owned ? 'rgba(74, 222, 128, 0.08)' : 'rgba(0, 0, 0, 0.3)',
                            borderWidth: 1.5,
                            borderColor: owned
                                ? 'rgba(74, 222, 128, 0.45)'
                                : display?.bestValue
                                    ? 'rgba(255, 215, 0, 0.65)'
                                    : 'rgba(90, 64, 37, 0.5)',
                        }}
                    >
                        {/* Icon */}
                        <View
                            style={{
                                width: 52,
                                height: 52,
                                borderRadius: RADII.md,
                                backgroundColor: 'rgba(0,0,0,0.35)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 28 }}>{display?.icon ?? '🛒'}</Text>
                        </View>

                        {/* Title + description */}
                        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: FONT_WEIGHTS.bold,
                                        color: '#f5e6c8',
                                        flexShrink: 1,
                                    }}
                                    numberOfLines={1}
                                >
                                    {title}
                                </Text>
                                {display?.bestValue && !owned && (
                                    <View
                                        style={{
                                            backgroundColor: '#ffd700',
                                            borderRadius: RADII.pill,
                                            paddingHorizontal: 6,
                                            paddingVertical: 2,
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#1a1109' }}>
                                            {t.iapBestValue}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text
                                style={{ fontSize: 12, color: '#d4b896' }}
                                numberOfLines={2}
                            >
                                {description}
                            </Text>
                        </View>

                        {/* Price / owned button */}
                        {owned ? (
                            <View
                                style={{
                                    paddingHorizontal: SPACING.md,
                                    paddingVertical: SPACING.sm,
                                    borderRadius: RADII.md,
                                    backgroundColor: 'rgba(74, 222, 128, 0.2)',
                                    borderWidth: 1,
                                    borderColor: '#4ade80',
                                }}
                            >
                                <Text style={{ fontSize: 12, fontWeight: '800', color: '#4ade80' }}>
                                    {t.owned}
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => handleBuy(product)}
                                disabled={!!busyProductId}
                                activeOpacity={0.75}
                                accessibilityRole="button"
                                accessibilityLabel={`${title} — ${product.price}`}
                                accessibilityState={{ disabled: !!busyProductId }}
                                style={{
                                    minWidth: 84,
                                    minHeight: 44,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingHorizontal: SPACING.md,
                                    borderRadius: RADII.md,
                                    backgroundColor: busyProductId
                                        ? 'rgba(90, 64, 37, 0.3)'
                                        : 'rgba(255, 215, 0, 0.85)',
                                    borderWidth: 1,
                                    borderColor: busyProductId ? 'rgba(90,64,37,0.4)' : '#ffd700',
                                }}
                            >
                                {busy ? (
                                    <ActivityIndicator size="small" color="#1a1109" />
                                ) : (
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontWeight: '800',
                                            color: busyProductId ? '#8a6a40' : '#1a1109',
                                        }}
                                    >
                                        {product.price}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                );
            })}

            {/* Restore Purchases — Apple requires this to be visible */}
            <TouchableOpacity
                onPress={handleRestore}
                disabled={restoring}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t.iapRestorePurchases}
                style={{
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: SPACING.sm,
                    marginTop: SPACING.sm,
                }}
            >
                {restoring ? (
                    <ActivityIndicator size="small" color="#c9a87a" />
                ) : (
                    <RefreshCw size={14} color="#c9a87a" strokeWidth={2.5} />
                )}
                <Text
                    style={{
                        fontSize: 13,
                        color: '#c9a87a',
                        fontWeight: FONT_WEIGHTS.semibold,
                        textDecorationLine: 'underline',
                    }}
                >
                    {t.iapRestorePurchases}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default IapSection;
