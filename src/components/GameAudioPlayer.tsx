'use client';

import { useEffect, useRef, useCallback } from 'react';
import { GameState } from '@/lib/types';
import { SOUNDS, playBeep, vibrate, speakNumber } from '@/lib/audio';

interface GameAudioPlayerProps {
    gameState: GameState | null;
    onCellMark?: () => void;
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

// Re-export utility functions from lib/audio for backward compatibility if needed,
// but preferred way is to import from lib/audio directly.
export {
    playCellMarkSound,
    playClickSound,
    playErrorSound,
    playVictoryFanfare,
    playWinSound,
    playLossSound,
    playBonusSound,
    isMuted,
    toggleMute
} from '@/lib/audio';

