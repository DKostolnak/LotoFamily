import '../../global.css';
import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ToastProvider';
import { RateAppModal } from '@/components/RateAppModal';
import { crashReporting, analytics, audioService, notificationsService, adsService } from '@/lib/services';
import { useGameStore } from '@/lib/store';
import type { NotificationCategory } from '@/lib/services/notifications';

// Lazy-load Notifications to avoid native module crash in bare Expo Go
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notifications: typeof import('expo-notifications') | null = null;
try { Notifications = require('expo-notifications'); } catch { /* no-op */ }

export default function Layout() {
    const notifListenerRef = useRef<{ remove: () => void } | null>(null);
    const responseListenerRef = useRef<{ remove: () => void } | null>(null);

    // Initialize services on app start
    useEffect(() => {
        crashReporting.init();
        analytics.init();
        audioService.initialize();
        // Sync persisted announcer mode onto the (singleton) audio service
        // so the very first announcement after launch uses the right mode.
        audioService.setAnnouncerMode(useGameStore.getState().announcerMode);
        notificationsService.init().catch(() => {});
        // Ads: gathers GDPR consent + iOS tracking permission, then preloads.
        adsService.init().catch(() => {});

        if (!Notifications) return;

        // Foreground listener — notification received while app is open
        notifListenerRef.current = Notifications.addNotificationReceivedListener(
            (_notification) => {
                // Currently just let the OS banner show (handled by setNotificationHandler).
                // Add in-app toast here if you want custom foreground UX.
            }
        );

        // Response listener — user tapped a notification (background/killed state)
        responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data as
                    { category?: NotificationCategory } | null | undefined;
                const category = data?.category;

                if (category === 'daily_bonus') {
                    // DailyBonusModal on the home screen auto-opens when
                    // checkDailyBonus() returns > 0, so just set a flag so
                    // the home screen knows to surface it immediately.
                    useGameStore.getState().setPendingDeepLink('daily_bonus');
                } else if (category === 'season_ending') {
                    useGameStore.getState().setPendingDeepLink('season_ending');
                }
            }
        );

        return () => {
            notifListenerRef.current?.remove();
            responseListenerRef.current?.remove();
        };
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <StatusBar style="light" />
                <ErrorBoundary>
                    <ToastProvider>
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                contentStyle: { backgroundColor: '#1a1109' },
                                animation: 'fade',
                            }}
                        />
                        <RateAppModal />
                    </ToastProvider>
                </ErrorBoundary>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
