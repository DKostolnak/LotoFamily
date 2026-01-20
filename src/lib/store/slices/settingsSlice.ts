/**
 * Settings Slice
 * 
 * Handles app settings: audio, language, battery saver.
 * Single Responsibility: User preferences only.
 */

import type { StateCreator } from 'zustand';
import type { GameStore, SettingsSlice } from '../types';
import type { Language } from '../../i18n';
import { storageService, STORAGE_KEYS } from '../../services/storage';

export const createSettingsSlice: StateCreator<GameStore, [], [], SettingsSlice> = (set) => ({
    isMuted: false,
    language: 'en' as Language,
    batterySaver: false,

    setMuted: (muted: boolean) => {
        set({ isMuted: muted });
        storageService.set(STORAGE_KEYS.AUDIO_MUTED, muted);
    },

    setLanguage: (lang: Language) => {
        set({ language: lang });
        storageService.set(STORAGE_KEYS.LANGUAGE, lang);
    },

    setBatterySaver: (enabled: boolean) => {
        set({ batterySaver: enabled });
        storageService.set(STORAGE_KEYS.BATTERY_SAVER, enabled);
    },
});
