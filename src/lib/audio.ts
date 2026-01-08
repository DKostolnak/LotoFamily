'use client';

/**
 * Audio Service
 * 
 * Centralized audio management for the Loto game.
 * Handles sound effects, speech synthesis, and haptic feedback.
 * 
 * Uses Web Audio API for precise, low-latency sound generation.
 * Respects user mute preferences stored in localStorage.
 */

import { vibrateIfAllowed } from '@/lib/battery';

// ============================================================================
// TYPES
// ============================================================================

export interface SoundConfig {
    frequency: number;
    duration: number;
    type: OscillatorType;
}

export interface ChordConfig {
    frequencies: number[];
    duration: number;
    type: OscillatorType;
}

export type SoundName =
    | 'numberCall'
    | 'cellMark'
    | 'flatClaim'
    | 'error'
    | 'click';

export type ChordName = 'bingo';

// ============================================================================
// SOUND DEFINITIONS
// ============================================================================

/**
 * Predefined sound effect configurations.
 * Each sound is defined by its frequency, duration (ms), and oscillator type.
 */
export const SOUNDS: Record<SoundName, SoundConfig> = {
    numberCall: { frequency: 440, duration: 200, type: 'sine' },
    cellMark: { frequency: 880, duration: 100, type: 'sine' },
    flatClaim: { frequency: 523, duration: 300, type: 'triangle' },
    error: { frequency: 200, duration: 150, type: 'sawtooth' },
    click: { frequency: 1200, duration: 50, type: 'sine' },
};

/**
 * Chord definitions (multiple frequencies played in sequence)
 */
export const CHORDS: Record<ChordName, ChordConfig> = {
    bingo: { frequencies: [523, 659, 784, 1047], duration: 150, type: 'sine' },
};

// ============================================================================
// AUDIO CONTEXT MANAGEMENT
// ============================================================================

/** Shared AudioContext instance - reused for all sounds */
let m_sharedAudioContext: AudioContext | null = null;

/** Global mute state */
let m_isMuted = false;

// Initialize mute state from localStorage on module load
if (typeof window !== 'undefined') {
    m_isMuted = window.localStorage.getItem('loto_muted') === 'true';
}

/**
 * Resolves the appropriate AudioContext constructor for the current browser.
 * Handles webkit prefix for older Safari versions.
 */
function resolveAudioContextConstructor(): typeof AudioContext {
    const globalWindow = window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
    };

    if (typeof globalWindow.AudioContext === 'function') {
        return globalWindow.AudioContext;
    }

    if (globalWindow.webkitAudioContext) {
        return globalWindow.webkitAudioContext;
    }

    throw new Error('AudioContext is not supported in this browser');
}

/**
 * Gets or creates the shared AudioContext instance.
 * Automatically resumes if suspended (required after user interaction).
 */
function getSharedAudioContext(): AudioContext {
    if (!m_sharedAudioContext) {
        const AudioContextConstructor = resolveAudioContextConstructor();
        m_sharedAudioContext = new AudioContextConstructor();
    }

    if (m_sharedAudioContext.state === 'suspended') {
        void m_sharedAudioContext.resume();
    }

    return m_sharedAudioContext;
}

// ============================================================================
// LOW-LEVEL AUDIO FUNCTIONS
// ============================================================================

/**
 * Plays a single beep tone with the specified parameters.
 * 
 * @param frequency - Frequency in Hz
 * @param durationMs - Duration in milliseconds
 * @param type - Oscillator wave type
 * @param volume - Volume level (0-1)
 */
export function playBeep(
    frequency: number,
    durationMs: number,
    type: OscillatorType = 'sine',
    volume: number = 0.2
): void {
    if (m_isMuted) return;

    try {
        const ctx = getSharedAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        const durationSec = durationMs / 1000;
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationSec);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + durationSec);
    } catch {
        // Silent fail - audio is not critical functionality
    }
}

/**
 * Plays a frequency sweep effect (frequency changes over time).
 * Used for win/loss sounds.
 */
function playFrequencySweep(
    startFrequency: number,
    endFrequency: number,
    durationMs: number,
    type: OscillatorType,
    volume: number
): void {
    if (m_isMuted) return;

    try {
        const ctx = getSharedAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        const durationSec = durationMs / 1000;

        oscillator.frequency.setValueAtTime(startFrequency, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(endFrequency, ctx.currentTime + durationSec);

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + durationSec);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + durationSec);
    } catch {
        // Silent fail
    }
}

