import type { StateCreator } from 'zustand';
import type { GameStore, ModerationSlice } from '../types';

export const createModerationSlice: StateCreator<GameStore, [], [], ModerationSlice> = (set, get) => ({
    blockedUserIds: [],

    blockUser: (id: string) => {
        if (!id || get().blockedUserIds.includes(id)) return;
        set({ blockedUserIds: [...get().blockedUserIds, id] });
    },

    unblockUser: (id: string) => {
        set({ blockedUserIds: get().blockedUserIds.filter(blockedId => blockedId !== id) });
    },

    isBlocked: (id: string) => get().blockedUserIds.includes(id),
});
