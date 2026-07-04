/**
 * Daily Quests Slice
 *
 * Local, offline-first daily missions — replaces the legacy server-backed
 * quest system (dead REST endpoints on the old Socket.io server).
 *
 * How it works:
 *  - Quests are generated deterministically from the local date
 *    (see quests.config.ts) — same day, same quests, no server needed.
 *  - Progress is tracked via `trackQuestProgress(type)` calls from gameplay
 *    (game start, cell marks, wins, power-up use).
 *  - Claiming grants coins through the economy slice and best-effort syncs
 *    to Supabase so the balance survives device switches.
 *
 * Single Responsibility: quest bookkeeping only. Rewards flow through
 * existing economy actions — never duplicate coin logic here.
 */

import type { StateCreator } from 'zustand';
import type { GameStore, QuestsSlice, DailyQuest } from '../types';
import type { QuestType } from '../../config/quests.config';
import { getQuestsForDay, todayKey } from '../../config/quests.config';

function buildQuestsFor(dateKey: string): DailyQuest[] {
    return getQuestsForDay(dateKey).map((def) => ({
        id: def.id,
        type: def.type,
        target: def.target,
        reward: def.reward,
        progress: 0,
        claimed: false,
    }));
}

export const createQuestsSlice: StateCreator<GameStore, [], [], QuestsSlice> = (set, get) => ({
    questsDate: '',
    dailyQuests: [],

    ensureDailyQuests: () => {
        const today = todayKey();
        if (get().questsDate === today && get().dailyQuests.length > 0) return;
        set({ questsDate: today, dailyQuests: buildQuestsFor(today) });
    },

    trackQuestProgress: (type: QuestType, amount: number = 1) => {
        if (!Number.isFinite(amount) || amount <= 0) return;

        // Roll over to today's set first so late-night sessions don't
        // credit progress to yesterday's quests.
        get().ensureDailyQuests();

        const quests = get().dailyQuests;
        let changed = false;
        const next = quests.map((q) => {
            if (q.type !== type || q.claimed || q.progress >= q.target) return q;
            changed = true;
            return { ...q, progress: Math.min(q.target, q.progress + amount) };
        });

        if (changed) set({ dailyQuests: next });
    },

    claimQuestReward: (questId: string): number | null => {
        const quests = get().dailyQuests;
        const quest = quests.find((q) => q.id === questId);
        if (!quest || quest.claimed || quest.progress < quest.target) return null;

        set({
            dailyQuests: quests.map((q) =>
                q.id === questId ? { ...q, claimed: true } : q
            ),
        });
        get().addCoins(quest.reward);

        // Best-effort cross-device sync of the new coin balance.
        get().syncToSupabase().catch(() => {});

        return quest.reward;
    },
});
