import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withTiming,
    withSpring,
    Easing,
} from 'react-native-reanimated';
import { ModalShell, Badge, CoinBadge, EmptyState } from '@/components/common';
import { TEXT_STYLES, SPACING, RADII, FONT_WEIGHTS } from '@/lib/config';
import { useGameStore } from '@/lib/store';
import { SHOP_ITEMS, type ShopItem, isPowerUpItem } from '@/lib/shop';
import { translations, type TranslationKeys } from '@/lib/i18n';
import * as Haptics from 'expo-haptics';
import { ShopItemPreview } from '@/components/shop/ShopItemPreview';
import { IapSection } from '@/components/shop/IapSection';
import { Check, Lock } from 'lucide-react-native';

interface ShopModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ShopModal = ({ visible, onClose }: ShopModalProps) => {
    const {
        coins, inventory, purchaseItem, removeCoins, addPowerUp,
        activeTheme, activeSkin, equipItem, playerAvatar, setPlayerAvatar,
        language,
    } = useGameStore();
    const t = translations[language];

    type CategoryId = 'all' | 'coins' | 'avatar' | 'theme' | 'skin' | 'powerup';
    const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
    // Guard against double-tap / rapid-fire purchases
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        if (visible) setActiveCategory('all');
    }, [visible]);

    const handlePurchase = (item: ShopItem) => {
        if (purchasing || coins < item.price) {
            if (coins < item.price) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
            }
            return;
        }
        setPurchasing(true);
        try {
            if (isPowerUpItem(item)) {
                const ok = removeCoins(item.price);
                if (ok) {
                    addPowerUp(item.powerUpType, item.count);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
                }
                return;
            }
            const success = purchaseItem(item.id, item.price);
            if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
            }
        } finally {
            // Small delay so the button stays disabled until Zustand re-render
            setTimeout(() => setPurchasing(false), 400);
        }
    };

    const handleEquip = (item: ShopItem) => {
        if (item.category === 'theme' || item.category === 'skin') {
            equipItem(item.category, item.id);
            Haptics.selectionAsync().catch(() => { });
        } else if (item.category === 'avatar') {
            setPlayerAvatar(item.icon);
            Haptics.selectionAsync().catch(() => { });
        }
    };

    const categories: { id: CategoryId; label: string; emoji: string }[] = [
        { id: 'all', label: t.all ?? 'All', emoji: '🛍️' },
        { id: 'coins', label: t.shopCoinsTab ?? 'Coins', emoji: '💎' },
        { id: 'avatar', label: t.avatars ?? 'Avatars', emoji: '🐻' },
        { id: 'theme', label: t.themes ?? 'Themes', emoji: '🎨' },
        { id: 'skin', label: t.markers ?? 'Markers', emoji: '🔴' },
        { id: 'powerup', label: t.powerUps ?? 'Power-ups', emoji: '⚡' },
    ];

    const filteredItems = useMemo(
        () => SHOP_ITEMS.filter((i) => activeCategory === 'all' || i.category === activeCategory),
        [activeCategory]
    );

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={t.shopTitle ?? 'Grand Store'}
            headerRight={<CoinBadge coins={coins} size="sm" />}
            contentStyle={{ padding: 0, gap: 0 }}
        >
            {/* ── Category Filter ──────────────────────────────────────── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    flexDirection: 'row',
                    paddingHorizontal: SPACING.lg,
                    paddingVertical: SPACING.md,
                    gap: SPACING.sm,
                }}
            >
                {categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                        <Pressable
                            key={cat.id}
                            onPress={() => {
                                Haptics.selectionAsync().catch(() => { });
                                setActiveCategory(cat.id);
                            }}
                            accessibilityRole="tab"
                            accessibilityLabel={`${cat.emoji} ${cat.label}`}
                            accessibilityState={{ selected: isActive }}
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                paddingHorizontal: 14,
                                minHeight: 44,
                                borderRadius: RADII.pill,
                                backgroundColor: isActive
                                    ? 'rgba(255, 215, 0, 0.18)'
                                    : 'rgba(255,255,255,0.05)',
                                borderWidth: 1.5,
                                borderColor: isActive
                                    ? 'rgba(255, 215, 0, 0.65)'
                                    : 'rgba(90, 64, 37, 0.5)',
                                opacity: pressed ? 0.7 : 1,
                            })}
                        >
                            <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: FONT_WEIGHTS.bold,
                                    color: isActive ? '#ffd700' : '#c9a87a',
                                    letterSpacing: 0.3,
                                }}
                            >
                                {cat.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* ── Divider ─────────────────────────────────────────────── */}
            <View style={{ height: 1, backgroundColor: 'rgba(90, 64, 37, 0.4)', marginHorizontal: SPACING.lg }} />

            {/* ── Item grid ───────────────────────────────────────────── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    padding: SPACING.lg,
                    gap: SPACING.md,
                }}
            >
                {activeCategory === 'coins' ? (
                    <IapSection />
                ) : filteredItems.length === 0 ? (
                    <EmptyState title={t.emptyShelf ?? 'Nothing here'} description={t.emptyShelfDesc ?? ''} />
                ) : (
                    <View key={activeCategory} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }}>
                        {filteredItems.map((item, index) => (
                            <ShopCard
                                key={item.id}
                                item={item}
                                coins={coins}
                                inventory={inventory}
                                activeTheme={activeTheme}
                                activeSkin={activeSkin}
                                playerAvatar={playerAvatar}
                                t={t}
                                purchasing={purchasing}
                                staggerIndex={index}
                                onBuy={() => handlePurchase(item)}
                                onEquip={() => handleEquip(item)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </ModalShell>
    );
};

// ── ShopCard ────────────────────────────────────────────────────────────────
interface ShopCardProps {
    item: ShopItem;
    coins: number;
    inventory: string[];
    activeTheme: string;
    activeSkin: string;
    playerAvatar: string;
    t: Partial<TranslationKeys>;
    /** True while a purchase is in-flight — disables all buy buttons globally. */
    purchasing: boolean;
    /** Position index — drives stagger entrance delay (50ms per card). */
    staggerIndex: number;
    onBuy: () => void;
    onEquip: () => void;
}

