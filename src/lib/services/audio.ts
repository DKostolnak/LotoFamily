import * as Speech from 'expo-speech';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

export type SoundEffect = 'chip' | 'win' | 'call' | 'error' | 'pop';

class AudioService {
    private static instance: AudioService;
    private isMuted: boolean = false;
    private isSpeechEnabled: boolean = true;
    private language: string = 'en-US';
    private sounds: Map<SoundEffect, AudioPlayer> = new Map();
    private isInitialized: boolean = false;

    private constructor() { }

    public static getInstance(): AudioService {
        if (!AudioService.instance) {
            AudioService.instance = new AudioService();
        }
        return AudioService.instance;
    }

    /**
     * Initialize audio session (important for iOS/Android)
     * This ensures audio plays correctly even in silent mode if intended.
     * Safe to call multiple times - only initializes once.
     */
    public async initialize() {
        if (this.isInitialized) return; // Guard against double initialization

        try {
            await setAudioModeAsync({
                allowsRecording: false,
                playsInSilentMode: true,
                shouldPlayInBackground: false,
                shouldRouteThroughEarpiece: false,
                interruptionMode: 'duckOthers',
            });
            await this.loadSounds();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    private async loadSounds() {
        // Map sound types to asset paths
        // NOTE: Sound assets are currently missing from the assets/sounds folder.
        // Commented out to prevent build errors. Add the files to restore audio.
        const soundAssets: Partial<Record<SoundEffect, any>> = {
            // chip: require('../../../assets/sounds/chip_place.mp3'),
            // win: require('../../../assets/sounds/win_fanfare.mp3'),
            // call: require('../../../assets/sounds/number_call.mp3'),
            // error: require('../../../assets/sounds/error_buzz.mp3'),
            // pop: require('../../../assets/sounds/pop.mp3'),
        };

        for (const [key, asset] of Object.entries(soundAssets)) {
            try {
                const player = createAudioPlayer(asset);
                this.sounds.set(key as SoundEffect, player);
            } catch (e) {
                // Silently fail if asset doesn't exist yet
                console.warn(`Could not load sound: ${key}. Asset may be missing.`);
            }
        }
    }

    public setMuted(muted: boolean) {
        this.isMuted = muted;
        if (muted) {
            Speech.stop();
        }
        // Mute/unmute all loaded sounds
        this.sounds.forEach((player) => {
            try {
                player.muted = muted;
            } catch (e) { }
        });
    }

    public setSpeechEnabled(enabled: boolean) {
        this.isSpeechEnabled = enabled;
    }

    /**
     * Play a pre-loaded sound effect with low latency
     */
    public async playSound(effect: SoundEffect) {
        if (this.isMuted) return;

        const player = this.sounds.get(effect);
        if (player) {
            try {
                // Replay from start if already playing
                player.seekTo(0);
                player.play();
            } catch (e) {
                console.warn(`Failed to play sound: ${effect}`, e);
            }
        }
    }

    /**
     * Speak text using Native Text-to-Speech
     */
    public speak(text: string, options: Speech.SpeechOptions = {}) {
        if (this.isMuted || !this.isSpeechEnabled) return;

        Speech.stop();
        Speech.speak(text, {
            language: this.language,
            rate: 1.0,
            pitch: 1.0,
            ...options
        });
    }

    public async playBonusSound() {
        await this.playSound('pop');
    }

    public stopAll() {
        Speech.stop();
        this.sounds.forEach((player) => {
            try {
                player.pause();
                player.seekTo(0);
            } catch (e) { }
        });
    }

    /**
     * Release all audio players. Call on app teardown.
     */
    public unload() {
        this.sounds.forEach((player) => {
            try {
                player.remove();
            } catch (e) { }
        });
        this.sounds.clear();
        this.isInitialized = false;
    }
}

export const audioService = AudioService.getInstance();
