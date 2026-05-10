/**
 * Section — UNIFIED section pattern inside modals/screens.
 *
 * Every modal section MUST use this primitive. It enforces:
 *   - Section header in TEXT_STYLES.captionUpper, muted color, 1pt bottom rule.
 *   - Children gap SPACING.md (12pt).
 *   - Outer container has no padding (assumed parent provides SPACING.lg).
 *
 * Composition: place multiple <Section /> blocks vertically inside a
 * ModalShell content area. The ModalShell content gap (SPACING.lg) gives
 * inter-section breathing room.
 */

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { TEXT_STYLES, SPACING } from '@/lib/config';

interface SectionProps {
    title?: string;
    /** Optional right-side header element (e.g. "View all" link). */
    headerRight?: React.ReactNode;
    children: React.ReactNode;
    /** Override children spacing (default SPACING.md). */
    gap?: number;
    style?: ViewStyle;
}

const TEXT_MUTED = '#d4b896';
const RULE = 'rgba(90, 64, 37, 0.35)';

export function Section({
    title,
    headerRight,
    children,
    gap = SPACING.md,
    style,
}: SectionProps) {
    return (
        <View style={[{ gap }, style]}>
            {title || headerRight ? (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: SPACING.sm,
                        borderBottomWidth: 1,
                        borderBottomColor: RULE,
                        gap: SPACING.sm,
                    }}
                >
                    {title ? (
                        <Text
                            style={[
                                TEXT_STYLES.captionUpper,
                                { color: TEXT_MUTED, flex: 1 },
                            ]}
                            numberOfLines={1}
                        >
                            {title}
                        </Text>
                    ) : (
                        <View style={{ flex: 1 }} />
                    )}
                    {headerRight}
                </View>
            ) : null}

            {children}
        </View>
    );
}

export default Section;
