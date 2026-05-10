/**
 * ListRow — UNIFIED row primitive for lists, settings, shop items, players.
 *
 * Standard layout:
 *   ┌──────────────────────────────────────┐
 *   │ [Icon 28pt] Title (bodyBold)        │  56pt min height
 *   │             Subtitle (caption)       │  16pt left padding
 *   │                            [Action]  │  Action right-aligned
 *   └──────────────────────────────────────┘
 *
 * `selected` state uses gold border + slight gold tint.
 * `onPress` makes the entire row tappable (44pt+ touch target).
 *
 * Replaces: ad-hoc <View> rows with hand-rolled paddings/borders.
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Pressable,
    ViewStyle,
} from 'react-native';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

export interface ListRowProps {
    /** Icon node (lucide icon, emoji <Text>, etc.) — typically 24-28pt. */
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    /** Right-side element (badge, switch, button, chevron). */
    right?: React.ReactNode;
    /** Make the entire row tappable. */
    onPress?: () => void;
    /** Selected/active state — gold border + tint. */
    selected?: boolean;
    /** Disabled state — reduced opacity, no haptic. */
    disabled?: boolean;
    /** Override row min height. Default 56pt. */
    minHeight?: number;
    style?: ViewStyle;
    /** Accessibility label override. Default: title + subtitle. */
    accessibilityLabel?: string;
    /** Accessibility hint. */
    accessibilityHint?: string;
}

const SURFACE = '#1a1109';
const BORDER = 'rgba(90, 64, 37, 0.5)';
const SELECTED_BORDER = '#ffd700';
const SELECTED_BG = 'rgba(255, 215, 0, 0.08)';
const TEXT_PRIMARY = '#f5e6c8';
const TEXT_MUTED = '#d4b896';

export function ListRow({
    icon,
    title,
    subtitle,
    right,
    onPress,
    selected = false,
    disabled = false,
    minHeight = 56,
    style,
    accessibilityLabel,
    accessibilityHint,
}: ListRowProps) {
    const Container: any = onPress ? TouchableOpacity : View;
    const containerProps = onPress
        ? {
              activeOpacity: 0.7,
              onPress: disabled ? undefined : onPress,
              accessibilityRole: 'button' as const,
              accessibilityLabel:
                  accessibilityLabel ||
                  (subtitle ? `${title}, ${subtitle}` : title),
              accessibilityHint,
              accessibilityState: { selected, disabled },
          }
        : {};

    return (
        <Container
            {...containerProps}
            style={[
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight,
                    paddingVertical: SPACING.md,
                    paddingHorizontal: SPACING.md,
                    borderRadius: RADII.md,
                    borderWidth: 1.5,
                    borderColor: selected ? SELECTED_BORDER : BORDER,
                    backgroundColor: selected ? SELECTED_BG : SURFACE,
                    gap: SPACING.md,
                    opacity: disabled ? 0.5 : 1,
                },
                style,
            ]}
        >
            {icon ? (
                <View
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: RADII.sm,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.25)',
                    }}
                >
                    {icon}
                </View>
            ) : null}

            <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                    style={[TEXT_STYLES.bodyBold, { color: TEXT_PRIMARY }]}
                    numberOfLines={1}
                >
                    {title}
                </Text>
                {subtitle ? (
                    <Text
                        style={[
                            TEXT_STYLES.caption,
                            { color: TEXT_MUTED, marginTop: 2 },
                        ]}
                        numberOfLines={2}
                    >
                        {subtitle}
                    </Text>
                ) : null}
            </View>

            {right ? <View style={{ flexShrink: 0 }}>{right}</View> : null}
        </Container>
    );
}

export default ListRow;
