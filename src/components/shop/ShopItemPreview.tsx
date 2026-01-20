import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShopItem, isThemeItem, isSkinItem } from '@/lib/shop';
import { getThemeColors, getSkinColors } from '@/lib/config';

interface ShopItemPreviewProps {
    item: ShopItem;
    size?: 'sm' | 'md' | 'lg';
}

export const ShopItemPreview = ({ item, size = 'md' }: ShopItemPreviewProps) => {
    // Dimension scale multiplier
    const s = size === 'lg' ? 1.5 : size === 'sm' ? 0.6 : 1;

    if (isThemeItem(item)) {
        const colors = getThemeColors(item.themeId);
        return (
            <View style={[styles.cardPreview, {
                width: 64 * s,
                height: 56 * s,
                borderRadius: 6 * s,
                backgroundColor: colors.cardBg,
                borderColor: colors.border
            }]}>
                {/* Mini Header */}
                <View style={[styles.cardHeader, {
                    height: 16 * s,
                    backgroundColor: colors.headerBg,
                    borderColor: colors.border
                }]}>
                    <View style={{ width: 24 * s, height: 6 * s, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999 }} />
                    <View style={{ width: 8 * s, height: 6 * s, backgroundColor: '#4ade80', borderRadius: 2 * s }} />
                </View>
                {/* Mini Grid */}
                <View style={[styles.cardGrid, { backgroundColor: colors.gridBg }]}>
                    {[1, 2, 3].map(col => (
                        <View key={col} style={{ flex: 1, borderRightWidth: col < 3 ? 1 : 0, borderColor: 'rgba(0,0,0,0.1)' }}>
                            <View style={{ flex: 1, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }} />
                            <View style={{ flex: 1 }} />
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    if (isSkinItem(item)) {
        const colors = getSkinColors(item.skinId);
        return (
            <View style={[styles.skinPreview, {
                width: 56 * s,
                height: 56 * s,
                borderRadius: 999,
                backgroundColor: colors.bg,
                borderColor: colors.border
            }]}>
                {/* Inner ring */}
                <View style={[styles.skinInner, {
                    width: '70%',
                    height: '70%',
                    borderRadius: 999,
                    borderWidth: 1,
                }]}>
                    {/* Chip Number Placeholder */}
                    <Text style={{ fontSize: 18 * s, fontWeight: '900', color: 'rgba(255,255,255,0.5)' }}>7</Text>
                </View>
                {/* Shine */}
                <View style={[styles.shine, {
                    width: '40%',
                    height: '20%',
                    borderRadius: 999,
                }]} />
            </View>
        );
    }

    // Default Avatar Preview
    return (
        <View style={[styles.avatarContainer, { width: 64 * s, height: 64 * s }]}>
            <Text style={{
                fontSize: 48 * s,
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 0, height: 4 * s },
                textShadowRadius: 8
            }}>
                {item.icon}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    cardPreview: {
        borderWidth: 1,
        overflow: 'hidden',
    },
    cardHeader: {
        width: '100%',
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    cardGrid: {
        flex: 1,
        flexDirection: 'row',
        padding: 1,
    },
    skinPreview: {
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    skinInner: {
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shine: {
        position: 'absolute',
        top: 4,
        left: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        transform: [{ rotate: '-12deg' }],
    },
    avatarContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    }
});
