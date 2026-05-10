/**
 * PowerUpBar — floating in-game row of consumable power-up buttons.
 *
 * Each button shows the power-up icon, count badge, and dispatches:
 *  - `onUse(type)` when count > 0 (caller is responsible for actually
 *    consuming via `usePowerUp` and applying the gameplay effect)
 *  - `onWatchAd(type)` when count === 0 (caller shows rewarded ad and on
 *    success calls `addPowerUp(type, 1)`)
 *
 * The component is purely presentational — it doesn't touch the store.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { SPACING, RADII, TEXT_STYLES } from '@/lib/config';
import type { PowerUpInventory } from '@/lib/store/types';

export interface PowerUpBarProps {
    inventory: PowerUpInventory;
    onUse: (type: keyof PowerUpInventory) => void;
    onWatchAd: (type: keyof PowerUpInventory) => void;
    /** Indicate which power-ups are currently "active" (e.g. slowTime in 30s window). */
    activeEffects?: Partial<Record<keyof PowerUpInventory, boolean>>;
    /** Optional accessibility labels keyed by power-up type. */
    a11yLabels?: Partial<Record<keyof PowerUpInventory, string>>;
    /** Optional ad-fallback accessibility label. */
    a11yWatchAdLabel?: string;
    style?: ViewStyle;
}

interface PowerUpDef {
    type: keyof PowerUpInventory;
    icon: string;
}

// MVP power-up display order
const POWER_UPS: readonly PowerUpDef[] = [
    { type: 'peek', icon: '🔮' },
    { type: 'luckyMark', icon: '✨' },
    { type: 'slowTime', icon: '⏰' },
] as const;

export const PowerUpBar: React.FC<PowerUpBarProps> = ({
    inventory,
    onUse,
    onWatchAd,
    activeEffects,
    a11yLabels,
    a11yWatchAdLabel,
    style,
}) => {
    return (
        <View
            style={[
                {
                    height: 64,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    paddingHorizontal: SPACING.lg,
                    paddingVertical: SPACING.xs,
                    backgroundColor: 'rgba(26, 17, 9, 0.85)',
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: 'rgba(90, 64, 37, 0.6)',
                },
                style,
            ]}
            accessibilityRole="toolbar"
        >
            {POWER_UPS.map(({ type, icon }) => {
                const count = inventory?.[type] ?? 0;
                const hasInventory = count > 0;
                const isActive = !!activeEffects?.[type];
                const handlePress = () => {
                    if (hasInventory) {
                        onUse(type);
                    } else {
                        onWatchAd(type);
                    }
                };

                return (
                    <TouchableOpacity
                        key={type}
                        onPress={handlePress}
                        accessibilityRole="button"
                        accessibilityLabel={
                            hasInventory
                                ? a11yLabels?.[type] ?? `${type} (${count})`
                                : a11yWatchAdLabel ?? `Watch ad for ${type}`
                        }
                        style={{
                            minWidth: 64,
                            minHeight: 44,
                            paddingHorizontal: SPACING.sm,
                            paddingVertical: SPACING.xs,
                            borderRadius: RADII.md,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isActive ? 'rgba(255, 215, 0, 0.18)' : '#3d2814',
                            borderWidth: isActive ? 2 : 1,
                            borderColor: isActive
                                ? '#ffd700'
                                : hasInventory
                                    ? 'rgba(90, 64, 37, 0.7)'
                                    : 'rgba(90, 64, 37, 0.4)',
                            opacity: hasInventory ? 1 : 0.5,
                        }}
                    >
                        <View>
                            <Text style={{ fontSize: 28, lineHeight: 32 }}>{icon}</Text>
                            {/* Count badge bottom-right */}
                            <View
                                style={{
                                    position: 'absolute',
                                    right: -10,
                                    bottom: -6,
                                    minWidth: 20,
                                    height: 20,
                                    paddingHorizontal: 5,
                                    borderRadius: 10,
                                    backgroundColor: hasInventory ? '#4ade80' : '#ef4444',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1,
                                    borderColor: '#1a1109',
                                }}
                            >
                                <Text
                                    style={[
                                        TEXT_STYLES.captionUpper,
                                        { color: '#1a1109', fontSize: 11, lineHeight: 14 },
                                    ]}
                                >
                                    {hasInventory ? count : '+'}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default PowerUpBar;
