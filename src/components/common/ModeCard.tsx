import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface ModeCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    style?: ViewStyle;
}

/**
 * ModeCard — vertical card with icon (top), title (middle), subtitle
 * (bottom). Used for the Play Section: 1 primary card + 2 secondary
 * cards in a row. Generous tap targets for the family-bingo audience.
 */
export function ModeCard({ icon, title, subtitle, onPress, variant = 'secondary', style }: ModeCardProps) {
    const isPrimary = variant === 'primary';
    const handlePress = () => {
        Haptics.impactAsync(
            isPrimary ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium
        );
        onPress();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
            style={[
                {
                    minHeight: isPrimary ? 120 : 100,
                    paddingVertical: SPACING.md,
                    paddingHorizontal: SPACING.md,
                    borderRadius: RADII.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: SPACING.xs,
                    backgroundColor: isPrimary ? 'rgba(255, 215, 0, 0.14)' : 'rgba(45, 31, 16, 0.85)',
                    borderWidth: 2,
                    borderColor: isPrimary ? '#ffd700' : 'rgba(90, 64, 37, 0.7)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 6,
                    elevation: 6,
                },
                style,
            ]}
        >
            <View
                style={{
                    width: isPrimary ? 56 : 48,
                    height: isPrimary ? 56 : 48,
                    borderRadius: RADII.md,
                    backgroundColor: isPrimary ? '#ffd700' : 'rgba(0,0,0,0.35)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: SPACING.xs,
                }}
            >
                {icon}
            </View>
            <Text
                style={[
                    isPrimary ? TEXT_STYLES.h3 : TEXT_STYLES.bodyBold,
                    { color: isPrimary ? '#ffd700' : '#f5e6c8', textAlign: 'center' },
                ]}
                numberOfLines={2}
            >
                {title}
            </Text>
            {subtitle ? (
                <Text
                    style={[
                        TEXT_STYLES.caption,
                        { color: '#d4b896', textAlign: 'center' },
                    ]}
                    numberOfLines={2}
                >
                    {subtitle}
                </Text>
            ) : null}
        </TouchableOpacity>
    );
}

export default ModeCard;