// ============================================================================
// PUBLIC API - MUTE CONTROL
// ============================================================================

/**
 * Checks if audio is currently muted.
 */
export function isMuted(): boolean {
    return m_isMuted;
}

/**
 * Toggles the mute state and persists to localStorage.
 * @returns The new mute state (true = muted)
 */
export function toggleMute(): boolean {
    m_isMuted = !m_isMuted;

    if (typeof window !== 'undefined') {
        window.localStorage.setItem('loto_muted', String(m_isMuted));
    }

    return m_isMuted;
}

/**
 * Sets the mute state directly.
 * @param muted - Whether audio should be muted
 */
export function setMuted(muted: boolean): void {
    m_isMuted = muted;

    if (typeof window !== 'undefined') {
        window.localStorage.setItem('loto_muted', String(m_isMuted));
    }
}

// ============================================================================
// PUBLIC API - HAPTIC FEEDBACK
// ============================================================================

/**
 * Triggers haptic feedback (vibration) if allowed by user preferences.
 * @param pattern - Single duration or pattern of durations in ms
 */
export function vibrate(pattern: number | number[]): void {
    vibrateIfAllowed(pattern);
}

// ============================================================================
// PUBLIC API - SPEECH SYNTHESIS
// ============================================================================

type SupportedLanguage = 'en' | 'sk' | 'uk' | 'ru';

const LANGUAGE_CODES: Record<SupportedLanguage, string> = {
    en: 'en-US',
    sk: 'sk-SK',
    uk: 'uk-UA',
    ru: 'ru-RU',
};

/**
 * Speaks a number using the browser's speech synthesis API.
 * @param num - The number to speak
 * @param lang - Language code
 */
export function speakNumber(num: number, lang: SupportedLanguage): void {
    if (m_isMuted) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(`${num}`);
    utterance.lang = LANGUAGE_CODES[lang] || LANGUAGE_CODES.en;
    utterance.rate = 1.1;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}

// ============================================================================
// PUBLIC API - SOUND EFFECTS
// ============================================================================

/**
 * Plays the cell mark sound effect with haptic feedback.
 * Used when player marks a number on their card.
 */
export function playCellMarkSound(): void {
    const { frequency, duration, type } = SOUNDS.cellMark;
    playBeep(frequency, duration, type, 0.2);
    vibrate(30);
}

/**
 * Plays a short click sound for UI interactions.
 */
export function playClickSound(): void {
    const { frequency, duration, type } = SOUNDS.click;
    playBeep(frequency, duration, type, 0.1);
}

/**
 * Plays an error sound with strong haptic feedback.
 * Used for invalid actions (wrong mark, etc.)
 */
export function playErrorSound(): void {
    const { frequency, duration, type } = SOUNDS.error;
    playBeep(frequency, duration, type, 0.2);
    vibrate(200);
}

/**
 * Plays the victory fanfare - ascending arpeggio with celebratory haptics.
 * Used when a player wins.
 */
export function playVictoryFanfare(): void {
    const { frequencies, duration, type } = CHORDS.bingo;

    frequencies.forEach((freq, index) => {
        setTimeout(() => playBeep(freq, duration, type, 0.2), index * 150);
    });

    vibrate([100, 50, 100, 50, 200]);
}

/**
 * Alias for playVictoryFanfare - for semantic clarity.
 */
export function playWinSound(): void {
    playVictoryFanfare();
}

/**
 * Plays a descending "wah-wah" loss sound.
 * Used when another player wins.
 */
export function playLossSound(): void {
    playFrequencySweep(400, 100, 800, 'sawtooth', 0.2);
}

/**
 * Plays a bonus/power-up sound effect.
 * Used for flat claims and special events.
 */
export function playBonusSound(): void {
    if (m_isMuted) return;

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
        // Silent fail
    }
}

/**
 * Plays the number call sound effect.
 * Used when a new number is called.
 */
export function playNumberCallSound(): void {
    const { frequency, duration, type } = SOUNDS.numberCall;
    playBeep(frequency, duration, type, 0.15);
}

/**
 * Plays the flat claim sound effect.
 * Used when a player claims a flat (row completion).
 */
export function playFlatClaimSound(): void {
    const { frequency, duration, type } = SOUNDS.flatClaim;
    playBeep(frequency, duration, type, 0.2);
    vibrate([50, 30, 50]);
}
