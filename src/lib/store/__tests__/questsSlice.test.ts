/**
 * Daily Quests Slice Tests
 *
 * Covers: deterministic generation, day rollover, progress tracking,
 * claim rewards (coins granted exactly once).
 */

// Mock AsyncStorage with an in-memory map (same pattern as store.test.ts)
// so the Zustand persist middleware works in the Jest environment.
jest.mock('@react-native-async-storage/async-storage', () => {
    const memory: Record<string, string> = {};
    return {
        __esModule: true,
        default: {
            getItem: jest.fn((key: string) =>
                Promise.resolve(Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null)
            ),
            setItem: jest.fn((key: string, value: string) => {
                memory[key] = value;
                return Promise.resolve();
            }),
            removeItem: jest.fn((key: string) => {
                delete memory[key];
                return Promise.resolve();
            }),
        },
    };
});

import { useGameStore } from '../index';
import { getQuestsForDay, todayKey, DAILY_QUEST_COUNT } from '../../config/quests.config';

describe('quests.config', () => {
    it('generates a deterministic set for the same day', () => {
        const a = getQuestsForDay('2026-07-04');
        const b = getQuestsForDay('2026-07-04');
        expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
        expect(a).toHaveLength(DAILY_QUEST_COUNT);
    });

    it('covers play + mark + challenge slots', () => {
        const quests = getQuestsForDay('2026-07-04');
        const types = quests.map((q) => q.type);
        expect(types).toContain('GAMES_PLAYED');
        expect(types).toContain('NUMBERS_MARKED');
        // Third slot is one of the challenge types
        expect(
            types.includes('GAMES_WON') || types.includes('POWERUP_USED')
        ).toBe(true);
    });

    it('todayKey formats as YYYY-MM-DD', () => {
        expect(todayKey(new Date(2026, 6, 4))).toBe('2026-07-04');
    });
});

describe('questsSlice', () => {
    beforeEach(() => {
        useGameStore.setState({
            questsDate: '',
            dailyQuests: [],
            coins: 1000,
        });
    });

    it('ensureDailyQuests generates fresh quests for today', () => {
        useGameStore.getState().ensureDailyQuests();
        const { questsDate, dailyQuests } = useGameStore.getState();
        expect(questsDate).toBe(todayKey());
        expect(dailyQuests).toHaveLength(DAILY_QUEST_COUNT);
        expect(dailyQuests.every((q) => q.progress === 0 && !q.claimed)).toBe(true);
    });

    it('ensureDailyQuests is idempotent within the same day', () => {
        useGameStore.getState().ensureDailyQuests();
        useGameStore.getState().trackQuestProgress('GAMES_PLAYED');
        const before = useGameStore.getState().dailyQuests;
        useGameStore.getState().ensureDailyQuests();
        expect(useGameStore.getState().dailyQuests).toEqual(before);
    });

    it('rolls over stale quests from a previous day', () => {
        useGameStore.getState().ensureDailyQuests();
        useGameStore.getState().trackQuestProgress('GAMES_PLAYED');
        // Simulate yesterday's set
        useGameStore.setState({ questsDate: '2000-01-01' });
        useGameStore.getState().ensureDailyQuests();
        const { questsDate, dailyQuests } = useGameStore.getState();
        expect(questsDate).toBe(todayKey());
        expect(dailyQuests.every((q) => q.progress === 0)).toBe(true);
    });

    it('trackQuestProgress increments only matching type and caps at target', () => {
        useGameStore.getState().ensureDailyQuests();
        const playQuest = useGameStore
            .getState()
            .dailyQuests.find((q) => q.type === 'GAMES_PLAYED')!;

        useGameStore.getState().trackQuestProgress('GAMES_PLAYED', 999);
        const after = useGameStore
            .getState()
            .dailyQuests.find((q) => q.id === playQuest.id)!;
        expect(after.progress).toBe(after.target); // capped

        // Other types untouched
        const mark = useGameStore
            .getState()
            .dailyQuests.find((q) => q.type === 'NUMBERS_MARKED')!;
        expect(mark.progress).toBe(0);
    });

    it('ignores non-positive amounts', () => {
        useGameStore.getState().ensureDailyQuests();
        useGameStore.getState().trackQuestProgress('GAMES_PLAYED', 0);
        useGameStore.getState().trackQuestProgress('GAMES_PLAYED', -5);
        const play = useGameStore
            .getState()
            .dailyQuests.find((q) => q.type === 'GAMES_PLAYED')!;
        expect(play.progress).toBe(0);
    });

    it('claimQuestReward grants coins exactly once', () => {
        useGameStore.getState().ensureDailyQuests();
        const play = useGameStore
            .getState()
            .dailyQuests.find((q) => q.type === 'GAMES_PLAYED')!;

        // Not completed yet → null, no coins
        expect(useGameStore.getState().claimQuestReward(play.id)).toBeNull();
        expect(useGameStore.getState().coins).toBe(1000);

        // Complete it
        useGameStore.getState().trackQuestProgress('GAMES_PLAYED', play.target);
        const reward = useGameStore.getState().claimQuestReward(play.id);
        expect(reward).toBe(play.reward);
        expect(useGameStore.getState().coins).toBe(1000 + play.reward);

        // Double-claim → null, coins unchanged
        expect(useGameStore.getState().claimQuestReward(play.id)).toBeNull();
        expect(useGameStore.getState().coins).toBe(1000 + play.reward);
    });

    it('claimed quests stop accumulating progress', () => {
        useGameStore.getState().ensureDailyQuests();
        const play = useGameStore
            .getState()
            .dailyQuests.find((q) => q.type === 'GAMES_PLAYED')!;
        useGameStore.getState().trackQuestProgress('GAMES_PLAYED', play.target);
        useGameStore.getState().claimQuestReward(play.id);

        useGameStore.getState().trackQuestProgress('GAMES_PLAYED', 5);
        const after = useGameStore
            .getState()
            .dailyQuests.find((q) => q.id === play.id)!;
        expect(after.claimed).toBe(true);
        expect(after.progress).toBe(after.target);
    });
});
