'use client';

import { useEffect, useRef, useCallback } from 'react';
import { GameState } from '@/lib/types';

interface GameAudioPlayerProps {
    gameState: GameState | null;
    onCellMark?: () => void;
}

// Sound configuration for different events
const SOUNDS = {
    numberCall: { frequency: 440, duration: 200, type: 'sine' as OscillatorType },
    cellMark: { frequency: 880, duration: 100, type: 'sine' as OscillatorType },
    flatClaim: { frequency: 523, duration: 300, type: 'triangle' as OscillatorType },
    bingo: { frequencies: [523, 659, 784, 1047], duration: 150, type: 'sine' as OscillatorType },
    error: { frequency: 200, duration: 150, type: 'sawtooth' as OscillatorType },
    click: { frequency: 1200, duration: 50, type: 'sine' as OscillatorType },
};

// ============================================================================
// AUDIO CONTEXT SINGLETON
// Prevents memory leaks from creating multiple contexts (mobile Safari limit)
// ============================================================================

let sharedAudioContext: AudioContext | null = null;

/**
 * Get or create the shared AudioContext instance
 * Uses lazy initialization to ensure it's created after user interaction
 */
function getSharedAudioContext(): AudioContext {
    if (!sharedAudioContext) {
        sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume();
    }
    return sharedAudioContext;
}

/**
 * Core beep function using the shared context
 */
function playBeep(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2): void {
    try {
        const ctx = getSharedAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
        // Silent fail - audio not critical
    }
}

/**
 * Haptic feedback utility
 */
function vibrate(pattern: number | number[]): void {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

/**
 * Speak a number using speech synthesis
 */
function speakNumber(num: number, lang: 'en' | 'sk' | 'uk' | 'ru'): void {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(`${num}`);

    // Map language codes to BCP 47 tags
    const langMap: Record<string, string> = {
        en: 'en-US',
        sk: 'sk-SK',
        uk: 'uk-UA',
        ru: 'ru-RU',
    };

    utterance.lang = langMap[lang] || 'en-US';
    utterance.rate = 1.1;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function GameAudioPlayer({ gameState }: GameAudioPlayerProps) {
    const lastNumberRef = useRef<number | null>(null);
    const lastPhaseRef = useRef<string | null>(null);

    const playVictorySound = useCallback(() => {
        const { frequencies, duration, type } = SOUNDS.bingo;
        frequencies.forEach((freq, i) => {
            setTimeout(() => playBeep(freq, duration, type, 0.3), i * 150);
        });
        vibrate([100, 50, 100, 50, 200]);
    }, []);

    useEffect(() => {
        if (!gameState) return;

        // Number called - play sound and speak
        if (gameState.currentNumber !== lastNumberRef.current && gameState.currentNumber !== null) {
            if (gameState.phase === 'playing') {
                playBeep(SOUNDS.numberCall.frequency, SOUNDS.numberCall.duration, SOUNDS.numberCall.type, 0.3);
                vibrate(100);
                speakNumber(gameState.currentNumber, gameState.settings.language);
            }
            lastNumberRef.current = gameState.currentNumber;
        }

        // Winner detected - play victory
        if (gameState.phase === 'finished' && lastPhaseRef.current !== 'finished') {
            playVictorySound();
        }

        // Track phase
        lastPhaseRef.current = gameState.phase;

        // Reset on game restart
        if (gameState.currentNumber === null) {
            lastNumberRef.current = null;
        }

    }, [gameState?.currentNumber, gameState?.phase, gameState?.settings.language, playVictorySound]);

    return null; // Invisible component
}

// ============================================================================
// EXPORTED SOUND UTILITIES
// All use the shared audio context to prevent memory leaks
// ============================================================================

/** Sound for marking a cell */
export function playCellMarkSound(): void {
    playBeep(SOUNDS.cellMark.frequency, SOUNDS.cellMark.duration, SOUNDS.cellMark.type, 0.2);
    vibrate(30);
}

/** Generic UI click sound */
export function playClickSound(): void {
    playBeep(SOUNDS.click.frequency, SOUNDS.click.duration, SOUNDS.click.type, 0.1);
}

/** Error/mistake sound */
export function playErrorSound(): void {
    playBeep(SOUNDS.error.frequency, SOUNDS.error.duration, SOUNDS.error.type, 0.2);
    vibrate(200);
}

/** Victory fanfare */
export function playVictoryFanfare(): void {
    const { frequencies, duration, type } = SOUNDS.bingo;
    frequencies.forEach((freq, i) => {
        setTimeout(() => playBeep(freq, duration, type, 0.2), i * 150);
    });
    vibrate([100, 50, 100, 50, 200]);
}

/** Alias for victory fanfare */
export function playWinSound(): void {
    playVictoryFanfare();
}

/** Sad descending sound for loss */
export function playLossSound(): void {
    try {
        const ctx = getSharedAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.8);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.8);
    } catch (e) {
        // Silent
    }
}

/** Ice shatter effect for freeze */
export function playFreezeSound(): void {
    const ctx = getSharedAudioContext();
    [2000, 2500, 3000, 4000].forEach((freq, i) => {
        try {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);

            gainNode.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.1);

            oscillator.start(ctx.currentTime + i * 0.05);
            oscillator.stop(ctx.currentTime + i * 0.05 + 0.1);
        } catch (e) {
            // Silent
        }
    });
    vibrate([30, 30, 30]);
}

/** Splat sound for ink */
export function playSplatSound(): void {
    try {
        const ctx = getSharedAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);

        vibrate(50);
    } catch (e) {
        // Silent
    }
}

/** Bonus chime for speed marks */
export function playBonusSound(): void {
    try {
        const ctx = getSharedAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
        // Silent
    }
}
