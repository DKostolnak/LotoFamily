/**
 * Player Slice
 * 
 * Handles player identity: name and avatar.
 * Single Responsibility: Player profile management only.
 */

import type { StateCreator } from 'zustand';
import type { GameStore, PlayerSlice } from '../types';
import { setPlayerName as saveName, setPlayerAvatar as saveAvatar } from '../../services/storage';

export const createPlayerSlice: StateCreator<GameStore, [], [], PlayerSlice> = (set) => ({
    playerName: '',
    playerAvatar: '🐻',

    setPlayerName: (name: string) => {
        set({ playerName: name });
        saveName(name);
    },

    setPlayerAvatar: (avatar: string) => {
        set({ playerAvatar: avatar });
        saveAvatar(avatar);
    },
});
