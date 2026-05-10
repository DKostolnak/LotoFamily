import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TriangleAlert, Home } from 'lucide-react-native';
import { crashReporting } from '@/lib/services/crashReporting';
import { WoodenButton } from '@/components/common';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface Props {
    children: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * GameErrorBoundary - Catches errors in game components and provides recovery
 * 
 * Wraps game screens to prevent crashes from breaking the entire app.
 * Offers a "Return to Menu" option for graceful recovery.
 */
export class GameErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to crash reporting service
        crashReporting.captureException(error, {
            componentStack: errorInfo.componentStack ?? 'unknown',
            isFatal: false,
        });

        console.error('[GameErrorBoundary] Caught error:', error);
        console.error('[GameErrorBoundary] Component stack:', errorInfo.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        {/* Error Icon */}
                        <View style={styles.iconWrapper}>
                            <TriangleAlert size={48} color="#ef4444" />
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Oops! Something went wrong</Text>

                        {/* Description */}
                        <Text style={styles.description}>
                            We encountered an unexpected error. Don't worry, your progress is safe.
                        </Text>

                        {/* Error Details (Dev only) */}
                        {__DEV__ && this.state.error && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText} numberOfLines={3}>
                                    {this.state.error.message}
                                </Text>
                            </View>
                        )}

                        {/* Action Button */}
                        <WoodenButton
                            variant="gold"
                            size="md"
                            fullWidth
                            onPress={this.handleReset}
                            icon={<Home size={20} color="#3d2814" />}
                            accessibilityLabel="Return to menu"
                        >
                            Return to Menu
                        </WoodenButton>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1109',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    card: {
        backgroundColor: '#2d1f10',
        borderRadius: RADII.lg,
        padding: SPACING.xl,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#5a4025',
        maxWidth: 360,
        width: '100%',
        gap: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    title: {
        ...TEXT_STYLES.h2,
        color: '#f5e6c8',
        textAlign: 'center',
    },
    description: {
        ...TEXT_STYLES.body,
        color: '#d4b896',
        textAlign: 'center',
    },
    errorBox: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: RADII.sm,
        padding: SPACING.md,
        width: '100%',
    },
    errorText: {
        ...TEXT_STYLES.caption,
        fontFamily: 'monospace',
        color: '#ef4444',
    },
});
