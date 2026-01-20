import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { storageService, STORAGE_KEYS } from './services/storage';

// In a real app, you'd import sound files here
// const CLICK_SOUND = require('../../assets/sounds/click.mp3'); 
// But since we don't have them yet, we'll use Haptics as primary feedback 
// and placeholders for Audio objects if files existed.

// State
let isMuted = false;
let isVoiceMuted = false;

// Initialize
export const initAudio = async () => {
    try {
        const muted = await storageService.getString(STORAGE_KEYS.AUDIO_MUTED);
        isMuted = muted === 'true';
        // No explicit audio session needed while we only use speech + haptics.
    } catch (e) {
        console.warn('Audio init failed', e);
    }
};

export const toggleMute = () => {
    isMuted = !isMuted;
    storageService.set(STORAGE_KEYS.AUDIO_MUTED, String(isMuted));
    return isMuted;
};

export const toggleVoiceMute = () => {
    isVoiceMuted = !isVoiceMuted;
    return isVoiceMuted;
};

// Sound Effects
export const playClickSound = async () => {
    if (isMuted) return;
    // Mobile-first: Haptics are often better than generic clicks
    Haptics.selectionAsync();
    // await clickSound.replayAsync();
};

export const playCellMarkSound = async () => {
    if (isMuted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const playBonusSound = async () => {
    if (isMuted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export const playErrorSound = async () => {
    if (isMuted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

export const playWinSound = async () => {
    if (isMuted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

// Voice
export const playNumberCall = (number: number, language: string = 'en-US') => {
    if (isMuted || isVoiceMuted) return;

    // Map Loto language codes to Speech locales
    const locales: Record<string, string> = {
        'en': 'en-US',
        'sk': 'sk-SK',
        'ru': 'ru-RU',
        'uk': 'uk-UA',
    };
    const locale = locales[language] || 'en-US';

    Speech.speak(String(number), {
        language: locale,
        pitch: 1.0,
        rate: 0.9,
    });
};

export const stopAudio = () => {
    Speech.stop();
};
