'use client';

/**
 * Audio Service
 * 
 * Centralized audio management for the Loto game.
 * Handles sound effects, speech synthesis, and haptic feedback.
 * 
 * Uses Web Audio API for precise, low-latency sound generation.
 * Respects user mute preferences stored in localStorage.
 * 
 * IMPORTANT: Call initAudioContext() on the first user interaction
 * to unlock audio playback on iOS and Chrome.
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

/** Whether the audio context has been initialized by user gesture */
let m_isAudioInitialized = false;

/** Global mute state */
let m_isMuted = false;

// Initialize mute state from localStorage on module load
if (typeof window !== 'undefined') {
    m_isMuted = window.localStorage.getItem('loto_muted') === 'true';

    // iOS Safari: AudioContext gets suspended when app goes to background
    // Listen for visibility changes and resume audio when app comes back
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && m_sharedAudioContext) {
            // App is now visible, try to resume audio
            if (m_sharedAudioContext.state === 'suspended') {
                m_sharedAudioContext.resume().catch(() => {
                    // Will resume on next user interaction
                });
            }
        }
    });

    // Also handle iOS-specific events
    window.addEventListener('pageshow', () => {
        if (m_sharedAudioContext && m_sharedAudioContext.state === 'suspended') {
            m_sharedAudioContext.resume().catch(() => { });
        }
    });
}

/**
 * Resolves the appropriate AudioContext constructor for the current browser.
 * Handles webkit prefix for older Safari versions.
 */
function resolveAudioContextConstructor(): typeof AudioContext | null {
    if (typeof window === 'undefined') return null;

    const globalWindow = window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
    };

    if (typeof globalWindow.AudioContext === 'function') {
        return globalWindow.AudioContext;
    }

    if (globalWindow.webkitAudioContext) {
        return globalWindow.webkitAudioContext;
    }

    return null;
}

/**
 * IMPORTANT: Call this function on the FIRST user interaction (click/tap).
 * This is required to unlock audio playback on iOS and Chrome.
 * 
 * Best placed on a button click handler, game start, or similar user action.
 */
export function initAudioContext(): boolean {
    if (typeof window === 'undefined') return false;
    if (m_isAudioInitialized && m_sharedAudioContext) return true;

    try {
        const AudioContextConstructor = resolveAudioContextConstructor();
        if (!AudioContextConstructor) {
            console.warn('AudioContext not supported in this browser');
            return false;
        }

        // Create context if not exists
        if (!m_sharedAudioContext) {
            m_sharedAudioContext = new AudioContextConstructor();
        }

        // Resume if suspended (required by autoplay policies)
        if (m_sharedAudioContext.state === 'suspended') {
            m_sharedAudioContext.resume().then(() => {
                m_isAudioInitialized = true;
            }).catch(() => {
                // Silently fail
            });
        } else {
            m_isAudioInitialized = true;
        }

        // iOS Safari workaround: Play a silent buffer to unlock audio
        // This is required because iOS requires audio to be triggered by user gesture
        const silentBuffer = m_sharedAudioContext.createBuffer(1, 1, 22050);
        const source = m_sharedAudioContext.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(m_sharedAudioContext.destination);
        source.start(0);

        return true;
    } catch (error) {
        console.warn('Failed to initialize audio context:', error);
        return false;
    }
}

/**
 * Gets the shared AudioContext instance.
 * Will attempt to initialize if not yet done, but may not work without user gesture.
 */
function getSharedAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    // If not initialized, try to create (may not work without user gesture)
    if (!m_sharedAudioContext) {
        const AudioContextConstructor = resolveAudioContextConstructor();
        if (!AudioContextConstructor) return null;

        try {
            m_sharedAudioContext = new AudioContextConstructor();
        } catch {
            return null;
        }
    }

    // Attempt to resume if suspended
    if (m_sharedAudioContext.state === 'suspended') {
        m_sharedAudioContext.resume().catch(() => {
            // Silently fail - will try again on next user interaction
        });
    }

    return m_sharedAudioContext;
}

/**
 * Checks if audio is ready to play.
 */
export function isAudioReady(): boolean {
    return m_isAudioInitialized &&
        m_sharedAudioContext !== null &&
        m_sharedAudioContext.state === 'running';
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

    const ctx = getSharedAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
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

    const ctx = getSharedAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
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

    // If unmuting, try to initialize audio context
    if (!m_isMuted) {
        initAudioContext();
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

    // If unmuting, try to initialize audio context
    if (!muted) {
        initAudioContext();
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
    if (typeof window === 'undefined') return;
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
 * Also initializes audio context if needed (click = user gesture).
 */
export function playClickSound(): void {
    // Click is a user gesture - good opportunity to init audio
    initAudioContext();

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

    const ctx = getSharedAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
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