const ShopCard = ({
    item, coins, inventory, activeTheme, activeSkin, playerAvatar, t, purchasing, staggerIndex, onBuy, onEquip,
}: ShopCardProps) => {
    // Stagger entrance: scale up from 0.75 + fade in, offset by 50ms per index
    const enterScale = useSharedValue(0.75);
    const enterOpacity = useSharedValue(0);
    useEffect(() => {
        const delay = Math.min(staggerIndex * 50, 400); // cap at 400ms
        enterScale.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 180 }));
        enterOpacity.value = withDelay(delay, withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const cardAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: enterScale.value }],
        opacity: enterOpacity.value,
    }));
    const isPowerUp = isPowerUpItem(item);
    const isOwned = !isPowerUp && (inventory.includes(item.id) || item.price === 0);
    const isEquipped = !isPowerUp && (
        activeTheme === item.id ||
        activeSkin === item.id ||
        (item.category === 'avatar' && playerAvatar === item.icon)
    );
    const canAfford = coins >= item.price;
    const isFree = item.price === 0;

    // Border glow when equipped
    const borderColor = isEquipped
        ? 'rgba(255, 215, 0, 0.75)'
        : isOwned
            ? 'rgba(74, 222, 128, 0.35)'
            : 'rgba(90, 64, 37, 0.5)';

    return (
        <Animated.View
            style={[
                {
                    width: '47.5%',
                    backgroundColor: isEquipped ? 'rgba(255, 215, 0, 0.07)' : 'rgba(0, 0, 0, 0.3)',
                    borderRadius: RADII.lg,
                    borderWidth: 1.5,
                    borderColor,
                    overflow: 'hidden',
                    shadowColor: isEquipped ? '#ffd700' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isEquipped ? 0.4 : 0.3,
                    shadowRadius: isEquipped ? 6 : 3,
                    elevation: isEquipped ? 6 : 3,
                },
                cardAnimStyle,
            ]}
        >
            {/* Preview area */}
            <View
                style={{
                    height: 88,
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                <ShopItemPreview item={item} size="md" />

                {/* Status badge — top right */}
                <View style={{ position: 'absolute', top: 6, right: 6 }}>
                    {isEquipped ? (
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 3,
                            backgroundColor: '#ffd700', borderRadius: RADII.pill,
                            paddingHorizontal: 7, paddingVertical: 3,
                        }}>
                            <Check size={10} color="#1a1109" strokeWidth={3} />
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#1a1109' }}>
                                {t.active ?? 'ON'}
                            </Text>
                        </View>
                    ) : isFree && !isOwned ? (
                        <View style={{
                            backgroundColor: '#4ade80', borderRadius: RADII.pill,
                            paddingHorizontal: 7, paddingVertical: 3,
                        }}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#052e16' }}>
                                FREE
                            </Text>
                        </View>
                    ) : isOwned ? (
                        <View style={{
                            backgroundColor: 'rgba(74, 222, 128, 0.25)', borderRadius: RADII.pill,
                            paddingHorizontal: 7, paddingVertical: 3,
                            borderWidth: 1, borderColor: '#4ade80',
                        }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#4ade80' }}>
                                {t.owned ?? 'OWNED'}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </View>

            {/* Info + Action */}
            <View style={{ padding: SPACING.sm, gap: SPACING.xs }}>
                {/* Name */}
                <Text
                    style={{
                        fontSize: 13,
                        fontWeight: FONT_WEIGHTS.bold,
                        color: '#f5e6c8',
                        textAlign: 'center',
                    }}
                    numberOfLines={1}
                >
                    {item.name}
                </Text>

                {/* Action button */}
                {isOwned ? (
                    ['theme', 'skin', 'avatar'].includes(item.category) ? (
                        <TouchableOpacity
                            onPress={onEquip}
                            disabled={isEquipped}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={isEquipped ? `${item.name} — ${t.active ?? 'Active'}` : `${item.name} — ${t.equip ?? 'Equip'}`}
                            accessibilityState={{ disabled: isEquipped }}
                            style={{
                                minHeight: 44,
                                justifyContent: 'center',
                                borderRadius: RADII.sm,
                                alignItems: 'center',
                                backgroundColor: isEquipped
                                    ? 'rgba(255, 215, 0, 0.12)'
                                    : 'rgba(255, 215, 0, 0.85)',
                                borderWidth: 1,
                                borderColor: isEquipped
                                    ? 'rgba(255,215,0,0.25)'
                                    : '#ffd700',
                            }}
                        >
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '800',
                                color: isEquipped ? '#ffd700' : '#1a1109',
                                letterSpacing: 0.5,
                            }} maxFontSizeMultiplier={1.2}>
                                {isEquipped ? (t.active ?? 'ACTIVE') : (t.equip ?? 'EQUIP')}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        // Power-up — show count info, no equip
                        <View style={{
                            minHeight: 44,
                            justifyContent: 'center',
                            borderRadius: RADII.sm,
                            alignItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                        }}>
                            <Text style={{ fontSize: 12, color: '#f5e6c8', fontWeight: '600' }}>
                                {t.owned ?? 'OWNED'}
                            </Text>
                        </View>
                    )
                ) : (
                    <TouchableOpacity
                        onPress={onBuy}
                        disabled={!canAfford || purchasing}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={isFree
                            ? `${item.name} — ${t.claim ?? 'Claim for free'}`
                            : canAfford
                                ? `${item.name} — ${t.buy ?? 'Buy'} ${item.price} coins`
                                : `${item.name} — ${t.locked ?? 'Not enough coins'}`}
                        accessibilityState={{ disabled: !canAfford || purchasing }}
                        style={{
                            minHeight: 44,
                            borderRadius: RADII.sm,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 5,
                            backgroundColor: canAfford && !purchasing
                                ? 'rgba(255, 215, 0, 0.85)'
                                : 'rgba(90, 64, 37, 0.3)',
                            borderWidth: 1,
                            borderColor: canAfford && !purchasing ? '#ffd700' : 'rgba(90,64,37,0.4)',
                            opacity: canAfford && !purchasing ? 1 : 0.6,
                        }}
                    >
                        {!canAfford && <Lock size={12} color="#d4b896" strokeWidth={2.5} />}
                        <Text style={{
                            fontSize: 12,
                            fontWeight: '800',
                            color: canAfford && !purchasing ? '#1a1109' : '#d4b896',
                            letterSpacing: 0.3,
                        }} maxFontSizeMultiplier={1.2}>
                            {isFree ? (t.claim ?? 'CLAIM') : `💰 ${item.price}`}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
};
