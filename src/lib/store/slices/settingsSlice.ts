/**
 * Settings Slice
 *
 * Handles app settings: audio, language, battery saver.
 * Single Responsibility: User preferences only.
 *
 * Persistence is handled automatically by the Zustand `persist` middleware
 * configured in `../index.ts` — slices only need to call `set(...)`.
 */

import type { StateCreator } from 'zustand';
import type { GameStore, SettingsSlice } from '../types';
import type { Language } from '../../i18n';

export const createSettingsSlice: StateCreator<GameStore, [], [], SettingsSlice> = (set) => ({
    isMuted: false,
    language: 'en' as Language,
    batterySaver: false,

    setMuted: (muted: boolean) => set({ isMuted: muted }),

    setLanguage: (lang: Language) => set({ language: lang }),

    setBatterySaver: (enabled: boolean) => set({ batterySaver: enabled }),
});
