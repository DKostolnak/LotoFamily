import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { ChevronLeft, X } from 'lucide-react-native';
import { useResponsive } from '@/hooks';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';


export interface WoodenCardProps {
    children: React.ReactNode;
    /** Modal title — rendered as h1 in gold, in a structured header. */
    title?: string;
    /** Optional subtitle — small muted caption directly under the title. */
    subtitle?: string;
    /** Show a back arrow chrome button (absolute, top-left). */
    showBackArrow?: boolean;
    onBack?: () => void;
    /** Show a close (X) button in the header (or absolute when no title). */
    onClose?: () => void;
    /** Container style override. */
    style?: ViewStyle;
    /** Padding/wrapper style for children area (default: SPACING.lg). */
    contentStyle?: ViewStyle;
    /** Show outer wood border (default true). */
    showBorder?: boolean;
    className?: string; // For NativeWind
}

const HEADER_DIVIDER_COLOR = 'rgba(90, 64, 37, 0.4)';
const GOLD = '#ffd700';
const CREAM_DARK = '#d4b896';
const CREAM = '#f5e6c8';

export function WoodenCard({
    children,
    title,
    subtitle,
    showBackArrow,
    onBack,
    onClose,
    style,
    contentStyle,
    showBorder = true,
    className,
}: WoodenCardProps) {
    const { screenWidth, scale, isTablet } = useResponsive();

    const horizontalMargin = scale(16);
    const maxWidth = isTablet ? 560 : 520;
    const containerMaxWidth = Math.min(maxWidth, Math.max(320, screenWidth - horizontalMargin * 2));
    const radius = scale(24);

    // Decide whether to render the structured header (title/subtitle row).
    const hasStructuredHeader = Boolean(title || subtitle);

    // When we have no structured header, fall back to the legacy absolute close button
    // so simple cards (RateApp / DailyBonus / ErrorBoundary) still work.
    const showAbsoluteClose = Boolean(onClose) && !hasStructuredHeader;

    return (
        <View
            className={className}
            style={{
                width: '100%',
                backgroundColor: 'rgba(26, 17, 9, 0.95)',
                borderWidth: showBorder ? 4 : 0,
                borderColor: '#8b6b4a',
                maxWidth: containerMaxWidth,
                borderRadius: radius,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.8,
                shadowRadius: 50,
                elevation: 10,
                ...style,
            }}
        >
            {/* Back Arrow (absolute, legacy) */}
            {showBackArrow && onBack && (
                <TouchableOpacity
                    onPress={onBack}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        width: 44,
                        height: 44,
                        backgroundColor: '#c9a66b',
                        borderRadius: RADII.sm,
                        borderWidth: 2,
                        borderColor: '#5a4025',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20,
                    }}
                >
                    <ChevronLeft color="#3d2814" size={24} strokeWidth={2.5} />
                </TouchableOpacity>
            )}

            {/* Absolute Close Button (only when there is no structured header). */}
            {showAbsoluteClose && (
                <TouchableOpacity
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 44,
                        height: 44,
                        backgroundColor: '#c9a66b',
                        borderRadius: RADII.sm,
                        borderWidth: 2,
                        borderColor: '#5a4025',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20,
                    }}
                >
                    <X color="#3d2814" size={24} strokeWidth={2.5} />
                </TouchableOpacity>
            )}

            {/* Structured Header */}
            {hasStructuredHeader && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        paddingHorizontal: SPACING.lg,
                        paddingTop: SPACING.lg,
                        paddingBottom: SPACING.md,
                        borderBottomWidth: 1,
                        borderBottomColor: HEADER_DIVIDER_COLOR,
                    }}
                >
                    <View style={{ flex: 1, paddingRight: onClose ? SPACING.md : 0 }}>
                        {title && (
                            <Text
                                style={[
                                    TEXT_STYLES.h1,
                                    {
                                        color: GOLD,
                                        textShadowColor: 'rgba(0,0,0,0.5)',
                                        textShadowOffset: { width: 0, height: 2 },
                                        textShadowRadius: 4,
                                    },
                                ]}
                                numberOfLines={2}
                            >
                                {title}
                            </Text>
                        )}
                        {subtitle && (
                            <Text
                                style={[
                                    TEXT_STYLES.caption,
                                    { color: CREAM_DARK, marginTop: SPACING.xs },
                                ]}
                                numberOfLines={2}
                            >
                                {subtitle}
                            </Text>
                        )}
                    </View>
                    {onClose && (
                        <TouchableOpacity
                            onPress={onClose}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            style={{
                                width: 44,
                                height: 44,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: -SPACING.sm,
                                marginTop: -SPACING.xs,
                            }}
                            hitSlop={8}
                        >
                            <X size={24} color={CREAM} strokeWidth={2.5} />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Content area */}
            <View
                style={[
                    {
                        padding: SPACING.lg,
                        paddingTop: hasStructuredHeader ? SPACING.lg : SPACING.xl,
                    },
                    contentStyle,
                ]}
            >
                {children}
            </View>
        </View>
    );
}
