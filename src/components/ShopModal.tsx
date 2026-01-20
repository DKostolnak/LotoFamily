import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, FlatList } from 'react-native';
import { WoodenCard, AnimatedModal, EmptyState } from '@/components/common';
import { useGameStore } from '@/lib/store';
import { SHOP_ITEMS, type ShopItem, isThemeItem, isSkinItem } from '@/lib/shop';
import { getThemeColors, getSkinColors } from '@/lib/config';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';

interface ShopModalProps {
    visible: boolean;
    onClose: () => void;
}
// ... (rest of imports)

import { ShopItemPreview } from '@/components/shop/ShopItemPreview';

export const ShopModal = ({ visible, onClose }: ShopModalProps) => {
    const { coins, inventory, purchaseItem, activeTheme, activeSkin, equipItem, playerAvatar, setPlayerAvatar } = useGameStore();
    type CategoryId = 'all' | 'avatar' | 'theme' | 'skin';
    const [activeCategory, setActiveCategory] = useState<CategoryId>('all');

    // Reset category whenever the shop is reopened so "All" always shows the full catalog.
    useEffect(() => {
        if (visible) {
            setActiveCategory('all');
        }
    }, [visible]);

    const handlePurchase = (item: ShopItem) => {
        if (coins >= item.price) {
            const success = purchaseItem(item.id, item.price);
            if (success) {
                // Haptics may fail on unsupported platforms; ignore errors so UI keeps working.
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
            }
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
        }
    };

    const handleEquip = (item: ShopItem) => {
        if (item.category === 'theme' || item.category === 'skin') {
            equipItem(item.category, item.id);
            Haptics.selectionAsync().catch(() => { });
        } else if (item.category === 'avatar') {
            // For avatars, set the player avatar to the item's icon
            setPlayerAvatar(item.icon);
            Haptics.selectionAsync().catch(() => { });
        }
    };

    const categories: { id: CategoryId; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'avatar', label: 'Avatars' },
        { id: 'theme', label: 'Themes' },
        { id: 'skin', label: 'Markers' },
    ];

    const filteredItems = useMemo(
        () => SHOP_ITEMS.filter((i) => activeCategory === 'all' || i.category === activeCategory),
        [activeCategory]
    );

    return (
        <AnimatedModal visible={visible} onClose={onClose} animation="slide" closeOnBackdrop={false}>
            <View style={{ width: '100%', height: '70%' }}>
                <WoodenCard style={{ flex: 1, width: '100%' }} onClose={onClose}>

                    {/* Custom Header Row to avoid Z-Index/Stacking issues */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 4, marginBottom: 12 }}>
                        {/* Balance Badge */}
                        <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 16 }}>💰</Text>
                            <Text style={{ color: '#ffd700', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 16 }}>{coins}</Text>
                        </View>

                        {/* Title */}
                        <Text style={{
                            fontSize: 24,
                            fontWeight: '900',
                            color: '#ffd700',
                            textTransform: 'uppercase',
                            textAlign: 'center',
                            textShadowColor: 'rgba(0,0,0,0.5)',
                            textShadowOffset: { width: 0, height: 2 },
                            textShadowRadius: 4,
                            // Offset slightly to center visually against the close button space
                            marginRight: 20
                        }}>
                            Grand Store
                        </Text>

                        {/* Spacer for Close Button (approx 44px) */}
                        <View style={{ width: 44 }} />
                    </View>

                    {/* Category Tabs */}
                    <View style={{ marginBottom: 16, marginHorizontal: 4, height: 48, backgroundColor: '#1a1109', borderRadius: 12, borderWidth: 1, borderColor: '#5a4025', flexDirection: 'row', padding: 4, overflow: 'hidden' }}>
                        {categories.map((cat) => {
                            const isActive = activeCategory === cat.id;
                            return (
                                <Pressable
                                    key={cat.id}
                                    style={{
                                        flex: 1,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 8,
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
                                        style={{
                                            fontWeight: 'bold',
                                            fontSize: 10,
                                            textTransform: 'uppercase',
                                            letterSpacing: 1,
                                            color: isActive ? '#ffd700' : '#8b6b4a',
                                        }}
                                    >
                                        {cat.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Shop Shelves - Virtualized */}
                    <FlatList
                        data={filteredItems}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ padding: 4, gap: 12, paddingBottom: 20 }}
                        windowSize={5}
                        ListEmptyComponent={
                            <EmptyState
                                title="Empty Shelf"
                                description="No items available in this category yet. Check back soon!"
                            />
                        }
                        renderItem={({ item }) => {
                            const isOwned = inventory.includes(item.id) || item.price === 0;
                            const isEquipped = activeTheme === item.id || activeSkin === item.id || (item.category === 'avatar' && playerAvatar === item.icon);
                            const canAfford = coins >= item.price;

                            return (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 12,
                                        borderRadius: 12,
                                        borderWidth: 2,
                                        backgroundColor: isEquipped ? '#3d2814' : '#2d1f10',
                                        borderColor: isEquipped ? '#ffd700' : isOwned ? '#5a4025' : '#4a3015',
                                        opacity: (!isOwned && !isEquipped) ? 0.9 : 1
                                    }}
                                >
                                    {/* Icon Container */}
                                    <View style={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: 8,
                                        borderWidth: 2,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        borderColor: isEquipped ? '#ffd700' : '#5a4025'
                                    }}>
                                        <ShopItemPreview item={item} />
                                        {isEquipped && (
                                            <View style={{
                                                position: 'absolute',
                                                top: -6,
                                                right: -6,
                                                backgroundColor: '#ffd700',
                                                borderRadius: 999,
                                                padding: 3,
                                                borderWidth: 1,
                                                borderColor: 'rgba(255,255,255,0.2)',
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 1
                                            }}>
                                                <Check size={10} color="#000" strokeWidth={4} />
                                            </View>
                                        )}
                                    </View>

                                    {/* Info Section */}
                                    <View style={{ flex: 1, paddingHorizontal: 12, justifyContent: 'center' }}>
                                        <Text style={{ color: '#f5e6c8', fontWeight: 'bold', fontSize: 16, lineHeight: 20, marginBottom: 2 }} numberOfLines={1}>{item.name}</Text>
                                        <Text style={{ color: '#8b6b4a', fontSize: 11, lineHeight: 14 }} numberOfLines={2}>{item.description}</Text>
                                    </View>

                                    {/* Action Button */}
                                    <View style={{ width: 84 }}>
                                        {isOwned ? (
                                            ['theme', 'skin', 'avatar'].includes(item.category) ? (
                                                <TouchableOpacity
                                                    onPress={() => handleEquip(item)}
                                                    disabled={isEquipped}
                                                    style={{
                                                        width: '100%',
                                                        paddingVertical: 6,
                                                        borderRadius: 8,
                                                        alignItems: 'center',
                                                        borderWidth: 1,
                                                        backgroundColor: isEquipped ? 'rgba(255, 215, 0, 0.1)' : '#eab308',
                                                        borderColor: isEquipped ? 'rgba(255, 215, 0, 0.3)' : '#ca8a04'
                                                    }}
                                                >
                                                    <Text style={{ fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', color: isEquipped ? '#ffd700' : '#3d2814' }}>
                                                        {isEquipped ? 'Active' : 'Equip'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={{ width: '100%', paddingVertical: 6, backgroundColor: '#2d1f10', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)', borderRadius: 8, alignItems: 'center' }}>
                                                    <Text style={{ color: '#4ade80', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase' }}>Owned</Text>
                                                </View>
                                            )
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => handlePurchase(item)}
                                                disabled={!canAfford}
                                                style={{
                                                    width: '100%',
                                                    paddingVertical: 6,
                                                    borderRadius: 8,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexDirection: 'row',
                                                    gap: 4,
                                                    borderBottomWidth: 2,
                                                    backgroundColor: canAfford ? '#22c55e' : '#374151',
                                                    borderColor: canAfford ? '#15803d' : '#1f2937'
                                                }}
                                            >
                                                <Text style={{ fontSize: 12 }}>💰</Text>
                                                <Text style={{ fontWeight: 'bold', fontSize: 12, color: canAfford ? 'white' : '#9ca3af' }}>
                                                    {item.price}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        }}
                    />
                </WoodenCard>
            </View>
        </AnimatedModal>
    );
};
