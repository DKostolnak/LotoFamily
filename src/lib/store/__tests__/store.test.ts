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
