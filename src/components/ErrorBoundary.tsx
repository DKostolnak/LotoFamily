import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView, NativeModules, ImageBackground, Linking, Alert, Platform } from 'react-native';
import { WoodenButton, WoodenCard } from './common';
import * as Clipboard from 'expo-clipboard';
import { Copy, RefreshCw, Mail } from 'lucide-react-native';
import { crashReporting } from '@/lib/services';
import { SUPPORT_EMAIL, APP_VERSION, APP_BUILD_NUMBER } from '@/lib/config';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';

const WOOD_TEXTURE = require('../../assets/wood-seamless.png');

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        
        // Report to crash reporting service
        crashReporting.captureException(error, {
            componentStack: errorInfo.componentStack ?? undefined,
            appVersion: APP_VERSION,
            buildNumber: APP_BUILD_NUMBER,
        });
        
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleRestart = () => {
        crashReporting.addBreadcrumb({
            category: 'user.action',
            message: 'User restarted app after error',
        });
        
        // Try to reload bundle
        NativeModules.DevSettings?.reload();
        // Fallback for simple resetting state if reload fails or isn't available
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    private handleCopyError = async () => {
        if (this.state.error) {
            const language = useGameStore.getState().language;
            const t = translations[language] ?? translations.en;
            const errorDetails = this.getErrorDetails();
            await Clipboard.setStringAsync(errorDetails);
            Alert.alert(t.copied);
        }
    };
    
    private getErrorDetails = (): string => {
        const { error, errorInfo } = this.state;
        return [
            `LOTO Mobile Error Report`,
            `Version: ${APP_VERSION} (${APP_BUILD_NUMBER})`,
            `Platform: ${Platform.OS} ${Platform.Version}`,
            ``,
            `Error: ${error?.toString()}`,
            ``,
            `Stack: ${error?.stack ?? 'No stack trace'}`,
            ``,
            `Component Stack: ${errorInfo?.componentStack ?? 'No component stack'}`,
        ].join('\n');
    };

    private handleEmailSupport = () => {
        const subject = encodeURIComponent(`LOTO Mobile Error Report v${APP_VERSION}`);
        const body = encodeURIComponent(this.getErrorDetails());
        Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    };

    public render() {
        if (this.state.hasError) {
            const language = useGameStore.getState().language;
            const t = translations[language] ?? translations.en;

            return (
                <ImageBackground source={WOOD_TEXTURE} style={{ flex: 1 }} imageStyle={{ width: '100%', height: '100%' }} resizeMode="repeat">
                    <View className="flex-1 bg-black/60 justify-center items-center p-6">
                        <WoodenCard className="w-full max-w-sm">
                            <View className="items-center py-6">
                                <Text className="text-4xl mb-2">😵‍💫</Text>
                                <Text className="text-gold text-3xl font-black mb-2 uppercase tracking-wide text-center">
                                    {t.errorTitle}
                                </Text>
                                <Text className="text-muted text-center mb-6 font-medium">
                                    {t.errorDefault}
                                </Text>

                                <ScrollView className="max-h-40 bg-wood-darkest rounded-lg p-3 w-full mb-6 border border-wood-medium">
                                    <Text className="text-red-400 font-mono text-xs">
                                        {this.state.error?.toString()}
                                    </Text>
                                </ScrollView>

                                <View className="w-full gap-3">
                                    <WoodenButton onPress={this.handleRestart} variant="gold" fullWidth>
                                        <View className="flex-row items-center gap-2">
                                            <RefreshCw size={20} color="#3d2814" />
                                            <Text className="text-wood-dark font-bold uppercase">{t.reloadGame}</Text>
                                        </View>
                                    </WoodenButton>

                                    <View className="flex-row gap-3">
                                        <View className="flex-1">
                                            <WoodenButton onPress={this.handleCopyError} variant="secondary" fullWidth size="sm">
                                                <View className="flex-row items-center gap-2">
                                                    <Copy size={16} color="#e8d4b8" />
                                                    <Text className="text-cream-dark text-xs font-bold uppercase">{t.copy}</Text>
                                                </View>
                                            </WoodenButton>
                                        </View>
                                        <View className="flex-1">
                                            <WoodenButton onPress={this.handleEmailSupport} variant="secondary" fullWidth size="sm">
                                                <View className="flex-row items-center gap-2">
                                                    <Mail size={16} color="#e8d4b8" />
                                                    <Text className="text-cream-dark text-xs font-bold uppercase">{t.errorReport}</Text>
                                                </View>
                                            </WoodenButton>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </WoodenCard>
                    </View>
                </ImageBackground>
            );
        }

        return this.props.children;
    }
}
