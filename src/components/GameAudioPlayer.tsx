'use client';

import { useEffect, useRef, useCallback } from 'react';
import { GameState } from '@/lib/types';

interface GameAudioPlayerProps {
    gameState: GameState | null;
    onCellMark?: () => void;
}

// Simple sound frequencies for different events
const SOUNDS = {
    numberCall: { frequency: 440, duration: 200, type: 'sine' as OscillatorType },
    cellMark: { frequency: 880, duration: 100, type: 'sine' as OscillatorType },
    flatClaim: { frequency: 523, duration: 300, type: 'triangle' as OscillatorType },
    bingo: { frequencies: [523, 659, 784, 1047], duration: 150, type: 'sine' as OscillatorType },
    error: { frequency: 200, duration: 150, type: 'sawtooth' as OscillatorType },
    click: { frequency: 1200, duration: 50, type: 'sine' as OscillatorType }, // New click sound
};

export default function GameAudioPlayer({ gameState }: GameAudioPlayerProps) {
    const lastNumberRef = useRef<number | null>(null);
    const lastPhaseRef = useRef<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize audio context on first user interaction
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    // Play a beep sound
    const playBeep = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
        try {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

            // Envelope for smooth sound
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration / 1000);
        } catch (e) {
            // Silent fail - audio not critical
        }
    }, [getAudioContext]);

    // Play victory sound (ascending notes)
    const playVictorySound = useCallback(() => {
        const { frequencies, duration, type } = SOUNDS.bingo;
        frequencies.forEach((freq, i) => {
            setTimeout(() => playBeep(freq, duration, type), i * 150);
        });
    }, [playBeep]);

    // Haptic feedback
    const vibrate = useCallback((pattern: number | number[]) => {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }, []);

    useEffect(() => {
        if (!gameState) return;

        // Number Calling Logic
        if (gameState.currentNumber !== lastNumberRef.current && gameState.currentNumber !== null) {
            if (gameState.phase === 'playing') {
                // Play sound effect
                playBeep(SOUNDS.numberCall.frequency, SOUNDS.numberCall.duration, SOUNDS.numberCall.type);
                vibrate(100);

                // Also speak the number
                speakNumber(gameState.currentNumber, gameState.settings.language);
            }
            lastNumberRef.current = gameState.currentNumber;
        }

        // Winner detection
        if (gameState.phase === 'finished' && lastPhaseRef.current !== 'finished') {
            playVictorySound();
            vibrate([100, 50, 100, 50, 200]);
        }

        // Track phase changes
        lastPhaseRef.current = gameState.phase;

        // Reset tracking if game ends or restarts
        if (gameState.currentNumber === null) {
            lastNumberRef.current = null;
        }

    }, [gameState?.currentNumber, gameState?.phase, gameState?.settings.language, playBeep, vibrate, playVictorySound]);

    const speakNumber = (num: number, limitLang: 'en' | 'sk' | 'uk' | 'ru') => {
        if (!('speechSynthesis' in window)) return;

        // Cancel previous speech to avoid queue buildup
        window.speechSynthesis.cancel();

        const utterText = `${num}`;

        const utterance = new SpeechSynthesisUtterance(utterText);

        // Map internal language codes to BCP 47 language tags
        let langTag = 'en-US';
        if (limitLang === 'sk') langTag = 'sk-SK';
        else if (limitLang === 'uk') langTag = 'uk-UA';
        else if (limitLang === 'ru') langTag = 'ru-RU';

        utterance.lang = langTag;
        utterance.rate = 1.1; // Slightly faster
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
    };

    return null; // Invisible component
}

// Export utility for other components to play sounds
export function playCellMarkSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(SOUNDS.cellMark.frequency, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);

        // Haptic
        if ('vibrate' in navigator) {
            navigator.vibrate(30);
        }
    } catch (e) {
        // Silent fail
    }
}


// Generic click sound for UI buttons
export function playClickSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = SOUNDS.click.type;
        oscillator.frequency.setValueAtTime(SOUNDS.click.frequency, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
        // Silent
    }
}

// Play victory fanfare manually
export function playVictoryFanfare() {
    try {
        const { frequencies, duration, type } = SOUNDS.bingo;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();

        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.type = type;
                oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

                // Louder and longer sustain
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + duration / 1000);
            }, i * 150);
        });

        // Haptic
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);

    } catch (e) {
        // Silent
    }
}

