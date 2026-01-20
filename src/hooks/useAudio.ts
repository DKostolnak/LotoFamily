import { useEffect, useCallback } from 'react';
import { audioService } from '@/lib/services';

export function useAudio() {
    useEffect(() => {
        // Initialize audio session on mount
        audioService.initialize();
    }, []);

    const speak = useCallback((text: string) => {
        audioService.speak(text);
    }, []);

    const speakNumber = useCallback((number: number) => {
        audioService.speak(number.toString());
    }, []);

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
        stopAudio,
        setMuted,
        playSound,
    };
}
