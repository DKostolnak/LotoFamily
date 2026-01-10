'use client';

/**
 * AchievementToastContainer
 * 
 * Wrapper component that listens to the GameContext for pending achievements
 * and renders the AchievementToast when one is unlocked.
 */

import { useGame } from '@/lib/GameContext';
import AchievementToast from './AchievementToast';

export default function AchievementToastContainer() {
    const { pendingAchievement, dismissAchievement } = useGame();

    if (!pendingAchievement) return null;

    return (
        <AchievementToast
            id={pendingAchievement.id}
            name={pendingAchievement.name}
            icon={pendingAchievement.icon}
            description={pendingAchievement.description}
            onDismiss={dismissAchievement}
        />
    );
}
