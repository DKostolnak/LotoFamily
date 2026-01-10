'use client';

/**
 * Audio Service
 * 
 * Centralized audio management for the Loto game.
 * Refactored to use a Singleton Class pattern for better state encapsulation (SOLID).
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

export type SoundName = 'numberCall' | 'cellMark' | 'flatClaim' | 'error' | 'click';
export type ChordName = 'bingo';
export type SupportedLanguage = 'en' | 'sk' | 'uk' | 'ru';

// ============================================================================
// CONSTANTS
// ============================================================================

export const SOUNDS: Record<SoundName, SoundConfig> = {
    numberCall: { frequency: 440, duration: 200, type: 'sine' },
    cellMark: { frequency: 880, duration: 100, type: 'sine' },
    flatClaim: { frequency: 523, duration: 300, type: 'triangle' },
    error: { frequency: 200, duration: 150, type: 'sawtooth' },
    click: { frequency: 1200, duration: 50, type: 'sine' },
};

export const CHORDS: Record<ChordName, ChordConfig> = {
    bingo: { frequencies: [523, 659, 784, 1047], duration: 150, type: 'sine' },
};

const LANGUAGE_CODES: Record<SupportedLanguage, string> = {
    en: 'en-US',
    sk: 'sk-SK',
    uk: 'uk-UA',
    ru: 'ru-RU',
};

const MUTE_STORAGE_KEY = 'loto_muted';
const VOICE_MUTE_STORAGE_KEY = 'loto_voice_muted';

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class AudioService {
    private static instance: AudioService;
    private context: AudioContext | null = null;
    private isInitialized = false;
    private _isMuted = false;
    private _isVoiceMuted = false;

    private constructor() {
        if (typeof window !== 'undefined') {
            this._isMuted = window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
            this._isVoiceMuted = window.localStorage.getItem(VOICE_MUTE_STORAGE_KEY) === 'true';
            this.setupLifecycleListeners();
        }
    }

    public static getInstance(): AudioService {
        if (!AudioService.instance) {
            AudioService.instance = new AudioService();
        }
        return AudioService.instance;
    }

    // --- Lifecycle & Context Management ---

    private setupLifecycleListeners() {
        // Resume context on visibility change (iOS/Chrome policies)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.resumeContext();
            }
        });

        // iOS specific
        window.addEventListener('pageshow', () => {
            this.resumeContext();
        });
    }

    private resolveContextConstructor(): typeof AudioContext | null {
        if (typeof window === 'undefined') return null;
        const w = window as any;
        return w.AudioContext || w.webkitAudioContext || null;
    }

    public initialize(): boolean {
        if (typeof window === 'undefined') return false;
        if (this.isInitialized && this.context) return true;

        try {
            const Ctor = this.resolveContextConstructor();
            if (!Ctor) return false;

            if (!this.context) {
                this.context = new Ctor();
            }

            this.resumeContext().then(() => {
                this.isInitialized = true;
            });

            // Unlock iOS audio with silent buffer
            const buffer = this.context.createBuffer(1, 1, 22050);
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.context.destination);
            source.start(0);

            return true;
        } catch (e) {
            console.warn('Audio Init Failed', e);
            return false;
        }
    }

    private async resumeContext() {
        if (this.context && this.context.state === 'suspended') {
            try {
                await this.context.resume();
            } catch { /* ignore */ }
        }
    }

    public get isReady(): boolean {
        return this.isInitialized && this.context?.state === 'running';
    }

    // --- Mute Control ---

    public get isMuted(): boolean {
        return this._isMuted;
    }

    public get isVoiceMuted(): boolean {
        return this._isVoiceMuted;
    }

    public setMuted(muted: boolean) {
        this._isMuted = muted;
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
        }
        if (!muted) this.initialize();
    }

    public setVoiceMuted(muted: boolean) {
        this._isVoiceMuted = muted;
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(VOICE_MUTE_STORAGE_KEY, String(muted));
        }
    }

    public toggleMute(): boolean {
        this.setMuted(!this._isMuted);
        return this._isMuted;
    }

    public toggleVoiceMute(): boolean {
        this.setVoiceMuted(!this._isVoiceMuted);
        return this._isVoiceMuted;
    }

    // --- Haptics ---

    public vibrate(pattern: number | number[]) {
        vibrateIfAllowed(pattern);
    }

    // --- Sound Generation ---

    private playTone(freq: number, durationMs: number, type: OscillatorType, volume: number) {
        if (this._isMuted || !this.context) return;
        this.resumeContext(); // Ensure active

        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.connect(gain);
            gain.connect(this.context.destination);

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.context.currentTime);

            const durationSec = durationMs / 1000;
            gain.gain.setValueAtTime(volume, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + durationSec);

            osc.start(this.context.currentTime);
            osc.stop(this.context.currentTime + durationSec);
        } catch { /* ignore */ }
    }

    private playSweep(startFreq: number, endFreq: number, durationMs: number, type: OscillatorType, volume: number) {
        if (this._isMuted || !this.context) return;

        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.connect(gain);
            gain.connect(this.context.destination);

            osc.type = type;
            const durationSec = durationMs / 1000;

            osc.frequency.setValueAtTime(startFreq, this.context.currentTime);
            osc.frequency.linearRampToValueAtTime(endFreq, this.context.currentTime + durationSec);

            gain.gain.setValueAtTime(volume, this.context.currentTime);
            gain.gain.linearRampToValueAtTime(0, this.context.currentTime + durationSec);

            osc.start(this.context.currentTime);
            osc.stop(this.context.currentTime + durationSec);
        } catch { /* ignore */ }
    }

    // --- Specific Sounds ---

    public playBeep(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.2) {
        this.playTone(freq, duration, type, volume);
    }

    public speakNumber(num: number, lang: SupportedLanguage) {
        // Check global mute AND voice specific mute
        if (this._isMuted || this._isVoiceMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`${num}`);
        utterance.lang = LANGUAGE_CODES[lang] || LANGUAGE_CODES.en;
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    }

    public playClick() {
        this.initialize(); // Click is a gesture
        const { frequency, duration, type } = SOUNDS.click;
        this.playTone(frequency, duration, type, 0.1);
    }

    public playBallCall() {
        const { frequency, duration, type } = SOUNDS.numberCall;
        this.playTone(frequency, duration, type, 0.15);
    }

    public playMark() {
        const { frequency, duration, type } = SOUNDS.cellMark;
        this.playTone(frequency, duration, type, 0.2);
        this.vibrate(30);
    }

    public playError() {
        const { frequency, duration, type } = SOUNDS.error;
        this.playTone(frequency, duration, type, 0.2);
        this.vibrate(200);
    }

    public playFlat() {
        const { frequency, duration, type } = SOUNDS.flatClaim;
        this.playTone(frequency, duration, type, 0.2);
        this.vibrate([50, 30, 50]);
    }

    public playCrowdCheer() {
        if (this._isMuted || !this.context) return;
        this.resumeContext();

        try {
            // White noise buffer for "crowd" texture
            const bufferSize = this.context.sampleRate * 3; // 3 seconds
            const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            // Create noise source
            const noise = this.context.createBufferSource();
            noise.buffer = buffer;

            // Filter to make it sound like a crowd (bandpass)
            const filter = this.context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1000;

            // Envelope for fade in/out
            const gain = this.context.createGain();
            gain.gain.setValueAtTime(0, this.context.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.5); // Fade in
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 3); // Fade out

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.context.destination);

            noise.start(this.context.currentTime);

            // Add some "whistles" (high pitched sine waves)
            this.playTone(1500, 200, 'sine', 0.1);
            setTimeout(() => this.playTone(1800, 300, 'triangle', 0.1), 300);
            setTimeout(() => this.playTone(2000, 150, 'sine', 0.1), 800);

        } catch { /* ignore */ }
    }

    public playVictory() {
        const { frequencies, duration, type } = CHORDS.bingo;
        if (!this.context) return;

        // Play the fanfare melody
        frequencies.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, duration, type, 0.25), i * 150);
        });

        // Trigger vibration pattern
        this.vibrate([100, 50, 100, 50, 200]);

        // Start crowd cheer slightly after fanfare starts
        setTimeout(() => this.playCrowdCheer(), 300);
    }

    public playLoss() {
        this.playSweep(400, 100, 800, 'sawtooth', 0.2);
    }

    public playBonus() {
        if (this._isMuted || !this.context) return;
        this.resumeContext();

        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.connect(gain);
            gain.connect(this.context.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.3);

            gain.gain.setValueAtTime(0.2, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

            osc.start(this.context.currentTime);
            osc.stop(this.context.currentTime + 0.3);
        } catch { /* ignore */ }
    }
}

