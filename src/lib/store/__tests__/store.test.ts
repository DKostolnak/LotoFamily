/**
 * Game Store Tests
 *
 * The store uses Zustand `persist` middleware backed by AsyncStorage. Tests
 * mock AsyncStorage with an in-memory implementation and reset the in-memory
 * store state to a known baseline before each test.
 */

import { act } from '@testing-library/react-native';

// Mock AsyncStorage with an in-memory map so persist writes/reads behave
// deterministically in tests.
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
            clear: jest.fn(() => {
                for (const k of Object.keys(memory)) delete memory[k];
                return Promise.resolve();
            }),
            getAllKeys: jest.fn(() => Promise.resolve(Object.keys(memory))),
            multiGet: jest.fn((keys: string[]) =>
                Promise.resolve(keys.map((k) => [k, memory[k] ?? null]))
            ),
            multiSet: jest.fn((pairs: [string, string][]) => {
                pairs.forEach(([k, v]) => {
                    memory[k] = v;
                });
                return Promise.resolve();
            }),
            multiRemove: jest.fn((keys: string[]) => {
                keys.forEach((k) => delete memory[k]);
                return Promise.resolve();
            }),
        },
    };
});

import { useGameStore } from '../index';

const baselineState = {
    playerName: '',
    playerAvatar: '🎱',
    coins: 1000,
    inventory: ['theme_classic', 'skin_classic'],
    lastDailyBonus: 0,
    activeTheme: 'theme_classic',
    activeSkin: 'skin_classic',
    stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalEarnings: 0,
        xp: 0,
        currentStreak: 0,
        longestStreak: 0,
        currentWinStreak: 0,
        longestWinStreak: 0,
    },
    tier: 'Bronze',
    isLoading: false,
    error: null,
    isInitialized: false,
    isMuted: false,
    language: 'en' as const,
    batterySaver: false,
    tutorialCompleted: false,
    powerUps: { peek: 1, luckyMark: 1, slowTime: 1 },
    seasonId: '',
    seasonStartedAt: 0,
    seasonEndsAt: 0,
    seasonXp: 0,
    seasonLevel: 1,
    hasPremium: false,
    claimedFree: [],
    claimedPremium: [],
};

