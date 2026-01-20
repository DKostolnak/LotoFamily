import '../../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ToastProvider';
import { P2PProvider } from '@/lib/p2p/P2PContext';
import { crashReporting, analytics, audioService } from '@/lib/services';

export default function Layout() {
    // Initialize services on app start
    useEffect(() => {
        crashReporting.init();
        analytics.init();
        audioService.initialize();
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <StatusBar style="light" />
                <ErrorBoundary>
                    <P2PProvider>
                        <ToastProvider>
                            <Stack
                                screenOptions={{
                                    headerShown: false,
                                    contentStyle: { backgroundColor: '#1a1109' },
                                    animation: 'fade',
                                }}
                            />
                        </ToastProvider>
                    </P2PProvider>
                </ErrorBoundary>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
