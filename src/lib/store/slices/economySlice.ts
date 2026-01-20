/**
 * Economy Slice
 * 
 * Handles coins, inventory, purchases, and equipped items.
 * Single Responsibility: Economic transactions only.
 */

import type { StateCreator } from 'zustand';
import type { GameStore, EconomySlice } from '../types';
import {
    setCoins,
    setInventory,
    setLastDailyBonus,
    setActiveTheme,
    setActiveSkin,
} from '../../services/storage';
import { ECONOMY } from '../../config';

export const createEconomySlice: StateCreator<GameStore, [], [], EconomySlice> = (set, get) => ({
    coins: ECONOMY.INITIAL_COINS,
    inventory: ECONOMY.DEFAULT_INVENTORY,
    lastDailyBonus: 0,
    activeTheme: 'theme_classic',
    activeSkin: 'skin_classic',

    addCoins: (amount: number) => {
        set((state) => {
            const newCoins = state.coins + amount;
            setCoins(newCoins);
            return { coins: newCoins };
        });
    },

    removeCoins: (amount: number) => {
        const { coins } = get();
        if (coins < amount) return false;
        
        set((state) => {
            const newCoins = state.coins - amount;
            setCoins(newCoins);
            return { coins: newCoins };
        });
        return true;
    },

    purchaseItem: (itemId: string, cost: number) => {
        const state = get();
        
        // Validation
        if (state.coins < cost) return false;
        if (state.inventory.includes(itemId)) return false;
        
        // Execute purchase
        const newInventory = [...state.inventory, itemId];
        const newCoins = state.coins - cost;
        
        set({
            coins: newCoins,
            inventory: newInventory,
        });
        
        // Persist
        setCoins(newCoins);
        setInventory(newInventory);
        
        return true;
    },

    checkDailyBonus: () => {
        const now = Date.now();
        const { lastDailyBonus, coins } = get();
        const oneDayMs = ECONOMY.DAILY_BONUS_INTERVAL_MS;

        if (now - lastDailyBonus > oneDayMs) {
            const newCoins = coins + ECONOMY.DAILY_BONUS_AMOUNT;
            
            set({
                lastDailyBonus: now,
                coins: newCoins,
            });
            
            setLastDailyBonus(now);
            setCoins(newCoins);
            
            return ECONOMY.DAILY_BONUS_AMOUNT;
        }
        
        return 0;
    },

    equipItem: (category, id) => {
        const { inventory } = get();
        
        // Can only equip owned items
        if (!inventory.includes(id)) return;
        
        if (category === 'theme') {
            set({ activeTheme: id });
            setActiveTheme(id);
        } else if (category === 'skin') {
            set({ activeSkin: id });
            setActiveSkin(id);
        }
    },
});
