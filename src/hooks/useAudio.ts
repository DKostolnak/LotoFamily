import { useEffect, useCallback } from 'react';
import { audioService } from '@/lib/services';
import { useGameStore } from '@/lib/store';

export function useAudio() {
    const language = useGameStore((s) => s.language);

    useEffect(() => {
        // Initialize audio session on mount
        audioService.initialize();
    }, []);

    const speak = useCallback((text: string) => {
        audioService.speak(text);
    }, []);

    /**
     * Speak a called number using the announcer mode + language stored
     * in settings. Replaces the old digit-only `speakNumber` behaviour
     * while keeping that method around for backward compatibility.
     */
    const announceNumber = useCallback((number: number) => {
        audioService.announceNumber(number, language);
    }, [language]);

    const speakNumber = useCallback((number: number) => {
        audioService.announceNumber(number, language);
    }, [language]);

    const stopAudio = useCallback(() => {
        audioService.stopAll();
    }, []);

    const setMuted = useCallback((muted: boolean) => {
        audioService.setMuted(muted);
    }, []);

    const playSound = useCallback((effect: Parameters<typeof audioService.playSound>[0]) => {
        audioService.playSound(effect);
    }, []);

    return {
        speak,
        speakNumber,
        announceNumber,
        stopAudio,
        setMuted,
        playSound,
    };
}
