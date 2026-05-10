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
import type { GameStore, EconomySlice, PowerUpInventory } from '../types';
import { DEFAULT_POWER_UPS } from '../types';
import { ECONOMY } from '../../config';
import { notificationsService } from '../../services/notifications';

export const createEconomySlice: StateCreator<GameStore, [], [], EconomySlice> = (set, get) => ({
    coins: ECONOMY.INITIAL_COINS,
    inventory: ECONOMY.DEFAULT_INVENTORY,
    lastDailyBonus: 0,
    activeTheme: 'theme_classic',
    activeSkin: 'skin_classic',
    powerUps: { ...DEFAULT_POWER_UPS },

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
        const { lastDailyBonus } = get();
        const hours = (now - lastDailyBonus) / (1000 * 60 * 60);

        // Not ready yet (< 24h since last claim).
        if (hours < 24) return 0;

        // 24-48h: streak continues. >48h: streak broken, reset to day 1.
        let streakDay: number;
        if (hours < 48) {
            get().incrementStreak();
            streakDay = get().stats.currentStreak;
        } else {
            get().resetStreak();
            streakDay = 1;
        }

        // 7-day reward cycle. Day 8 cycles back to day 1 reward but
        // currentStreak/longestStreak keep accumulating.
        const REWARD_TABLE = [50, 75, 100, 150, 200, 250, 500];
        const idx = (streakDay - 1) % REWARD_TABLE.length;
        const reward = REWARD_TABLE[idx];

        get().addCoins(reward);
        set({ lastDailyBonus: now });

        // Schedule a reminder ~24h from now so the user is nudged back when
        // the next bonus becomes claimable. Honour the per-user toggle (default
        // on) and silently no-op if permission was denied at the OS level.
        const notifEnabled = (get() as GameStore).notificationsEnabled ?? true;
        if (notifEnabled) {
            notificationsService.scheduleDailyBonusReminder(24 * 60 * 60).catch(() => {});
        }

        return reward;
    },

    addPowerUp: (type: keyof PowerUpInventory, count: number) => {
        if (count <= 0) return;
        set((state) => ({
            powerUps: {
                ...state.powerUps,
                [type]: (state.powerUps?.[type] ?? 0) + count,
            },
        }));
    },

    usePowerUp: (type: keyof PowerUpInventory) => {
        const current = get().powerUps?.[type] ?? 0;
        if (current <= 0) return false;
        set((state) => ({
            powerUps: {
                ...state.powerUps,
                [type]: state.powerUps[type] - 1,
            },
        }));
        return true;
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
