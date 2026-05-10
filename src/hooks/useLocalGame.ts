/**
 * useLocalGame - Offline game state management
 * 
 * Uses the ported game engine for local single-player or practice mode.
 * No server connection required - all state is managed locally.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
    createGame,
    callNextNumber,
    startGame as startGameEngine,
    checkForWinners,
    setWinner,
    claimFlat,
    pauseGame as pauseGameEngine,
    resumeGame as resumeGameEngine,
    resetGame as resetGameEngine,
    generatePlayerId,
} from '@/engine';
import { markCell as markCellEngine } from '@/engine';
import type { GameState, GameSettings, LotoCard } from '@/lib/types';
import { AUTO_CALL_INTERVALS } from '@/lib/config';
import { useAudio } from './useAudio';

// ============================================================================
// TYPES
// ============================================================================

interface UseLocalGameOptions {
    playerName: string;
    playerAvatar: string;
    settings?: Partial<GameSettings>;
    autoCallEnabled?: boolean;
    autoCallSpeed?: 'slow' | 'normal' | 'fast';
}

interface UseLocalGameReturn {
    // State
    gameState: GameState | null;
    phase: 'idle' | 'lobby' | 'playing' | 'paused' | 'finished';
    currentNumber: number | null;
    calledNumbers: number[];
    myCards: LotoCard[];
    remainingCount: number;
    winner: { name: string; isMe: boolean } | null;

    // Actions
    createLocalGame: () => void;
    startGame: () => void;
    callNumber: () => void;
    markCell: (cardId: string, row: number, col: number) => void;
    claimBingo: (cardId: string) => void;
    claimFlatBonus: (flatType: number) => void;
    pauseGame: () => void;
    resumeGame: () => void;
    restartGame: () => void;
    exitGame: () => void;

    // Power-up game effects (do not consume inventory — caller manages economy)
    /** Return next `count` upcoming numbers without modifying state. */
    peekUpcoming: (count?: number) => number[];
    /**
     * Auto-mark the first called-but-unmarked cell on the player's cards.
     * @returns true if a cell was marked.
     */
    luckyMark: () => boolean;
    /** Enable the slow-time effect: doubles the auto-call interval for `durationMs`. */
    enableSlowTime: (durationMs?: number) => void;
    /** True while the slow-time effect is active (live ticking). */
    isSlowTimeActive: boolean;

    // Auto-call
    toggleAutoCall: () => void;
    isAutoCallEnabled: boolean;
    setAutoCallSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
    autoCallSpeed: 'slow' | 'normal' | 'fast';
}

// ============================================================================
// HOOK
// ============================================================================

