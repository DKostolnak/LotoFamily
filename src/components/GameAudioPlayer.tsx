'use client';

import { useEffect, useRef, useCallback } from 'react';
import { GameState } from '@/lib/types';
import { vibrateIfAllowed } from '@/lib/battery';

interface GameAudioPlayerProps {
    gameState: GameState | null;
    onCellMark?: () => void;
}

const SOUNDS = {
    numberCall: { frequency: 440, duration: 200, type: 'sine' as OscillatorType },
    cellMark: { frequency: 880, duration: 100, type: 'sine' as OscillatorType },
    flatClaim: { frequency: 523, duration: 300, type: 'triangle' as OscillatorType },
    bingo: { frequencies: [523, 659, 784, 1047], duration: 150, type: 'sine' as OscillatorType },
    error: { frequency: 200, duration: 150, type: 'sawtooth' as OscillatorType },
    click: { frequency: 1200, duration: 50, type: 'sine' as OscillatorType },
};

let sharedAudioContext: AudioContext | null = null;

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
    } catch {
        // Silent fail - audio not critical
    }
}

function vibrate(pattern: number | number[]): void {
    vibrateIfAllowed(pattern);
}

function speakNumber(num: number, lang: 'en' | 'sk' | 'uk' | 'ru'): void {
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

export default function GameAudioPlayer({ gameState }: GameAudioPlayerProps) {
    const lastNumberRef = useRef<number | null>(null);
    const lastPhaseRef = useRef<string | null>(null);

    const playVictorySound = useCallback(() => {
        const { frequencies, duration, type } = SOUNDS.bingo;
        frequencies.forEach((freq, index) => {
            setTimeout(() => playBeep(freq, duration, type, 0.3), index * 150);
        });
        vibrate([100, 50, 100, 50, 200]);
    }, []);

    useEffect(() => {
        if (!gameState) return;

        if (gameState.currentNumber !== lastNumberRef.current && gameState.currentNumber !== null) {
            if (gameState.phase === 'playing') {
                playBeep(SOUNDS.numberCall.frequency, SOUNDS.numberCall.duration, SOUNDS.numberCall.type, 0.3);
                vibrate(100);
                speakNumber(gameState.currentNumber, gameState.settings.language);
            }
            lastNumberRef.current = gameState.currentNumber;
        }

        if (gameState.phase === 'finished' && lastPhaseRef.current !== 'finished') {
            playVictorySound();
        }

        lastPhaseRef.current = gameState.phase;

        if (gameState.currentNumber === null) {
            lastNumberRef.current = null;
        }

    }, [gameState, playVictorySound]);

    return null;
}

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

export function playFreezeSound(): void {
    const ctx = getSharedAudioContext();
    [2000, 2500, 3000, 4000].forEach((freq, index) => {
        try {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.05);

            gainNode.gain.setValueAtTime(0.1, ctx.currentTime + index * 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.05 + 0.1);

            oscillator.start(ctx.currentTime + index * 0.05);
            oscillator.stop(ctx.currentTime + index * 0.05 + 0.1);
        } catch {
            // Silent
        }
    });
    vibrate([30, 30, 30]);
}

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
    } catch {
        // Silent
    }
}

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
    } catch {
        // Silent
    }
}

