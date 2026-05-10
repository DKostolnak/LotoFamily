/**
 * ModalShell — UNIFIED modal container.
 *
 * Every modal in the app MUST use this shell. It enforces a single
 * consistent layout: title + subtitle + close button + scrollable
 * content + optional sticky footer.
 *
 * Design rules embedded:
 *   - Container: AnimatedModal with fade animation (default).
 *   - Surface: wood-darker (#2d1f10) with 1px wood-medium/40 border, RADII.lg.
 *   - Header: 1px bottom divider; title TEXT_STYLES.h1 gold;
 *     subtitle TEXT_STYLES.caption muted; close button 44pt right-aligned.
 *   - Content: padding SPACING.lg, ScrollView so any modal can grow.
 *   - Footer: optional sticky bottom area with primary action(s).
 *
 * Replaces: ad-hoc WoodenCard usage in modals, custom header rows,
 * inconsistent close button placements.
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ViewStyle,
    StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import { AnimatedModal } from './AnimatedModal';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

export interface ModalShellProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    /** Optional sticky footer area (e.g. primary CTA). */
    footer?: React.ReactNode;
    /** Custom right-side header element (e.g. coin balance). Replaces close button if both desired, render in `headerRight` and keep close. */
    headerRight?: React.ReactNode;
    /** Animation style for entry. Default 'fade'. */
    animation?: 'fade' | 'scale' | 'slide';
    /** Maximum modal width. Default 480. */
    maxWidth?: number;
    /** Maximum modal height (relative to screen). Default '85%'. */
    maxHeight?: string | number;
    /** Disable scrolling for short, fixed-height modals. */
    noScroll?: boolean;
    /** Custom content padding override (rare). Default SPACING.lg. */
    contentStyle?: ViewStyle;
    /** Hide the close button. Default false. */
    hideClose?: boolean;
    /** Accessibility label for the close button. Default "Close". */
    closeAccessibilityLabel?: string;
}

const SURFACE = '#2d1f10';
const BORDER = 'rgba(90, 64, 37, 0.5)';
const DIVIDER = 'rgba(90, 64, 37, 0.4)';
const TEXT_GOLD = '#ffd700';
const TEXT_MUTED = '#d4b896';
const TEXT_LIGHT = '#f5e6c8';

export function ModalShell({
    visible,
    onClose,
    title,
    subtitle,
    children,
    footer,
    headerRight,
    animation = 'fade',
    maxWidth = 480,
    maxHeight = '85%',
    noScroll = false,
    contentStyle,
    hideClose = false,
    closeAccessibilityLabel = 'Close',
}: ModalShellProps) {
    const hasHeader = !!(title || subtitle || !hideClose || headerRight);

    return (
        <AnimatedModal visible={visible} onClose={onClose} animation={animation}>
            <View
                style={[
                    styles.shell,
                    {
                        maxWidth,
                        maxHeight: maxHeight as any,
                    },
                ]}
            >
                {hasHeader && (
                    <View style={styles.header}>
                        <View style={styles.headerText}>
                            {title ? (
                                <Text
                                    style={[TEXT_STYLES.h1, { color: TEXT_GOLD }]}
                                    numberOfLines={2}
                                >
                                    {title}
                                </Text>
                            ) : null}
                            {subtitle ? (
                                <Text
                                    style={[
                                        TEXT_STYLES.caption,
                                        { color: TEXT_MUTED, marginTop: SPACING.xs },
                                    ]}
                                    numberOfLines={2}
                                >
                                    {subtitle}
                                </Text>
                            ) : null}
                        </View>

                        {headerRight ? (
                            <View style={styles.headerRight}>{headerRight}</View>
                        ) : null}

                        {!hideClose ? (
                            <TouchableOpacity
                                onPress={onClose}
                                accessibilityRole="button"
                                accessibilityLabel={closeAccessibilityLabel}
                                hitSlop={8}
                                style={styles.closeButton}
                            >
                                <X size={22} color={TEXT_LIGHT} strokeWidth={2.5} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}

                {noScroll ? (
                    <View style={[styles.content, contentStyle]}>{children}</View>
                ) : (
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={[styles.content, contentStyle]}
                        showsVerticalScrollIndicator={false}
                    >
                        {children}
                    </ScrollView>
                )}

                {footer ? <View style={styles.footer}>{footer}</View> : null}
            </View>
        </AnimatedModal>
    );
}

const styles = StyleSheet.create({
    shell: {
        width: '100%',
        backgroundColor: SURFACE,
        borderRadius: RADII.lg,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: 'hidden',
        // Modal elevation — depth 12 (highest, modal is on top of everything)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: DIVIDER,
        gap: SPACING.md,
    },
    headerText: {
        flex: 1,
        minWidth: 0,
    },
    headerRight: {
        alignSelf: 'center',
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: RADII.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    scroll: {
        flexGrow: 0,
    },
    content: {
        padding: SPACING.lg,
        gap: SPACING.lg,
    },
    footer: {
        padding: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: DIVIDER,
        gap: SPACING.md,
    },
});

export default ModalShell;
