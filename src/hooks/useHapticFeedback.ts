/**
 * useHapticFeedback - Abstracted haptic feedback service
 * 
 * Following DIP principle: Components depend on this interface,
 * not directly on expo-haptics implementation.
 */

import * as Haptics from 'expo-haptics';
import { useGameStore } from '@/lib/store';

export interface IFeedbackService {
    impactLight(): void;
    impactMedium(): void;
    impactHeavy(): void;
    notifyError(): void;
    notifySuccess(): void;
    notifyWarning(): void;
    selection(): void;
    triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error'): void;
}

/**
 * Custom hook for haptic feedback
 * Respects battery saver mode by disabling haptics when enabled
 */
export function useHapticFeedback(): IFeedbackService {
    const batterySaver = useGameStore((state) => state.batterySaver);

    const impactLight = () => {
        if (batterySaver) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const impactMedium = () => {
        if (batterySaver) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const impactHeavy = () => {
        if (batterySaver) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    };

    const notifyError = () => {
        if (batterySaver) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    const notifySuccess = () => {
        if (batterySaver) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const notifyWarning = () => {
        if (batterySaver) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };

    const selection = () => {
        if (batterySaver) return;
        Haptics.selectionAsync();
    };

    const triggerHaptic: IFeedbackService['triggerHaptic'] = (type) => {
        switch (type) {
            case 'light':
                impactLight();
                return;
            case 'medium':
                impactMedium();
                return;
            case 'heavy':
                impactHeavy();
                return;
            case 'selection':
                selection();
                return;
            case 'success':
                notifySuccess();
                return;
            case 'warning':
                notifyWarning();
                return;
            case 'error':
                notifyError();
                return;
        }
    };

    return {
        impactLight,
        impactMedium,
        impactHeavy,
        notifyError,
        notifySuccess,
        notifyWarning,
        selection,
        triggerHaptic,
    };
}
