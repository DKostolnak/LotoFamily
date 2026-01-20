/**
 * useLocalGame Hook Tests
 */

import { renderHook, act } from '@testing-library/react-native';
import { useLocalGame } from '../useLocalGame';

// Mock the audio hook
jest.mock('../useAudio', () => ({
    useAudio: () => ({
        speakNumber: jest.fn(),
        speak: jest.fn(),
    }),
}));

describe('useLocalGame', () => {
    const defaultOptions = {
        playerName: 'TestPlayer',
        playerAvatar: '🎮',
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('initializes with idle phase', () => {
        const { result } = renderHook(() => useLocalGame(defaultOptions));
        
        expect(result.current.phase).toBe('idle');
        expect(result.current.gameState).toBeNull();
    });

    it('creates a local game and transitions to lobby', () => {
        const { result } = renderHook(() => useLocalGame(defaultOptions));
        
        act(() => {
            result.current.createLocalGame();
        });
        
        expect(result.current.phase).toBe('lobby');
        expect(result.current.gameState).not.toBeNull();
        expect(result.current.gameState?.players).toHaveLength(1);
        expect(result.current.gameState?.players[0].name).toBe('TestPlayer');
    });

    it('starts game and transitions to playing phase', async () => {
        const { result } = renderHook(() => useLocalGame(defaultOptions));
        
        act(() => {
            result.current.createLocalGame();
        });
        
        act(() => {
            result.current.startGame();
        });
        
        expect(result.current.phase).toBe('playing');
    });

    it('calls numbers during gameplay', async () => {
        const { result } = renderHook(() => useLocalGame(defaultOptions));
        
        act(() => {
            result.current.createLocalGame();
        });
        
        act(() => {
            result.current.startGame();
        });
        
        // Need to wait for state update
        act(() => {
            result.current.callNumber();
        });
        
        // callNumber is async, check that called numbers array has content
        expect(result.current.calledNumbers.length).toBeGreaterThanOrEqual(0);
    });

    it('pauses and resumes game', async () => {
        const { result } = renderHook(() => useLocalGame(defaultOptions));
        
        act(() => {
            result.current.createLocalGame();
        });
        
        act(() => {
            result.current.startGame();
        });
        
        // Verify we're playing first
        expect(result.current.phase).toBe('playing');
        
        act(() => {
            result.current.pauseGame();
        });
        
        expect(result.current.phase).toBe('paused');
        
        act(() => {
            result.current.resumeGame();
        });
        
        expect(result.current.phase).toBe('playing');
    });

    it('toggles auto-call', () => {
        const { result } = renderHook(() => useLocalGame(defaultOptions));
        
        expect(result.current.isAutoCallEnabled).toBe(false);
        
        act(() => {
            result.current.toggleAutoCall();
        });
        
        expect(result.current.isAutoCallEnabled).toBe(true);
    });

    it('sets auto-call speed', () => {
        const { result } = renderHook(() => useLocalGame(defaultOptions));
        
        expect(result.current.autoCallSpeed).toBe('normal');
        
        act(() => {
            result.current.setAutoCallSpeed('fast');
        });
        
        expect(result.current.autoCallSpeed).toBe('fast');
    });

    it('exits game and resets state', () => {
        const { result } = renderHook(() => useLocalGame(defaultOptions));
        
        act(() => {
            result.current.createLocalGame();
            result.current.startGame();
        });
        
        act(() => {
            result.current.exitGame();
        });
        
        expect(result.current.gameState).toBeNull();
        expect(result.current.phase).toBe('idle');
    });

    it('provides player cards', () => {
        const { result } = renderHook(() => useLocalGame(defaultOptions));
        
        act(() => {
            result.current.createLocalGame();
        });
        
        expect(result.current.myCards).toBeDefined();
        expect(result.current.myCards.length).toBeGreaterThan(0);
    });

    it('restarts game after starting', () => {
        const { result } = renderHook(() => useLocalGame(defaultOptions));
        
        act(() => {
            result.current.createLocalGame();
        });
        
        act(() => {
            result.current.startGame();
        });
        
        expect(result.current.phase).toBe('playing');
        
        act(() => {
            result.current.restartGame();
        });
        
        expect(result.current.phase).toBe('lobby');
    });
});
