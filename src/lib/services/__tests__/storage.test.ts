/**
 * Storage Service Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
    storageService, 
    STORAGE_KEYS,
    getCoins,
    setCoins,
    getInventory,
    setInventory,
} from '../storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('StorageService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('get', () => {
        it('returns parsed JSON for valid data', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ test: 'data' }));
            
            const result = await storageService.get<{ test: string }>('testKey');
            
            expect(result).toEqual({ test: 'data' });
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('testKey');
        });

        it('returns null for missing data', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            
            const result = await storageService.get('nonexistent');
            
            expect(result).toBeNull();
        });

        it('returns null on error', async () => {
            (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
            
            const result = await storageService.get('errorKey');
            
            expect(result).toBeNull();
        });
    });

    describe('getString', () => {
        it('returns raw string value', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('raw string');
            
            const result = await storageService.getString('stringKey');
            
            expect(result).toBe('raw string');
        });
    });

    describe('set', () => {
        it('stores JSON stringified values', async () => {
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            
            await storageService.set('objectKey', { foo: 'bar' });
            
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                'objectKey',
                JSON.stringify({ foo: 'bar' })
            );
        });

        it('stores string values directly', async () => {
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            
            await storageService.set('stringKey', 'plain string');
            
            expect(AsyncStorage.setItem).toHaveBeenCalledWith('stringKey', 'plain string');
        });
    });

    describe('remove', () => {
        it('removes item from storage', async () => {
            (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
            
            await storageService.remove('removeKey');
            
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('removeKey');
        });
    });
});

describe('Storage Helpers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCoins/setCoins', () => {
        it('returns default coins when no value stored', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            
            const coins = await getCoins();
            
            expect(coins).toBe(1000);
        });

        it('returns stored coins value', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('5000');
            
            const coins = await getCoins();
            
            expect(coins).toBe(5000);
        });

        it('stores coins value', async () => {
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            
            await setCoins(2500);
            
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                STORAGE_KEYS.COINS,
                '2500'
            );
        });
    });

    describe('getInventory/setInventory', () => {
        it('returns default inventory when no value stored', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            
            const inventory = await getInventory();
            
            expect(inventory).toEqual(['theme_classic', 'skin_classic']);
        });

        it('returns stored inventory', async () => {
            const storedInventory = ['theme_gold', 'skin_emerald'];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedInventory));
            
            const inventory = await getInventory();
            
            expect(inventory).toEqual(storedInventory);
        });

        it('stores inventory array', async () => {
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            
            const newInventory = ['item1', 'item2', 'item3'];
            await setInventory(newInventory);
            
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                STORAGE_KEYS.INVENTORY,
                JSON.stringify(newInventory)
            );
        });
    });
});

describe('STORAGE_KEYS', () => {
    it('has all required keys defined', () => {
        expect(STORAGE_KEYS.PLAYER_TOKEN).toBeDefined();
        expect(STORAGE_KEYS.PLAYER_AVATAR).toBeDefined();
        expect(STORAGE_KEYS.PLAYER_NAME).toBeDefined();
        expect(STORAGE_KEYS.COINS).toBeDefined();
        expect(STORAGE_KEYS.INVENTORY).toBeDefined();
        expect(STORAGE_KEYS.LANGUAGE).toBeDefined();
        expect(STORAGE_KEYS.STATS).toBeDefined();
    });
});