describe('useGameStore', () => {
    beforeEach(() => {
        // Reset store state between tests to a known baseline.
        act(() => {
            useGameStore.setState(baselineState, false);
        });
    });

    describe('Player Profile', () => {
        it('sets and gets player name', () => {
            const store = useGameStore.getState();

            act(() => {
                store.setPlayerName('TestPlayer');
            });

            expect(useGameStore.getState().playerName).toBe('TestPlayer');
        });

        it('sets and gets player avatar', () => {
            const store = useGameStore.getState();

            act(() => {
                store.setPlayerAvatar('🎮');
            });

            expect(useGameStore.getState().playerAvatar).toBe('🎮');
        });
    });

    describe('Economy', () => {
        it('starts with initial coins', () => {
            expect(useGameStore.getState().coins).toBe(1000);
        });

        it('adds coins', () => {
            const store = useGameStore.getState();

            act(() => {
                store.addCoins(500);
            });

            expect(useGameStore.getState().coins).toBe(1500);
        });

        it('has default inventory items', () => {
            const inventory = useGameStore.getState().inventory;

            expect(inventory).toContain('theme_classic');
            expect(inventory).toContain('skin_classic');
        });

        it('purchases items and deducts coins', () => {
            // Set enough coins first
            act(() => {
                useGameStore.setState({ coins: 5000 });
            });

            const store = useGameStore.getState();

            act(() => {
                store.purchaseItem('new_item', 1000);
            });

            const state = useGameStore.getState();
            expect(state.coins).toBe(4000);
            expect(state.inventory).toContain('new_item');
        });

        it('does not purchase if insufficient coins', () => {
            act(() => {
                useGameStore.setState({ coins: 100 });
            });

            const initialInventory = [...useGameStore.getState().inventory];
            const store = useGameStore.getState();

            act(() => {
                store.purchaseItem('expensive_item', 5000);
            });

            const state = useGameStore.getState();
            // Coins unchanged
            expect(state.coins).toBe(100);
            // Inventory unchanged
            expect(state.inventory).toEqual(initialInventory);
        });

        it('equips items', () => {
            // Add item to inventory first
            act(() => {
                useGameStore.setState({
                    inventory: ['theme_classic', 'skin_classic', 'theme_gold'],
                });
            });

            const store = useGameStore.getState();

            act(() => {
                // Note: equipItem takes (category, id)
                store.equipItem('theme', 'theme_gold');
            });

            expect(useGameStore.getState().activeTheme).toBe('theme_gold');
        });
    });

    describe('Settings', () => {
        it('toggles mute', () => {
            const initialMuted = useGameStore.getState().isMuted;
            const store = useGameStore.getState();

            act(() => {
                store.setMuted(!initialMuted);
            });

            expect(useGameStore.getState().isMuted).toBe(!initialMuted);
        });

        it('changes language', () => {
            const store = useGameStore.getState();

            act(() => {
                store.setLanguage('sk');
            });

            expect(useGameStore.getState().language).toBe('sk');
        });

        it('toggles battery saver', () => {
            const store = useGameStore.getState();

            act(() => {
                store.setBatterySaver(true);
            });

            expect(useGameStore.getState().batterySaver).toBe(true);
        });

        it('defaults tutorialCompleted to false', () => {
            expect(useGameStore.getState().tutorialCompleted).toBe(false);
        });

        it('marks tutorial as completed via setTutorialCompleted', () => {
            const store = useGameStore.getState();

            act(() => {
                store.setTutorialCompleted(true);
            });

            expect(useGameStore.getState().tutorialCompleted).toBe(true);

            act(() => {
                useGameStore.getState().setTutorialCompleted(false);
            });

            expect(useGameStore.getState().tutorialCompleted).toBe(false);
        });
    });

    describe('Daily Streak', () => {
        const HOUR_MS = 60 * 60 * 1000;

        it('incrementStreak raises currentStreak and longestStreak when surpassed', () => {
            act(() => {
                useGameStore.getState().incrementStreak();
            });
            let s = useGameStore.getState().stats;
            expect(s.currentStreak).toBe(1);
            expect(s.longestStreak).toBe(1);

            act(() => {
                useGameStore.getState().incrementStreak();
                useGameStore.getState().incrementStreak();
            });
            s = useGameStore.getState().stats;
            expect(s.currentStreak).toBe(3);
            expect(s.longestStreak).toBe(3);
        });

        it('incrementStreak preserves longestStreak when current run is shorter', () => {
            act(() => {
                useGameStore.setState({
                    stats: {
                        ...useGameStore.getState().stats,
                        currentStreak: 0,
                        longestStreak: 5,
                    },
                });
                useGameStore.getState().incrementStreak();
            });
            const s = useGameStore.getState().stats;
            expect(s.currentStreak).toBe(1);
            expect(s.longestStreak).toBe(5);
        });

        it('resetStreak sets currentStreak to 1 and keeps longestStreak', () => {
            act(() => {
                useGameStore.setState({
                    stats: {
                        ...useGameStore.getState().stats,
                        currentStreak: 7,
                        longestStreak: 7,
                    },
                });
                useGameStore.getState().resetStreak();
            });
            const s = useGameStore.getState().stats;
            expect(s.currentStreak).toBe(1);
            expect(s.longestStreak).toBe(7);
        });

        it('checkDailyBonus returns 0 when last claim was < 24h ago', () => {
            const now = Date.now();
            act(() => {
                useGameStore.setState({ lastDailyBonus: now - 5 * HOUR_MS });
            });
            const bonus = useGameStore.getState().checkDailyBonus();
            expect(bonus).toBe(0);
            // Streak unchanged.
            expect(useGameStore.getState().stats.currentStreak).toBe(0);
        });

        it('checkDailyBonus continues streak in 24-48h window and rewards by table', () => {
            const now = Date.now();
            // Day 1 -> Day 2
            act(() => {
                useGameStore.setState({
                    lastDailyBonus: now - 30 * HOUR_MS,
                    coins: 0,
                    stats: {
                        ...useGameStore.getState().stats,
                        currentStreak: 1,
                        longestStreak: 1,
                    },
                });
            });
            const bonus = useGameStore.getState().checkDailyBonus();
            expect(bonus).toBe(75); // day 2 reward
            const s = useGameStore.getState();
            expect(s.stats.currentStreak).toBe(2);
            expect(s.stats.longestStreak).toBe(2);
            expect(s.coins).toBe(75);
        });

        it('checkDailyBonus breaks streak when > 48h gap and rewards 50 (day 1)', () => {
            const now = Date.now();
            act(() => {
                useGameStore.setState({
                    lastDailyBonus: now - 72 * HOUR_MS,
                    coins: 0,
                    stats: {
                        ...useGameStore.getState().stats,
                        currentStreak: 5,
                        longestStreak: 5,
                    },
                });
            });
            const bonus = useGameStore.getState().checkDailyBonus();
            expect(bonus).toBe(50);
            const s = useGameStore.getState();
            expect(s.stats.currentStreak).toBe(1);
            // longestStreak preserved.
            expect(s.stats.longestStreak).toBe(5);
            expect(s.coins).toBe(50);
        });

        it('7-day cycle: day 7 rewards 500, day 8 cycles to 50 but longestStreak grows', () => {
            const now = Date.now();
            // Set up so the next claim is day 7.
            act(() => {
                useGameStore.setState({
                    lastDailyBonus: now - 30 * HOUR_MS,
                    coins: 0,
                    stats: {
                        ...useGameStore.getState().stats,
                        currentStreak: 6,
                        longestStreak: 6,
                    },
                });
            });
            const day7 = useGameStore.getState().checkDailyBonus();
            expect(day7).toBe(500);
            expect(useGameStore.getState().stats.currentStreak).toBe(7);
            expect(useGameStore.getState().stats.longestStreak).toBe(7);

            // Advance: simulate next day claim (day 8 -> cycle restart reward).
            act(() => {
                useGameStore.setState({ lastDailyBonus: Date.now() - 30 * HOUR_MS });
            });
            const day8 = useGameStore.getState().checkDailyBonus();
            expect(day8).toBe(50); // cycles back to index 0
            const s = useGameStore.getState();
            expect(s.stats.currentStreak).toBe(8);
            expect(s.stats.longestStreak).toBe(8);
        });
    });

    describe('Power-ups', () => {
        it('starts with default power-up inventory of 1 each', () => {
            const { powerUps } = useGameStore.getState();
            expect(powerUps).toEqual({ peek: 1, luckyMark: 1, slowTime: 1 });
        });

        it('addPowerUp increments the given type by count', () => {
            act(() => {
                useGameStore.getState().addPowerUp('peek', 2);
            });
            expect(useGameStore.getState().powerUps.peek).toBe(3);
            // Other types unchanged.
            expect(useGameStore.getState().powerUps.luckyMark).toBe(1);
        });

        it('usePowerUp returns true and decrements when count > 0', () => {
            const before = useGameStore.getState().powerUps.peek;
            let result: boolean = false;
            act(() => {
                result = useGameStore.getState().usePowerUp('peek');
            });
            expect(result).toBe(true);
            expect(useGameStore.getState().powerUps.peek).toBe(before - 1);
        });

        it('usePowerUp returns false and leaves state unchanged when count === 0', () => {
            act(() => {
                useGameStore.setState({
                    powerUps: { peek: 0, luckyMark: 1, slowTime: 1 },
                });
            });
            let result: boolean = true;
            act(() => {
                result = useGameStore.getState().usePowerUp('peek');
            });
            expect(result).toBe(false);
            expect(useGameStore.getState().powerUps.peek).toBe(0);
        });

        it('addPowerUp ignores non-positive counts', () => {
            const before = useGameStore.getState().powerUps.slowTime;
            act(() => {
                useGameStore.getState().addPowerUp('slowTime', 0);
                useGameStore.getState().addPowerUp('slowTime', -5);
            });
            expect(useGameStore.getState().powerUps.slowTime).toBe(before);
        });
    });

    describe('Season / Battle Pass', () => {
        it('has sane defaults when reset', () => {
            act(() => {
                useGameStore.setState({
                    seasonId: '',
                    seasonStartedAt: 0,
                    seasonEndsAt: 0,
                    seasonXp: 0,
                    seasonLevel: 1,
                    hasPremium: false,
                    claimedFree: [],
                    claimedPremium: [],
                });
            });
            const s = useGameStore.getState();
            expect(s.seasonLevel).toBe(1);
            expect(s.seasonXp).toBe(0);
            expect(s.hasPremium).toBe(false);
            expect(s.claimedFree).toEqual([]);
            expect(s.claimedPremium).toEqual([]);
        });

        it('addSeasonXp bootstraps season and levels up when xpRequired is met', () => {
            act(() => {
                useGameStore.setState({
                    seasonId: '',
                    seasonStartedAt: 0,
                    seasonEndsAt: 0,
                    seasonXp: 0,
                    seasonLevel: 1,
                });
            });
            // Level 1 requires 100 XP -> 150 XP should land on level 2.
            act(() => {
                useGameStore.getState().addSeasonXp(150);
            });
            const s = useGameStore.getState();
            expect(s.seasonXp).toBe(150);
            expect(s.seasonLevel).toBeGreaterThanOrEqual(2);
            expect(s.seasonStartedAt).toBeGreaterThan(0);
            expect(s.seasonEndsAt).toBeGreaterThan(s.seasonStartedAt);
        });

        it('claimReward(level=1, "free") grants reward and marks claimed', () => {
            act(() => {
                useGameStore.setState({
                    seasonId: 'season_test',
                    seasonStartedAt: Date.now(),
                    seasonEndsAt: Date.now() + 30 * 86400000,
                    seasonXp: 200,
                    seasonLevel: 2,
                    hasPremium: false,
                    claimedFree: [],
                    claimedPremium: [],
                    coins: 0,
                });
            });
            let reward: any = undefined;
            act(() => {
                reward = useGameStore.getState().claimReward(1, 'free');
            });
            expect(reward).not.toBeNull();
            const s = useGameStore.getState();
            expect(s.claimedFree).toContain(1);
            // Level 1 free reward is 25 coins per the pattern.
            expect(s.coins).toBe(25);
        });

        it('claimReward premium track returns null when !hasPremium', () => {
            act(() => {
                useGameStore.setState({
                    seasonId: 'season_test',
                    seasonStartedAt: Date.now(),
                    seasonEndsAt: Date.now() + 30 * 86400000,
                    seasonXp: 200,
                    seasonLevel: 2,
                    hasPremium: false,
                    claimedFree: [],
                    claimedPremium: [],
                });
            });
            let reward: any;
            act(() => {
                reward = useGameStore.getState().claimReward(1, 'premium');
            });
            expect(reward).toBeNull();
            expect(useGameStore.getState().claimedPremium).toEqual([]);
        });

        it('claimReward returns null if level not yet reached', () => {
            act(() => {
                useGameStore.setState({
                    seasonId: 'season_test',
                    seasonStartedAt: Date.now(),
                    seasonEndsAt: Date.now() + 30 * 86400000,
                    seasonXp: 0,
                    seasonLevel: 1,
                    hasPremium: true,
                    claimedFree: [],
                    claimedPremium: [],
                });
            });
            let reward: any;
            act(() => {
                reward = useGameStore.getState().claimReward(5, 'free');
            });
            expect(reward).toBeNull();
        });

        it('claimReward cannot be claimed twice', () => {
            act(() => {
                useGameStore.setState({
                    seasonId: 'season_test',
                    seasonStartedAt: Date.now(),
                    seasonEndsAt: Date.now() + 30 * 86400000,
                    seasonXp: 200,
                    seasonLevel: 2,
                    hasPremium: false,
                    claimedFree: [],
                    claimedPremium: [],
                    coins: 0,
                });
            });
            let r1: any;
            let r2: any;
            act(() => {
                r1 = useGameStore.getState().claimReward(1, 'free');
                r2 = useGameStore.getState().claimReward(1, 'free');
            });
            expect(r1).not.toBeNull();
            expect(r2).toBeNull();
        });

        it('purchasePremium flips hasPremium=true (mock IAP)', async () => {
            act(() => {
                useGameStore.setState({ hasPremium: false });
            });
            let ok = false;
            await act(async () => {
                ok = await useGameStore.getState().purchasePremium();
            });
            expect(ok).toBe(true);
            expect(useGameStore.getState().hasPremium).toBe(true);
        });

        it('checkSeasonRollover bootstraps a fresh season when none exists', () => {
            act(() => {
                useGameStore.setState({
                    seasonId: '',
                    seasonStartedAt: 0,
                    seasonEndsAt: 0,
                    seasonXp: 0,
                    seasonLevel: 1,
                });
                useGameStore.getState().checkSeasonRollover();
            });
            const s = useGameStore.getState();
            expect(s.seasonStartedAt).toBeGreaterThan(0);
            expect(s.seasonEndsAt).toBeGreaterThan(s.seasonStartedAt);
            expect(s.seasonId).toMatch(/^season_\d{4}_\d{2}$/);
        });
    });

    describe('Persistence', () => {
        it('writes persisted slice to AsyncStorage on action', async () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;

            act(() => {
                useGameStore.getState().setPlayerName('PersistedName');
                useGameStore.getState().addCoins(250);
            });

            // Allow persist middleware microtask to flush.
            await Promise.resolve();
            await Promise.resolve();

            const raw = await AsyncStorage.getItem('loto-game-storage');
            expect(raw).not.toBeNull();
            const parsed = JSON.parse(raw as string);
            expect(parsed.state.playerName).toBe('PersistedName');
            expect(parsed.state.coins).toBe(1250);
            // Transient flags must not be persisted (partialize).
            expect(parsed.state.isLoading).toBeUndefined();
            expect(parsed.state.isInitialized).toBeUndefined();
            expect(parsed.state.error).toBeUndefined();
        });
    });
});
