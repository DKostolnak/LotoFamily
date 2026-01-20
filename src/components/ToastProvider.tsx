/**
 * ToastProvider - Global toast notification system for React Native
 *
 * Features:
 * - Slide-in animation using react-native-reanimated
 * - Multiple toast types (success, error, warning, info, celebration)
 * - Auto-dismiss after 4 seconds
 * - Manual dismiss via tap
 * - Stacked display with gap between toasts
 */

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useEffect,
    ReactNode,
} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import Animated, {
    SlideInRight,
    SlideOutRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AchievementToast from './AchievementToast';

// ============================================================================
// TYPES
// ============================================================================

type ToastType = 'success' | 'info' | 'warning' | 'error' | 'celebration' | 'achievement';

interface Toast {
    /** Unique toast identifier */
    id: number;
    /** Toast message content */
    message: string;
    /** Toast type determines styling */
    type: ToastType;
    /** Optional custom icon */
    icon?: string;
    /** Optional title (used for achievements) */
    title?: string;
}

interface ToastContextType {
    /** Display a toast notification */
    showToast: (message: string, type?: ToastType, icon?: string, title?: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextType | null>(null);

/**
 * Hook to access toast functionality
 * @throws Error if used outside ToastProvider
 */
export function useToast(): ToastContextType {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOAST_DURATION_MS = 4000;
const SCREEN_WIDTH = Dimensions.get('window').width;

const DEFAULT_ICONS: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    celebration: '🎉',
    achievement: '🏆',
};

const TOAST_COLORS: Record<ToastType, { background: string; text: string }> = {
    success: { background: '#43a047', text: '#ffffff' },
    error: { background: '#e53935', text: '#ffffff' },
    warning: { background: '#ff9800', text: '#ffffff' },
    info: { background: '#795548', text: '#ffffff' },
    celebration: { background: '#ffc107', text: '#5d4037' },
    achievement: { background: '#6b2d9e', text: '#ffd700' },
};

// ============================================================================
// TOAST ITEM COMPONENT
// ============================================================================

interface ToastItemProps {
    toast: Toast;
    onDismiss: (id: number) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
    const colors = TOAST_COLORS[toast.type];
    const icon = toast.icon || DEFAULT_ICONS[toast.type];

    return (
        <Animated.View
            entering={SlideInRight.springify().damping(15)}
            exiting={SlideOutRight.duration(200)}
            style={[
                styles.toast,
                {
                    backgroundColor: colors.background,
                },
            ]}
        >
            <Text style={styles.toastIcon}>{icon}</Text>
            <Text
                style={[
                    styles.toastMessage,
                    { color: colors.text },
                ]}
                numberOfLines={3}
            >
                {toast.message}
            </Text>
            <TouchableOpacity
                onPress={() => onDismiss(toast.id)}
                style={styles.dismissButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Text style={[styles.dismissText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const insets = useSafeAreaInsets();
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timeoutsRef = useRef<Map<number, any>>(new Map());
    const nextIdRef = useRef(0);

    const dismissToast = useCallback((id: number) => {
        const timeout = timeoutsRef.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            timeoutsRef.current.delete(id);
        }
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback(
        (message: string, type: ToastType = 'info', icon?: string, title?: string) => {
            const id = nextIdRef.current++;
            setToasts(prev => [...prev, { id, message, type, icon, title }]);

            // Achievement toasts handle their own dismissal timing
            if (type !== 'achievement') {
                const timeout = setTimeout(() => {
                    dismissToast(id);
                }, TOAST_DURATION_MS);

                timeoutsRef.current.set(id, timeout);
            }
        },
        [dismissToast]
    );

    // Cleanup timeouts on unmount
    useEffect(() => {
        const timeoutMap = timeoutsRef.current;
        return () => {
            timeoutMap.forEach(timeout => clearTimeout(timeout));
            timeoutMap.clear();
        };
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Achievement Toasts (Centered Overlay) */}
            {toasts
                .filter(t => t.type === 'achievement')
                .map(toast => (
                    <AchievementToast
                        key={toast.id}
                        id={String(toast.id)}
                        name={toast.title || 'Achievement Unlocked!'}
                        description={toast.message}
                        icon={toast.icon || '🏆'}
                        onDismiss={() => dismissToast(toast.id)}
                    />
                ))}

            {/* Standard Toast Stack Container */}
            <View
                style={[
                    styles.container,
                    { top: insets.top + 16 },
                ]}
                pointerEvents="box-none"
            >
                {toasts
                    .filter(t => t.type !== 'achievement')
                    .map(toast => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onDismiss={dismissToast}
                        />
                    ))}
            </View>
        </ToastContext.Provider>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 16,
        zIndex: 1200,
        width: Math.min(320, SCREEN_WIDTH * 0.9),
        gap: 12,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        gap: 8,
    },
    toastIcon: {
        fontSize: 18,
    },
    toastMessage: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    dismissButton: {
        padding: 4,
    },
    dismissText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ToastProvider;
