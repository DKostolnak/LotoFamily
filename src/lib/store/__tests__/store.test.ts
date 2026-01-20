/**
 * Game Store Tests
 */

import { act } from '@testing-library/react-native';
import { useGameStore } from '../index';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
}));

describe('useGameStore', () => {
    beforeEach(() => {
        // Reset store state between tests
        act(() => {
            useGameStore.setState({
                playerName: '',
                playerAvatar: '🎱',
                coins: 1000,
                inventory: ['theme_classic', 'skin_classic'],
                activeTheme: 'theme_classic',
                activeSkin: 'skin_classic',
                isLoading: false,
                isMuted: false,
                language: 'en',
                batterySaver: false,
            });
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
    });
});