// ============================================================================
// EXPORTS (FACADE FOR BACKWARD COMPATIBILITY)
// ============================================================================

/** Singleton instance of the AudioService */
export const audioService = AudioService.getInstance();

/** Initialize the audio context on first user interaction */
export const initAudioContext = () => audioService.initialize();

/** Check if audio context is ready */
export const isAudioReady = () => audioService.isReady;

/** Check if audio is currently muted */
export const isMuted = () => audioService.isMuted;

/** Toggle mute state and return new state (true = muted) */
export const toggleMute = () => audioService.toggleMute();

/** Set mute state explicitly */
export const setMuted = (muted: boolean) => audioService.setMuted(muted);

/** Check if voice is currently muted */
export const isVoiceMuted = () => audioService.isVoiceMuted;

/** Toggle voice mute state */
export const toggleVoiceMute = () => audioService.toggleVoiceMute();

/** Set voice mute state explicitly */
export const setVoiceMuted = (muted: boolean) => audioService.setVoiceMuted(muted);

/** Trigger device vibration if allowed */
export const vibrate = (pattern: number | number[]) => audioService.vibrate(pattern);

/** Play UI click sound effect */
export const playClickSound = () => audioService.playClick();

/** Play number call announcement sound */
export const playNumberCallSound = () => audioService.playBallCall();

/** Play cell mark confirmation sound */
export const playCellMarkSound = () => audioService.playMark();

/** Play error feedback sound */
export const playErrorSound = () => audioService.playError();

/** Play flat claim celebration sound */
export const playFlatClaimSound = () => audioService.playFlat();

/** Play victory fanfare for winning */
export const playVictoryFanfare = () => audioService.playVictory();

/** Alias for playVictoryFanfare */
export const playWinSound = () => audioService.playVictory();

/** Play loss/game over sound */
export const playLossSound = () => audioService.playLoss();

/** Play bonus reward sound (e.g., daily bonus) */
export const playBonusSound = () => audioService.playBonus();

/**
 * Use text-to-speech to announce a number
 * @param num - The number to speak
 * @param lang - Language code ('en', 'sk', 'uk', 'ru')
 */
export const speakNumber = (num: number, lang: SupportedLanguage) => audioService.speakNumber(num, lang);

/**
 * Play a custom beep sound
 * @param frequency - Frequency in Hz
 * @param duration - Duration in milliseconds
 * @param type - Oscillator type
 * @param volume - Optional volume (0-1)
 */
export const playBeep = (f: number, d: number, t: OscillatorType, v?: number) => audioService.playBeep(f, d, t, v);
