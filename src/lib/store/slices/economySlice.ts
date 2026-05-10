/**
 * Economy Slice
 *
 * Handles coins, inventory, purchases, and equipped items.
 * Single Responsibility: Economic transactions only.
 *
 * Persistence is handled automatically by the Zustand `persist` middleware
 * configured in `../index.ts` — slices only need to call `set(...)`.
 */

import type { StateCreator } from 'zustand';
import type { GameStore, EconomySlice } from '../types';
import { ECONOMY } from '../../config';

export const createEconomySlice: StateCreator<GameStore, [], [], EconomySlice> = (set, get) => ({
    coins: ECONOMY.INITIAL_COINS,
    inventory: ECONOMY.DEFAULT_INVENTORY,
    lastDailyBonus: 0,
    activeTheme: 'theme_classic',
    activeSkin: 'skin_classic',

    addCoins: (amount: number) =>
        set((state) => ({ coins: state.coins + amount })),

    removeCoins: (amount: number) => {
        const { coins } = get();
        if (coins < amount) return false;

        set((state) => ({ coins: state.coins - amount }));
        return true;
    },

    purchaseItem: (itemId: string, cost: number) => {
        const state = get();

        // Validation
        if (state.coins < cost) return false;
        if (state.inventory.includes(itemId)) return false;

        // Execute purchase
        set({
            coins: state.coins - cost,
            inventory: [...state.inventory, itemId],
        });

        return true;
    },

    checkDailyBonus: () => {
        const now = Date.now();
        const { lastDailyBonus, coins } = get();
        const oneDayMs = ECONOMY.DAILY_BONUS_INTERVAL_MS;

        if (now - lastDailyBonus > oneDayMs) {
            set({
                lastDailyBonus: now,
                coins: coins + ECONOMY.DAILY_BONUS_AMOUNT,
            });

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
        } else if (category === 'skin') {
            set({ activeSkin: id });
        }
    },
});
