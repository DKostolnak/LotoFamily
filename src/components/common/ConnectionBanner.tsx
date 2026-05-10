/**
 * ConnectionBanner
 *
 * Top-of-screen overlay strip that surfaces socket / network connectivity
 * issues to the user during online play. Renders nothing while connected
 * unless an auto-hide "connected" celebration is animating out.
 *
 * Status palette:
 *  - reconnecting           amber    "Reconnecting..."         spinner
 *  - disconnected / error   danger   "Connection lost"         retry button
 *  - offline                muted    "No connection"           (no retry — wait for network)
 *  - connected              success  "Connected"               auto-hide 2s
 *
 * The banner is absolutely positioned and only ~44pt tall + safe-area top
 * inset, so it does not block the underlying game UI.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wifi, WifiOff, X } from 'lucide-react-native';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

export type BannerStatus = 'reconnecting' | 'disconnected' | 'connected' | 'error' | 'offline';

export interface ConnectionBannerProps {
    status: BannerStatus | 'connecting';
    message?: string;
    /** Override label for the right-side action button (defaults to localized "Retry") */
    retryLabel?: string;
    onRetry?: () => void;
    onDismiss?: () => void;
    /** Auto-hide the banner after 2s when status is 'connected'. Default true. */
    autoHide?: boolean;
}

interface PaletteEntry {
    bg: string;
    fg: string;
    icon: 'wifi' | 'wifi-off' | 'spinner';
}

// Semantic palette; values mirror existing in-app tokens
// (k_colorSuccess / k_colorError, with amber and muted from the existing TW config).
const k_palette: Record<BannerStatus, PaletteEntry> = {
    reconnecting: { bg: '#f59e0b', fg: '#1a1109', icon: 'spinner' },
    disconnected: { bg: '#ef4444', fg: '#ffffff', icon: 'wifi-off' },
    error: { bg: '#ef4444', fg: '#ffffff', icon: 'wifi-off' },
    offline: { bg: '#6b7280', fg: '#ffffff', icon: 'wifi-off' },
    connected: { bg: '#4ade80', fg: '#1a1109', icon: 'wifi' },
};

const k_bannerHeight = 44;
const k_slideMs = 220;
const k_autoHideMs = 2000;

export function ConnectionBanner({
    status,
    message,
    retryLabel,
    onRetry,
    onDismiss,
    autoHide = true,
}: ConnectionBannerProps) {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-200)).current;
    const [renderStatus, setRenderStatus] = useState<BannerStatus | null>(null);

    // Treat 'connecting' as 'reconnecting' for visual purposes — both convey
    // "we are working on getting you connected".
    const visualStatus: BannerStatus | null =
        status === 'connecting' ? 'reconnecting' : (status as BannerStatus);

    // Decide whether the banner should be visible at all. We hide on 'connected'
    // unless a previous non-connected state was rendered (so we can flash the
    // green "Connected" toast briefly).
    const shouldShow = visualStatus !== null && visualStatus !== undefined;

    // Manage render lifecycle including the auto-hide for 'connected'.
    useEffect(() => {
        if (!shouldShow) return;

        if (visualStatus === 'connected') {
            // Only show "connected" toast if we were previously showing something.
            if (renderStatus === null) return;
            setRenderStatus('connected');
            slideIn();
            if (autoHide) {
                const timer = setTimeout(() => slideOut(), k_autoHideMs);
                return () => clearTimeout(timer);
            }
            return;
        }

        setRenderStatus(visualStatus);
        slideIn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visualStatus]);

    const slideIn = () => {
        Animated.timing(translateY, {
            toValue: 0,
            duration: k_slideMs,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    };

    const slideOut = () => {
        Animated.timing(translateY, {
            toValue: -200,
            duration: k_slideMs,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) setRenderStatus(null);
        });
    };

    if (renderStatus === null) return null;

    const palette = k_palette[renderStatus];
    const totalHeight = k_bannerHeight + insets.top;

    const defaultMessage = ((): string => {
        switch (renderStatus) {
            case 'reconnecting': return 'Reconnecting...';
            case 'disconnected': return 'Connection lost';
            case 'error': return 'Connection error';
            case 'offline': return 'No connection';
            case 'connected': return 'Connected';
        }
    })();

    const showRetry =
        (renderStatus === 'disconnected' || renderStatus === 'error') && !!onRetry;

    return (
        <Animated.View
            pointerEvents="box-none"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: totalHeight,
                paddingTop: insets.top,
                backgroundColor: palette.bg,
                transform: [{ translateY }],
                zIndex: 1000,
                elevation: Platform.OS === 'android' ? 12 : 0,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: SPACING.md,
                gap: SPACING.sm,
                borderBottomLeftRadius: RADII.md,
                borderBottomRightRadius: RADII.md,
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
            }}
        >
            <View style={{ width: 22, alignItems: 'center', justifyContent: 'center' }}>
                {palette.icon === 'spinner' ? (
                    <ActivityIndicator size="small" color={palette.fg} />
                ) : palette.icon === 'wifi' ? (
                    <Wifi size={18} color={palette.fg} />
                ) : (
                    <WifiOff size={18} color={palette.fg} />
                )}
            </View>

            <Text
                numberOfLines={1}
                style={[
                    TEXT_STYLES.bodyBold,
                    { color: palette.fg, flex: 1 },
                ]}
            >
                {message ?? defaultMessage}
            </Text>

            {showRetry && (
                <TouchableOpacity
                    onPress={onRetry}
                    accessibilityRole="button"
                    accessibilityLabel={retryLabel ?? 'Retry'}
                    style={{
                        paddingHorizontal: SPACING.md,
                        paddingVertical: 6,
                        borderRadius: RADII.pill,
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        minHeight: 32,
                        justifyContent: 'center',
                    }}
                >
                    <Text style={[TEXT_STYLES.captionUpper, { color: palette.fg }]}>
                        {retryLabel ?? 'Retry'}
                    </Text>
                </TouchableOpacity>
            )}

            {onDismiss && (
                <TouchableOpacity
                    onPress={() => {
                        onDismiss();
                        slideOut();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ padding: 4 }}
                >
                    <X size={18} color={palette.fg} />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}
