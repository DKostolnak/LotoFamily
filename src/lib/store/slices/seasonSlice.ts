/**
 * Season / Battle Pass Slice
 *
 * Handles season XP, level derivation, reward claiming, and premium-track
 * unlock via mock IAP. Persistence is handled by the Zustand `persist`
 * middleware in `../index.ts`.
 *
 * Single Responsibility: only the seasonal progression / reward bookkeeping.
 * Reward grants flow through existing economy slice methods (addCoins,
 * direct inventory mutation) so we never duplicate economy logic.
 */

import type { StateCreator } from 'zustand';
import type { GameStore, SeasonSlice, SeasonState } from '../types';
import {
    SEASON_DURATION_MS,
    SEASON_GRACE_MS,
    SEASON_LEVEL_COUNT,
    SEASON_PREMIUM_PRODUCT_ID,
    deriveLevelFromXp,
    generateSeasonLevels,
    makeSeasonId,
    type SeasonReward,
} from '../../config/season.config';
import { purchasesService } from '../../services/purchases';
import { notificationsService } from '../../services/notifications';
import { translations } from '../../i18n';

/**
 * Schedule a "season ending soon" notification 3 days before season end.
 * Only schedules if 3 days are still in the future.
 */
function scheduleSeasonEndingNotif(
    seasonEndsAt: number,
    now: number,
    get: () => GameStore,
): void {
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const notifAt = seasonEndsAt - THREE_DAYS_MS;
    const secondsUntilNotif = Math.floor((notifAt - now) / 1000);
    if (secondsUntilNotif < 60) return; // too soon or already past

    const notifEnabled = (get() as GameStore).notificationsEnabled ?? true;
    if (!notifEnabled) return;

    const t = translations[(get() as GameStore).language ?? 'en'];
    notificationsService.scheduleSeasonEndingReminder(
        secondsUntilNotif,
        t.seasonEndingNotifTitle,
        t.seasonEndingNotifBody,
    ).catch(() => {});
}

/** Build a fresh season starting now. */
function freshSeason(now = Date.now()): SeasonState {
    return {
        seasonId: makeSeasonId(now),
        seasonStartedAt: now,
        seasonEndsAt: now + SEASON_DURATION_MS,
        seasonXp: 0,
        seasonLevel: 1,
        hasPremium: false,
        claimedFree: [],
        claimedPremium: [],
    };
}

export const createSeasonSlice: StateCreator<GameStore, [], [], SeasonSlice> = (set, get) => ({
    // Default empty state — gets initialized lazily on first XP/claim/rollover
    // call. We don't auto-start the season at slice-create time because the
    // store is constructed before persist rehydration; instead `initialize`
    // (app slice) or any slice action will trigger checkSeasonRollover which
    // bootstraps the season if seasonStartedAt === 0.
    seasonId: '',
    seasonStartedAt: 0,
    seasonEndsAt: 0,
    seasonXp: 0,
    seasonLevel: 1,
    hasPremium: false,
    claimedFree: [],
    claimedPremium: [],

    addSeasonXp: (amount: number) => {
        if (!Number.isFinite(amount) || amount <= 0) return;

        // Bootstrap the season if it hasn't been started yet.
        const state = get();
        if (state.seasonStartedAt === 0) {
            set(freshSeason());
        }

        const next = get();
        const newXp = next.seasonXp + amount;
        const levels = generateSeasonLevels(next.seasonId);
        const { level } = deriveLevelFromXp(newXp, levels);

        set({ seasonXp: newXp, seasonLevel: level });
    },

    claimReward: (level: number, track: 'free' | 'premium') => {
        const state = get();

        // Validate level
        if (level < 1 || level > SEASON_LEVEL_COUNT) return null;

        // Premium track requires the user to have premium
        if (track === 'premium' && !state.hasPremium) return null;

        // Must have reached this level
        if (state.seasonLevel < level) return null;

        // Must not already be claimed
        const claimedList = track === 'free' ? state.claimedFree : state.claimedPremium;
        if (claimedList.includes(level)) return null;

        const levels = generateSeasonLevels(state.seasonId || makeSeasonId(Date.now()));
        const slot = levels[level - 1];
        const reward: SeasonReward = track === 'free' ? slot.freeReward : slot.premiumReward;

        // Apply reward
        applyReward(reward, get, set);

        // Mark as claimed
        if (track === 'free') {
            set({ claimedFree: [...state.claimedFree, level] });
        } else {
            set({ claimedPremium: [...state.claimedPremium, level] });
        }

        // Persist immediately — reward claim must survive reinstall/device switch
        get().syncToSupabase().catch(() => {});

        return reward;
    },

    purchasePremium: async () => {
        const result = await purchasesService.purchase(SEASON_PREMIUM_PRODUCT_ID);
        if (result.success) {
            set({ hasPremium: true });
            // Critical: sync immediately so premium survives reinstall/device switch
            get().syncToSupabase().catch(() => {});
            return true;
        }
        return false;
    },

    checkSeasonRollover: () => {
        const state = get();
        const now = Date.now();

        // Bootstrap if never started
        if (state.seasonStartedAt === 0) {
            const newSeason = freshSeason(now);
            set(newSeason);
            scheduleSeasonEndingNotif(newSeason.seasonEndsAt, now, get);
            return;
        }

        // Past end + grace → start a new season, fresh progress.
        if (now > state.seasonEndsAt + SEASON_GRACE_MS) {
            const newSeason = freshSeason(now);
            set(newSeason);
            scheduleSeasonEndingNotif(newSeason.seasonEndsAt, now, get);
            return;
        }

        // Existing season — ensure the ending reminder is scheduled
        scheduleSeasonEndingNotif(state.seasonEndsAt, now, get);
    },
});

/**
 * Apply a season reward by mutating the underlying economy state.
 *
 * For coins → addCoins (and apply bonus amount on milestone avatar reward).
 * For inventory items (theme/skin/avatar/powerup) → push to inventory if
 * not already present. We use a direct set() rather than purchaseItem
 * because the user is *receiving* the item for free — there is no cost.
 */
function applyReward(
    reward: SeasonReward,
    get: () => GameStore,
    set: (partial: Partial<GameStore>) => void
) {
    if (reward.type === 'coins' && reward.amount) {
        get().addCoins(reward.amount);
        return;
    }

    // Power-up: grant via economy slice's addPowerUp if available, with a
    // safe fallback for the (test) case where the power-up slice is absent.
    if (reward.type === 'powerup' && reward.itemId) {
        const state = get();
        const count = reward.amount ?? 1;
        const addPowerUp = (state as Partial<GameStore>).addPowerUp;
        if (typeof addPowerUp === 'function') {
            addPowerUp(reward.itemId as Parameters<typeof addPowerUp>[0], count);
        }
        return;
    }

    // Themes / skins / avatars: add to cosmetic inventory
    if (reward.itemId) {
        const state = get();
        if (!state.inventory.includes(reward.itemId)) {
            set({ inventory: [...state.inventory, reward.itemId] });
        }
        // Some milestones also bundle bonus coins (e.g. level 50)
        if (reward.amount) {
            get().addCoins(reward.amount);
        }
    }
}
