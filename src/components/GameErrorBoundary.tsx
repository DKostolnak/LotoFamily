import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TriangleAlert, Home } from 'lucide-react-native';
import { crashReporting } from '@/lib/services/crashReporting';

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
                        <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                            <Home size={20} color="#3d2814" />
                            <Text style={styles.buttonText}>Return to Menu</Text>
                        </TouchableOpacity>
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
        padding: 24,
    },
    card: {
        backgroundColor: '#2d1f10',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#5a4025',
        maxWidth: 320,
        width: '100%',
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
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#f5e6c8',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#8b6b4a',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    errorBox: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        width: '100%',
    },
    errorText: {
        fontSize: 11,
        fontFamily: 'monospace',
        color: '#ef4444',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#ffd700',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderBottomWidth: 4,
        borderColor: '#b8860b',
        width: '100%',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#3d2814',
        textTransform: 'uppercase',
    },
});
