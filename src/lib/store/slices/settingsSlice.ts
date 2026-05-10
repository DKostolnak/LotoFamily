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
import type { GameStore, SettingsSlice, AnnouncerMode } from '../types';
import type { Language } from '../../i18n';

export const createSettingsSlice: StateCreator<GameStore, [], [], SettingsSlice> = (set) => ({
    isMuted: false,
    language: 'en' as Language,
    batterySaver: false,
    tutorialCompleted: false,
    notificationsEnabled: true,
    announcerMode: 'numbers',

    setMuted: (muted: boolean) => set({ isMuted: muted }),

    setLanguage: (lang: Language) => set({ language: lang }),

    setBatterySaver: (enabled: boolean) => set({ batterySaver: enabled }),

    setTutorialCompleted: (done: boolean) => set({ tutorialCompleted: done }),

    setNotificationsEnabled: (enabled: boolean) => set({ notificationsEnabled: enabled }),

    setAnnouncerMode: (mode: AnnouncerMode) => {
        // Lazy require so this slice can be loaded in pure-JS test
        // environments (jest) where `expo-audio` native code can't run.
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { audioService } = require('../../services/audio');
            audioService.setAnnouncerMode(mode);
        } catch {
            // Audio module unavailable (tests) — settings still update.
        }
        set({ announcerMode: mode });
    },
});
