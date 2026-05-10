import '../../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ToastProvider';
import { RateAppModal } from '@/components/RateAppModal';
import { crashReporting, analytics, audioService, notificationsService } from '@/lib/services';
import { useGameStore } from '@/lib/store';

export default function Layout() {
    // Initialize services on app start
    useEffect(() => {
        crashReporting.init();
        analytics.init();
        audioService.initialize();
        // Sync persisted announcer mode onto the (singleton) audio service
        // so the very first announcement after launch uses the right mode.
        audioService.setAnnouncerMode(useGameStore.getState().announcerMode);
        notificationsService.init().catch(() => {});
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
