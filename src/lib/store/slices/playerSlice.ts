/**
 * Player Slice
 *
 * Handles player identity: name and avatar.
 * Single Responsibility: Player profile management only.
 *
 * Persistence is handled automatically by the Zustand `persist` middleware
 * configured in `../index.ts` — slices only need to call `set(...)`.
 */

import type { StateCreator } from 'zustand';
import type { GameStore, PlayerSlice } from '../types';

export const createPlayerSlice: StateCreator<GameStore, [], [], PlayerSlice> = (set) => ({
    playerName: '',
    playerAvatar: '🐻',

    setPlayerName: (name: string) => set({ playerName: name }),

    setPlayerAvatar: (avatar: string) => set({ playerAvatar: avatar }),
});
