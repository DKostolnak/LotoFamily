import React from 'react';
import { View, Text } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { WoodenButton } from './WoodenButton';

interface ErrorViewProps {
    message: string;
    onRetry?: () => void;
    retryLabel?: string;
    /** Optional secondary action label (e.g. Cancel / Back) */
    onSecondary?: () => void;
    secondaryLabel?: string;
}

/**
 * ErrorView - Full-screen error placeholder with retry CTA.
 * Use for fatal flow errors (connection lost, fetch failed, etc.).
 */
export const ErrorView = ({ message, onRetry, retryLabel = 'Retry', onSecondary, secondaryLabel }: ErrorViewProps) => {
    return (
        <View
            className="flex-1 items-center justify-center px-6 bg-wood-darkest"
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
        >
            <View className="bg-red-500/10 p-5 rounded-full border border-red-500/40 mb-4">
                <TriangleAlert size={56} color="#ef4444" strokeWidth={1.8} />
            </View>
            <Text
                className="text-cream text-center text-lg font-bold mt-2 mb-6 max-w-[300px]"
                accessibilityLabel={message}
            >
                {message}
            </Text>
            {onRetry && (
                <WoodenButton onPress={onRetry} variant="primary" size="lg">
                    {retryLabel}
                </WoodenButton>
            )}
            {onSecondary && secondaryLabel && (
                <View className="mt-3">
                    <WoodenButton onPress={onSecondary} variant="secondary" size="md">
                        {secondaryLabel}
                    </WoodenButton>
                </View>
            )}
        </View>
    );
};
