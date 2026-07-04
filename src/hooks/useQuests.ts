/**
 * useQuests — daily missions hook (local, offline-first).
 *
 * Replaces the legacy server-backed implementation (dead REST endpoints on
 * the old Socket.io server). Data now lives in the quests store slice and
 * works fully offline; rewards flow through the economy slice.
 *
 * Public API kept compatible with QuestsModal and game call sites:
 *   quests, loading, fetchQuests, claimReward, trackProgress
 */

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/lib/store';
import { translations, type TranslationKeys } from '@/lib/i18n';
import type { QuestType } from '@/lib/config/quests.config';

/** Shape QuestsModal renders. */
export interface UserQuest {
    id: string;
    progress: number;
    isClaimed: boolean;
    quest: {
        title: string;
        description: string;
        target: number;
        reward: number;
    };
}

/** Localized title/description per quest type ({n} = target). */
function questCopy(type: QuestType, t: TranslationKeys): { title: string; description: string } {
    switch (type) {
        case 'GAMES_PLAYED':
            return { title: t.questPlayGames, description: t.questPlayGamesDesc };
        case 'NUMBERS_MARKED':
            return { title: t.questMarkNumbers, description: t.questMarkNumbersDesc };
        case 'GAMES_WON':
            return { title: t.questWinGame, description: t.questWinGameDesc };
        case 'POWERUP_USED':
            return { title: t.questUsePowerUp, description: t.questUsePowerUpDesc };
    }
}

export function useQuests() {
    const { dailyQuests, language, ensureDailyQuests, claimQuestReward, trackQuestProgress } =
        useGameStore(
            useShallow((s) => ({
                dailyQuests: s.dailyQuests,
                language: s.language,
                ensureDailyQuests: s.ensureDailyQuests,
                claimQuestReward: s.claimQuestReward,
                trackQuestProgress: s.trackQuestProgress,
            }))
        );

    const t = translations[language];

    const quests: UserQuest[] = dailyQuests.map((q) => {
        const copy = questCopy(q.type, t);
        return {
            id: q.id,
            progress: q.progress,
            isClaimed: q.claimed,
            quest: {
                title: copy.title.replace('{n}', String(q.target)),
                description: copy.description,
                target: q.target,
                reward: q.reward,
            },
        };
    });

    /** Generate/refresh today's quest set. Synchronous — kept async-shaped
     *  API (`loading`) for QuestsModal compatibility. */
    const fetchQuests = useCallback(() => {
        ensureDailyQuests();
    }, [ensureDailyQuests]);

    const claimReward = useCallback(
        async (userQuestId: string) => {
            const reward = claimQuestReward(userQuestId);
            if (reward !== null) {
                return { success: true as const, reward };
            }
            return { success: false as const, error: 'Not completed' };
        },
        [claimQuestReward]
    );

    const trackProgress = useCallback(
        (type: string, amount: number = 1) => {
            trackQuestProgress(type as QuestType, amount);
        },
        [trackQuestProgress]
    );

    return {
        quests,
        loading: false,
        fetchQuests,
        claimReward,
        trackProgress,
    };
}
