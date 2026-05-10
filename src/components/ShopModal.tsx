import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { ModalShell, Badge, CoinBadge, WoodenButton, EmptyState } from '@/components/common';
import { TEXT_STYLES, SPACING, RADII, FONT_WEIGHTS } from '@/lib/config';
import { useGameStore } from '@/lib/store';
import { SHOP_ITEMS, type ShopItem, isPowerUpItem } from '@/lib/shop';
import { translations } from '@/lib/i18n';
import * as Haptics from 'expo-haptics';
import { ShopItemPreview } from '@/components/shop/ShopItemPreview';

interface ShopModalProps {
    visible: boolean;
    onClose: () => void;
}

/**
 * ShopModal — 2-column card grid layout (was a dense vertical list with
 * filler descriptions). Each card has a big preview tile, the item name,
 * and a single primary action (equip / buy / claim).
 */
export const ShopModal = ({ visible, onClose }: ShopModalProps) => {
    const {
        coins, inventory, purchaseItem, removeCoins, addPowerUp,
        activeTheme, activeSkin, equipItem, playerAvatar, setPlayerAvatar,
        language,
    } = useGameStore();
    const t = translations[language];
    type CategoryId = 'all' | 'avatar' | 'theme' | 'skin' | 'powerup';
    const [activeCategory, setActiveCategory] = useState<CategoryId>('all');

    useEffect(() => {
        if (visible) setActiveCategory('all');
    }, [visible]);

    const handlePurchase = (item: ShopItem) => {
        if (coins < item.price) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
            return;
        }
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

    const categories: { id: CategoryId; label: string }[] = [
        { id: 'all', label: t.all },
        { id: 'avatar', label: t.avatars },
        { id: 'theme', label: t.themes },
        { id: 'skin', label: t.markers },
        { id: 'powerup', label: t.powerUps },
    ];

    const filteredItems = useMemo(
        () => SHOP_ITEMS.filter((i) => activeCategory === 'all' || i.category === activeCategory),
        [activeCategory]
    );

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={t.shopTitle}
            headerRight={<CoinBadge coins={coins} size="sm" />}
        >
            {/* Tab strip — horizontal scroll so all category labels render at native size */}
            <View
                style={{
                    height: 52,
                    backgroundColor: '#1a1109',
                    borderRadius: RADII.md,
                    borderWidth: 1,
                    borderColor: '#5a4025',
                    overflow: 'hidden',
                }}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        flexGrow: 1,
                        flexDirection: 'row',
                        padding: 4,
                        gap: 4,
                        alignItems: 'stretch',
                    }}
                >
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <Pressable
                                key={cat.id}
                                style={{
                                    paddingHorizontal: SPACING.md,
                                    minWidth: 80,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: RADII.sm,
                                    backgroundColor: isActive ? '#3d2814' : 'transparent',
                                    borderWidth: isActive ? 1 : 0,
                                    borderColor: isActive ? 'rgba(255, 215, 0, 0.5)' : 'transparent',
                                }}
                                onPress={() => {
                                    Haptics.selectionAsync().catch(() => { });
                                    setActiveCategory(cat.id);
                                }}
                            >
                                <Text
                                    numberOfLines={1}
                                    style={[
                                        TEXT_STYLES.captionUpper,
                                        { color: isActive ? '#ffd700' : '#d4b896' },
                                    ]}
                                >
                                    {cat.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Card grid — 2 columns */}
            {filteredItems.length === 0 ? (
                <EmptyState title={t.emptyShelf} description={t.emptyShelfDesc} />
            ) : (
                <View
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: SPACING.md,
                    }}
                >
                    {filteredItems.map((item) => {
                        const isPowerUp = isPowerUpItem(item);
                        const isOwned =
                            !isPowerUp &&
                            (inventory.includes(item.id) || item.price === 0);
                        const isEquipped =
                            !isPowerUp &&
                            (activeTheme === item.id ||
                                activeSkin === item.id ||
                                (item.category === 'avatar' &&
                                    playerAvatar === item.icon));
                        const canAfford = coins >= item.price;

                        // Status badge in the top-right corner of the card
                        let cornerBadge: React.ReactNode = null;
                        if (isEquipped) {
                            cornerBadge = <Badge label={t.active} variant="gold" />;
                        } else if (isOwned && item.price > 0) {
                            cornerBadge = <Badge label={t.owned} variant="success" />;
                        } else if (item.price === 0 && !isEquipped) {
                            cornerBadge = <Badge label={t.free} variant="info" />;
                        }

                        // Bottom action — single button per card
                        let action: React.ReactNode;
                        if (isOwned) {
                            if (
                                ['theme', 'skin', 'avatar'].includes(item.category)
                            ) {
                                action = (
                                    <WoodenButton
                                        size="sm"
                                        variant={isEquipped ? 'secondary' : 'gold'}
                                        onPress={() => handleEquip(item)}
                                        disabled={isEquipped}
                                        fullWidth
                                    >
                                        {isEquipped ? t.active : t.equip}
                                    </WoodenButton>
                                );
                            } else {
                                action = (
                                    <WoodenButton
                                        size="sm"
                                        variant="secondary"
                                        disabled
                                        fullWidth
                                    >
                                        {t.owned}
                                    </WoodenButton>
                                );
                            }
                        } else {
                            action = (
                                <WoodenButton
                                    size="sm"
                                    variant={canAfford ? 'gold' : 'secondary'}
                                    onPress={() => handlePurchase(item)}
                                    disabled={!canAfford}
                                    fullWidth
                                >
                                    {`💰 ${item.price}`}
                                </WoodenButton>
                            );
                        }

                        return (
                            <View
                                key={item.id}
                                style={{
                                    width: '48%',
                                    backgroundColor: 'rgba(26, 17, 9, 0.7)',
                                    borderRadius: RADII.md,
                                    borderWidth: 2,
                                    borderColor: isEquipped
                                        ? '#ffd700'
                                        : 'rgba(90, 64, 37, 0.55)',
                                    padding: SPACING.md,
                                    gap: SPACING.sm,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 3 },
                                    shadowOpacity: isEquipped ? 0.55 : 0.35,
                                    shadowRadius: 4,
                                    elevation: isEquipped ? 6 : 3,
                                }}
                            >
                                {/* Preview tile + corner badge */}
                                <View
                                    style={{
                                        height: 96,
                                        borderRadius: RADII.sm,
                                        backgroundColor: 'rgba(0, 0, 0, 0.35)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255, 215, 0, 0.18)',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <ShopItemPreview item={item} size="md" />

                                    {cornerBadge ? (
                                        <View
                                            style={{
                                                position: 'absolute',
                                                top: 4,
                                                right: 4,
                                            }}
                                        >
                                            {cornerBadge}
                                        </View>
                                    ) : null}
                                </View>

                                {/* Item name */}
                                <Text
                                    style={[
                                        TEXT_STYLES.bodyBold,
                                        {
                                            color: '#f5e6c8',
                                            textAlign: 'center',
                                            fontWeight: FONT_WEIGHTS.bold,
                                        },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.name}
                                </Text>

                                {/* Action button */}
                                {action}
                            </View>
                        );
                    })}
                </View>
            )}
        </ModalShell>
    );
};
