import { act } from '@testing-library/react-native';

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

// eslint-disable-next-line import/first
import { useGameStore } from '../index';

describe('moderationSlice', () => {
    beforeEach(() => {
        act(() => {
            useGameStore.setState({ blockedUserIds: [] }, false);
        });
    });

    it('blocks a user once and reports blocked status', () => {
        act(() => {
            useGameStore.getState().blockUser('player-1');
            useGameStore.getState().blockUser('player-1');
        });

        expect(useGameStore.getState().blockedUserIds).toEqual(['player-1']);
        expect(useGameStore.getState().isBlocked('player-1')).toBe(true);
        expect(useGameStore.getState().isBlocked('player-2')).toBe(false);
    });

    it('unblocks a user', () => {
        act(() => {
            useGameStore.getState().blockUser('player-1');
            useGameStore.getState().blockUser('player-2');
            useGameStore.getState().unblockUser('player-1');
        });

        expect(useGameStore.getState().blockedUserIds).toEqual(['player-2']);
        expect(useGameStore.getState().isBlocked('player-1')).toBe(false);
    });

    it('persists only the blocked user id list', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;

        act(() => {
            useGameStore.getState().blockUser('player-1');
        });

        await Promise.resolve();
        await Promise.resolve();

        const raw = await AsyncStorage.getItem('loto-game-storage');
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw as string);
        expect(parsed.state.blockedUserIds).toEqual(['player-1']);
        expect(parsed.state.isBlocked).toBeUndefined();
    });
});