export function useLocalGame(options: UseLocalGameOptions): UseLocalGameReturn {
    const {
        playerName,
        playerAvatar,
        autoCallEnabled: initialAutoCall = false,
        autoCallSpeed: initialSpeed = 'normal',
    } = options;

    const { speakNumber, speak } = useAudio();

    // Game state
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [winner, setWinnerInfo] = useState<{ name: string; isMe: boolean } | null>(null);

    // Auto-call state
    const [isAutoCallEnabled, setIsAutoCallEnabled] = useState(initialAutoCall);
    const [autoCallSpeed, setAutoCallSpeed] = useState<'slow' | 'normal' | 'fast'>(initialSpeed);
    const autoCallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Slow-time power-up state. `slowTimeUntil` is the wall-clock ms timestamp
    // until which the auto-call interval is doubled. We expose `isSlowTimeActive`
    // as live state so consumers can show a UI indicator. The timer effect
    // re-reads `slowTimeUntil` to refresh the auto-call interval.
    const [slowTimeUntil, setSlowTimeUntil] = useState<number>(0);
    const [isSlowTimeActive, setIsSlowTimeActive] = useState<boolean>(false);
    const slowTimeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Player ID (stable across renders)
    const playerIdRef = useRef<string>(generatePlayerId());

    // ========================================================================
    // DERIVED STATE
    // ========================================================================

    const phase = gameState?.phase ?? 'idle';
    const currentNumber = gameState?.currentNumber ?? null;
    const calledNumbers = gameState?.calledNumbers.map(cn => cn.value) ?? [];
    const remainingCount = gameState?.remainingNumbers.length ?? 90;

    // Get my cards
    const myPlayer = gameState?.players.find(p => p.id === playerIdRef.current);
    const myCards = myPlayer?.cards ?? [];

    // ========================================================================
    // GAME ACTIONS
    // ========================================================================

    const createLocalGame = useCallback(() => {
        const newGame = createGame(
            playerIdRef.current,
            playerName,
            playerAvatar,
            {
                cardsPerPlayer: 3,
                gameMode: 'classic',
            }
        );
        setGameState(newGame);
        setWinnerInfo(null);
    }, [playerName, playerAvatar]);

    const startGame = useCallback(() => {
        if (!gameState) return;
        const started = startGameEngine(gameState);
        setGameState(started);
        speak("Game Started");
    }, [gameState, speak]);

    const callNumber = useCallback(() => {
        if (!gameState || gameState.phase !== 'playing') return;

        // Call next number
        let updated = callNextNumber(gameState);

        // Speak the number
        if (updated.currentNumber) {
            speakNumber(updated.currentNumber);
        }

        // Check for winners
        const winResult = checkForWinners(updated);
        if (winResult) {
            updated = setWinner(updated, winResult.winnerId);
            const winnerPlayer = updated.players.find(p => p.id === winResult.winnerId);
            setWinnerInfo({
                name: winnerPlayer?.name ?? 'Unknown',
                isMe: winResult.winnerId === playerIdRef.current,
            });
            speak("Bingo! We have a winner!");
        }

        setGameState(updated);
    }, [gameState, speak, speakNumber]);

    const markCell = useCallback((cardId: string, row: number, col: number) => {
        if (!gameState) return;

        const updatedPlayers = gameState.players.map(player => {
            if (player.id !== playerIdRef.current) return player;

            const updatedCards = player.cards.map(card => {
                if (card.id !== cardId) return card;
                return markCellEngine(card, row, col);
            });

            return { ...player, cards: updatedCards };
        });

        setGameState({ ...gameState, players: updatedPlayers });
    }, [gameState]);

    const claimBingo = useCallback((cardId: string) => {
        if (!gameState || gameState.phase !== 'playing') return;

        // Verify the card is actually complete
        const myPlayer = gameState.players.find(p => p.id === playerIdRef.current);
        const card = myPlayer?.cards.find(c => c.id === cardId);
        if (!card) return;

        const calledSet = new Set(gameState.calledNumbers.map(cn => cn.value));
        const isComplete = card.grid.flat().every(
            cell => cell.value === null || calledSet.has(cell.value)
        );

        if (isComplete) {
            const updated = setWinner(gameState, playerIdRef.current);
            setGameState(updated);
            setWinnerInfo({ name: playerName, isMe: true });
            speak("Bingo!");
        } else {
            speak("That is not a bingo");
        }
    }, [gameState, playerName, speak]);

    const claimFlatBonus = useCallback((flatType: number) => {
        if (!gameState) return;
        const updated = claimFlat(gameState, playerIdRef.current, flatType);
        setGameState(updated);
    }, [gameState]);

    const pauseGame = useCallback(() => {
        if (!gameState) return;
        setGameState(pauseGameEngine(gameState));
    }, [gameState]);

    const resumeGame = useCallback(() => {
        if (!gameState) return;
        setGameState(resumeGameEngine(gameState));
    }, [gameState]);

    const restartGame = useCallback(() => {
        if (!gameState) return;
        const reset = resetGameEngine(gameState);
        setGameState(reset);
        setWinnerInfo(null);
    }, [gameState]);

    const exitGame = useCallback(() => {
        setGameState(null);
        setWinnerInfo(null);
        if (autoCallTimerRef.current) {
            clearInterval(autoCallTimerRef.current);
            autoCallTimerRef.current = null;
        }
    }, []);

    // ========================================================================
    // AUTO-CALL
    // ========================================================================

    const toggleAutoCall = useCallback(() => {
        setIsAutoCallEnabled(prev => !prev);
    }, []);

    // Auto-call effect
    useEffect(() => {
        if (isAutoCallEnabled && gameState?.phase === 'playing') {
            // Slow-time power-up doubles the interval while active.
            const baseInterval = AUTO_CALL_INTERVALS[autoCallSpeed];
            const intervalMs = Date.now() < slowTimeUntil ? baseInterval * 2 : baseInterval;
            autoCallTimerRef.current = setInterval(() => {
                callNumber();
            }, intervalMs);
        } else {
            if (autoCallTimerRef.current) {
                clearInterval(autoCallTimerRef.current);
                autoCallTimerRef.current = null;
            }
        }

        return () => {
            if (autoCallTimerRef.current) {
                clearInterval(autoCallTimerRef.current);
                autoCallTimerRef.current = null;
            }
        };
    }, [isAutoCallEnabled, autoCallSpeed, gameState?.phase, callNumber, isSlowTimeActive, slowTimeUntil]);

    // ========================================================================
    // POWER-UP EFFECTS
    // ========================================================================

    /**
     * Return next `count` upcoming numbers without consuming/modifying state.
     * `remainingNumbers` is the shuffled draw pool — `callNextNumber` pops from
     * the front, so the next-up is `remainingNumbers[0..count-1]`.
     */
    const peekUpcoming = useCallback((count: number = 3): number[] => {
        if (!gameState) return [];
        return gameState.remainingNumbers.slice(0, count);
    }, [gameState]);

    /**
     * Auto-mark the first called-but-unmarked cell on the player's cards.
     * Walks own cards in order; for each cell, if value has been called but
     * isMarked is false, marks via the existing engine helper.
     */
    const luckyMark = useCallback((): boolean => {
        if (!gameState) return false;
        const calledSet = new Set(gameState.calledNumbers.map(cn => cn.value));

        let foundCardId: string | null = null;
        let foundRow = -1;
        let foundCol = -1;

        const myPlayer = gameState.players.find(p => p.id === playerIdRef.current);
        if (!myPlayer) return false;

        outer: for (const card of myPlayer.cards) {
            for (let r = 0; r < card.grid.length; r++) {
                const row = card.grid[r];
                for (let c = 0; c < row.length; c++) {
                    const cell = row[c];
                    if (cell.value !== null && !cell.isMarked && calledSet.has(cell.value)) {
                        foundCardId = card.id;
                        foundRow = r;
                        foundCol = c;
                        break outer;
                    }
                }
            }
        }

        if (!foundCardId) return false;

        const updatedPlayers = gameState.players.map(player => {
            if (player.id !== playerIdRef.current) return player;
            const updatedCards = player.cards.map(card => {
                if (card.id !== foundCardId) return card;
                return markCellEngine(card, foundRow, foundCol);
            });
            return { ...player, cards: updatedCards };
        });
        setGameState({ ...gameState, players: updatedPlayers });
        return true;
    }, [gameState]);

    /**
     * Activate slow-time: doubles auto-call interval for `durationMs`.
     */
    const enableSlowTime = useCallback((durationMs: number = 30000) => {
        const until = Date.now() + durationMs;
        setSlowTimeUntil(until);
        setIsSlowTimeActive(true);
        if (slowTimeTimeoutRef.current) clearTimeout(slowTimeTimeoutRef.current);
        slowTimeTimeoutRef.current = setTimeout(() => {
            setIsSlowTimeActive(false);
            setSlowTimeUntil(0);
            slowTimeTimeoutRef.current = null;
        }, durationMs);
    }, []);

    // Cleanup slow-time timer on unmount
    useEffect(() => {
        return () => {
            if (slowTimeTimeoutRef.current) {
                clearTimeout(slowTimeTimeoutRef.current);
                slowTimeTimeoutRef.current = null;
            }
        };
    }, []);

    return {
        // State
        gameState,
        phase,
        currentNumber,
        calledNumbers,
        myCards,
        remainingCount,
        winner,

        // Actions
        createLocalGame,
        startGame,
        callNumber,
        markCell,
        claimBingo,
        claimFlatBonus,
        pauseGame,
        resumeGame,
        restartGame,
        exitGame,

        // Auto-call
        toggleAutoCall,
        isAutoCallEnabled,
        setAutoCallSpeed,
        autoCallSpeed,

        // Power-ups
        peekUpcoming,
        luckyMark,
        enableSlowTime,
        isSlowTimeActive,
    };
}
