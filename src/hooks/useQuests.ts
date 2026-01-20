import { useState, useCallback } from 'react';
import { ENV } from '@/lib/config/env.config';
import { useGameStore } from '@/lib/store';
import { storageService, STORAGE_KEYS } from '@/lib/services/storage';

export function useQuests() {
    const [quests, setQuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { addCoins } = useGameStore();

    const fetchQuests = useCallback(async () => {
        setLoading(true);
        try {
            const token = await storageService.getString(STORAGE_KEYS.PLAYER_TOKEN);
            if (!token) return;

            const response = await fetch(`${ENV.server.url}/quests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setQuests(data);
            }
        } catch (error) {
            console.error('[useQuests] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const claimReward = useCallback(async (userQuestId: string) => {
        try {
            const token = await storageService.getString(STORAGE_KEYS.PLAYER_TOKEN);
            const response = await fetch(`${ENV.server.url}/quests/claim/${userQuestId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                setQuests(prev => prev.map(q =>
                    q.id === userQuestId ? { ...q, isClaimed: true } : q
                ));
                addCoins(result.reward);
                return { success: true, reward: result.reward };
            }
            return { success: false, error: result.message };
        } catch (error) {
            console.error('[useQuests] Claim error:', error);
            return { success: false, error: 'Network error' };
        }
    }, [addCoins]);

    const trackProgress = useCallback(async (type: string, amount: number = 1) => {
        try {
            const token = await storageService.getString(STORAGE_KEYS.PLAYER_TOKEN);
            if (!token) return;

            await fetch(`${ENV.server.url}/quests/track`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, amount })
            });
        } catch (error) {
            console.error('[useQuests] Track error:', error);
        }
    }, []);

    return {
        quests,
        loading,
        fetchQuests,
        claimReward,
        trackProgress,
    };
}
