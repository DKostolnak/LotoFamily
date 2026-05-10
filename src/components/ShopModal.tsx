import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { ModalShell, ListRow, Badge, CoinBadge, WoodenButton, EmptyState } from '@/components/common';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';
import { useGameStore } from '@/lib/store';
import { SHOP_ITEMS, type ShopItem, isPowerUpItem } from '@/lib/shop';
import { translations } from '@/lib/i18n';
import * as Haptics from 'expo-haptics';
import { ShopItemPreview } from '@/components/shop/ShopItemPreview';

interface ShopModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ShopModal = ({ visible, onClose }: ShopModalProps) => {
    const { coins, inventory, purchaseItem, removeCoins, addPowerUp, activeTheme, activeSkin, equipItem, playerAvatar, setPlayerAvatar, language } = useGameStore();
    const t = translations[language];
    type CategoryId = 'all' | 'avatar' | 'theme' | 'skin' | 'powerup';
    const [activeCategory, setActiveCategory] = useState<CategoryId>('all');

    useEffect(() => {
        if (visible) {
            setActiveCategory('all');
        }
    }, [visible]);

    const handlePurchase = (item: ShopItem) => {
        if (coins < item.price) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
            return;
        }
        // Power-up packs are consumable — never enter the cosmetic `inventory`
        // array. Deduct coins and increment the powerUps counter directly.
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
            noScroll
            maxHeight="85%"
        >
            {/* Tab strip */}
            <View
                style={{
                    height: 52,
                    backgroundColor: '#1a1109',
                    borderRadius: RADII.md,
                    borderWidth: 1,
                    borderColor: '#5a4025',
                    flexDirection: 'row',
                    padding: 4,
                    overflow: 'hidden',
                }}
            >
                {categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                        <Pressable
                            key={cat.id}
                            style={{
                                flex: 1,
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
                                    {
                                        paddingHorizontal: SPACING.xs,
                                        color: isActive ? '#ffd700' : '#d4b896',
                                    },
                                ]}
                            >
                                {cat.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Items list */}
            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, marginTop: SPACING.md }}
                contentContainerStyle={{ gap: SPACING.md, paddingBottom: SPACING.lg }}
                windowSize={5}
                ListEmptyComponent={
                    <EmptyState
                        title={t.emptyShelf}
                        description={t.emptyShelfDesc}
                    />
                }
                renderItem={({ item }) => {
                    // Power-up packs are consumable — always purchasable, never "owned".
                    const isPowerUp = isPowerUpItem(item);
                    const isOwned = !isPowerUp && (inventory.includes(item.id) || item.price === 0);
                    const isEquipped = !isPowerUp && (activeTheme === item.id || activeSkin === item.id || (item.category === 'avatar' && playerAvatar === item.icon));
                    const canAfford = coins >= item.price;
                    const isFreeUnowned = !isPowerUp && item.price === 0 && !isEquipped;

                    let badge: React.ReactNode = null;
                    if (isEquipped) {
                        badge = <Badge label={t.active} variant="gold" />;
                    } else if (isOwned && !isFreeUnowned) {
                        badge = <Badge label={t.owned} variant="success" />;
                    } else if (isFreeUnowned) {
                        badge = <Badge label={t.free} variant="info" />;
                    }

                    let action: React.ReactNode;
                    if (isOwned) {
                        if (['theme', 'skin', 'avatar'].includes(item.category)) {
                            action = (
                                <WoodenButton
                                    size="sm"
                                    variant={isEquipped ? 'secondary' : 'gold'}
                                    onPress={() => handleEquip(item)}
                                    disabled={isEquipped}
                                >
                                    {isEquipped ? t.active : t.equip}
                                </WoodenButton>
                            );
                        } else {
                            action = <Badge label={t.owned} variant="success" />;
                        }
                    } else {
                        action = (
                            <WoodenButton
                                size="sm"
                                variant={canAfford ? 'success' : 'secondary'}
                                onPress={() => handlePurchase(item)}
                                disabled={!canAfford}
                            >
                                {`💰 ${item.price}`}
                            </WoodenButton>
                        );
                    }

                    return (
                        <ListRow
                            icon={
                                <View
                                    style={{
                                        width: 36,
                                        height: 36,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <ShopItemPreview item={item} />
                                </View>
                            }
                            title={item.name}
                            subtitle={item.description}
                            selected={isEquipped}
                            right={
                                <View style={{ alignItems: 'flex-end', gap: SPACING.xs }}>
                                    {badge}
                                    {action}
                                </View>
                            }
                        />
                    );
                }}
            />
        </ModalShell>
    );
};
