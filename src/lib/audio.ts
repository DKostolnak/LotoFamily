'use client';

// Sound definitions and types
export const SOUNDS = {
    numberCall: { frequency: 440, duration: 200, type: 'sine' as OscillatorType },
    cellMark: { frequency: 880, duration: 100, type: 'sine' as OscillatorType },
    flatClaim: { frequency: 523, duration: 300, type: 'triangle' as OscillatorType },
    bingo: { frequencies: [523, 659, 784, 1047], duration: 150, type: 'sine' as OscillatorType },
    error: { frequency: 200, duration: 150, type: 'sawtooth' as OscillatorType },
    click: { frequency: 1200, duration: 50, type: 'sine' as OscillatorType },
};

// Global audio state
let sharedAudioContext: AudioContext | null = null;
let globalMuted = false;

// Initialize mute state from localStorage if available
if (typeof window !== 'undefined') {
    globalMuted = window.localStorage.getItem('loto_muted') === 'true';
}

// Battery saver / Vibration helper
import { vibrateIfAllowed } from '@/lib/battery';

type AudioContextCtor = typeof AudioContext;

function resolveAudioContext(): AudioContextCtor {
    const globalWindow = window as typeof window & {
        webkitAudioContext?: AudioContextCtor;
    };

    if (typeof globalWindow.AudioContext === 'function') {
        return globalWindow.AudioContext;
    }

    if (globalWindow.webkitAudioContext) {
        return globalWindow.webkitAudioContext;
    }

    throw new Error('AudioContext is not supported');
}

function getSharedAudioContext(): AudioContext {
    if (!sharedAudioContext) {
        const AudioContextConstructor = resolveAudioContext();
        sharedAudioContext = new AudioContextConstructor();
    }
    if (sharedAudioContext.state === 'suspended') {
        void sharedAudioContext.resume();
    }
    return sharedAudioContext;
}

// Low-level beep function
export function playBeep(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2): void {
    if (globalMuted) return;
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
    } catch {
        // Silent fail - audio not critical
    }
}

// Utility Exports

export function isMuted(): boolean {
    return globalMuted;
}

export function toggleMute(): boolean {
    globalMuted = !globalMuted;
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('loto_muted', String(globalMuted));
    }
    return globalMuted;
}

export function vibrate(pattern: number | number[]): void {
    vibrateIfAllowed(pattern);
}

export function speakNumber(num: number, lang: 'en' | 'sk' | 'uk' | 'ru'): void {
    if (globalMuted) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(`${num}`);

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

// Sound Effects

export function playCellMarkSound(): void {
    playBeep(SOUNDS.cellMark.frequency, SOUNDS.cellMark.duration, SOUNDS.cellMark.type, 0.2);
    vibrate(30);
}

export function playClickSound(): void {
    playBeep(SOUNDS.click.frequency, SOUNDS.click.duration, SOUNDS.click.type, 0.1);
}

export function playErrorSound(): void {
    playBeep(SOUNDS.error.frequency, SOUNDS.error.duration, SOUNDS.error.type, 0.2);
    vibrate(200);
}

export function playVictoryFanfare(): void {
    const { frequencies, duration, type } = SOUNDS.bingo;
    frequencies.forEach((freq, index) => {
        setTimeout(() => playBeep(freq, duration, type, 0.2), index * 150);
    });
    vibrate([100, 50, 100, 50, 200]);
}

export function playWinSound(): void {
    playVictoryFanfare();
}

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
    } catch {
        // Silent
    }
}

export function playBonusSound(): void {
    if (globalMuted) return;
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
    } catch {
        // Silent
    }
}
