/**
 * OfflineGame - Single player practice mode
 */

import React, { useEffect, useState } from 'react';
import { View, ImageBackground, StatusBar, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { useLocalGame, useHapticFeedback, useResponsive, useAudio, useQuests } from '@/hooks';
import { WaitingLobby } from '@/components/WaitingLobby';
import { LotoCard } from '@/components/LotoCard';
import { GameHeader } from '@/components/GameHeader';
import { WoodenButton } from '@/components/common';
import { WinnerModal } from '@/components/WinnerModal';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Player } from '@/lib/types';

const WOOD_TEXTURE = require('../../../assets/wood-seamless.png');

export const OfflineGame = () => {
    const router = useRouter();
    const { playerName, playerAvatar, coins, language, stats, updateStats, activeSkin, activeTheme } = useGameStore();
    const haptics = useHapticFeedback();
    const { responsive } = useResponsive();
    const insets = useSafeAreaInsets();
    const { speak, speakNumber, playSound } = useAudio();
    const { trackProgress } = useQuests();
    const t = translations[language];

    // Local game hook
    const {
        gameState,
        phase,
        currentNumber,
        calledNumbers,
        myCards,
        remainingCount,
        winner,
        createLocalGame,
        startGame,
        markCell,
        claimBingo,
        pauseGame,
        resumeGame,
        restartGame,
        exitGame,
        toggleAutoCall,
        isAutoCallEnabled,
    } = useLocalGame({
        playerName: playerName || 'Player',
        playerAvatar: playerAvatar || '🐻',
        settings: {
            cardsPerPlayer: 3,
            gameMode: 'classic',
        },
    });

    // Local UI state
    const [showWinner, setShowWinner] = useState(false);

    // ========================================================================
    // DERIVED STATE
    // ========================================================================

    const isLobby = phase === 'lobby';
    const isPaused = phase === 'paused';

    // Calculate progress
    const totalNumbers = myCards.reduce((sum, card) => {
        return sum + card.grid.flat().filter(c => c.value !== null).length;
    }, 0);

    const markedNumbers = myCards.reduce((sum, card) => {
        return sum + card.grid.flat().filter(c => c.value !== null && c.isMarked).length;
    }, 0);

    const progressPercent = totalNumbers > 0 ? Math.round((markedNumbers / totalNumbers) * 100) : 0;

    // Check for potential Bingo
    const canBingo = myCards.some(card => {
        return card.grid.flat().every(c => c.value === null || (c.value !== null && c.isMarked));
    });

    // Mock players for lobby display
    const mockPlayers: Player[] = gameState ? gameState.players : [];

    // ========================================================================
    // EFFECTS
    // ========================================================================

    // Create game on mount only
    useEffect(() => {
        // Initialize game
        createLocalGame();

        // Start with Auto-Call enabled after a short delay
        const timer = setTimeout(() => {
            if (!isAutoCallEnabled) toggleAutoCall();
        }, 800);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Audio for called numbers
    useEffect(() => {
        if (currentNumber) {
            playSound('call');
            speakNumber(currentNumber);
        }
    }, [currentNumber, playSound, speakNumber]);

    // Show winner modal when game ends and update stats
    // Show winner modal when game ends and update stats
    useEffect(() => {
        if (winner && !showWinner) {
            setShowWinner(true);
            haptics.notifySuccess();
            playSound('win');
            if (winner.isMe) speak('Bingo! You win!');

            // Fire-and-forget stats update
            const newGamesPlayed = stats.gamesPlayed + 1;
            const isWin = winner.isMe;
            const newWins = isWin ? stats.gamesWon + 1 : stats.gamesWon;
            const newStreak = isWin ? (stats.currentStreak ?? 0) + 1 : 0;
            const bestStreak = Math.max(newStreak, stats.longestStreak ?? 0);

            // We use the functional update form if available, or just the values
            // Ideally we shouldn't depend on 'stats' in the effect dependency to avoid loops.
            // Since we are reading 'stats' inside, we omit it from deps and trust the closure 
            // OR we move this logic to the place where winner is set.
            // But 'winner' comes from 'useLocalGame' hook.

            updateStats({
                ...stats,
                gamesPlayed: newGamesPlayed,
                gamesWon: newWins,
                currentStreak: newStreak,
                longestStreak: bestStreak,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [winner, haptics, updateStats]);


    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleStart = () => {
        haptics.impactMedium();
        startGame();
        trackProgress('GAMES_PLAYED');
    };

    const handleLeave = () => {
        exitGame();
        router.replace('/');
    };

    const handleCellPress = (cardId: string, row: number, col: number) => {
        markCell(cardId, row, col);
        playSound('chip');
        haptics.impactLight();
        trackProgress('NUMBERS_MARKED', 1);
    };

    const handleClaimBingo = () => {
        haptics.impactHeavy();
        // Try to claim with any complete card
        const completeCard = myCards.find(card =>
            card.grid.flat().every(c => c.value === null || (c.value !== null && c.isMarked))
        );
        if (completeCard) {
            playSound('win');
            claimBingo(completeCard.id);
        } else {
            playSound('error');
        }
    };

    const handlePlayAgain = () => {
        setShowWinner(false);
        restartGame();
    };

    // ========================================================================
    // RENDER - LOBBY
    // ========================================================================

    if (isLobby || phase === 'idle') {
        return (
            <ImageBackground source={WOOD_TEXTURE} style={{ flex: 1 }} resizeMode="repeat">
                <StatusBar barStyle="light-content" />
                <View className="absolute inset-0 bg-black/30" pointerEvents="none" />
                <SafeAreaView className="flex-1">
                    <WaitingLobby
                        roomCode="PRACTICE"
                        players={mockPlayers}
                        currentPlayerId={gameState?.hostId ?? ''}
                        isHost={true}
                        onStart={handleStart}
                        onLeave={handleLeave}
                        t={t}
                    />
                </SafeAreaView>
            </ImageBackground>
        );
    }

    // ========================================================================
    // RENDER - PLAYING
    // ========================================================================

    return (
        <ImageBackground source={WOOD_TEXTURE} style={{ flex: 1 }} resizeMode="repeat">
            <StatusBar barStyle="light-content" />
            <View className="absolute inset-0 bg-black/30" pointerEvents="none" />

            {/* Changed from SafeAreaView to regular View to let Header handle top insets */}
            <View className="flex-1">
                {/* Header with current number */}
                {/* We pass a custom 'onLeave' which now acts as a Pause/Menu toggle or just Leave 
                    For now, reusing onLeave but we might want to change the icon to Pause if we can modify GameHeader
                    or just overlay a Pause button. 
                    Let's use a custom header wrapper or just rely on the existing one but change the logic.
                */}
                <View className="relative z-50">
                    <GameHeader
                        currentNumber={currentNumber}
                        history={calledNumbers}
                        coins={coins}
                        isConnected={false} // Offline
                        onLeave={isPaused ? resumeGame : pauseGame} // Toggle Pause
                    />

                    {/* Overlay Pause Icon on top of the back button location if needed, 
                        but GameHeader has a hardcoded chevron. 
                        For now, let's just use the existing header and maybe the user accepts Chevron as 'Menu/Pause'.
                        Actually, the user asked to "remove bottom buttons", so we need a way to leave.
                        If we use the header button to Pause, we need a Menu inside the pause state to Leave.
                    */}
                </View>

                {/* Game Info Strip - Compact on small screens */}
                <View className="flex-row items-center justify-between px-2 bg-[#2d1f10]/80 border-b border-[#5a4025] z-40" style={{ paddingVertical: responsive(4, 8) }}>
                    <View className="flex-row items-center flex-1" style={{ gap: responsive(8, 12) }}>
                        <View
                            className="bg-[#3d2814] rounded-lg border border-[#ffd700]/50 items-center justify-center"
                            style={{ width: responsive(32, 40), height: responsive(32, 40) }}
                        >
                            <Text style={{ fontSize: responsive(16, 20) }}>{playerAvatar}</Text>
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between mb-0.5">
                                <Text className="text-[#8b6b4a] font-bold uppercase" style={{ fontSize: responsive(8, 10) }}>{t.progress}</Text>
                                <Text className="text-[#f5e6c8] font-bold" style={{ fontSize: responsive(8, 10) }}>
                                    {markedNumbers}/{totalNumbers}
                                </Text>
                            </View>
                            <View className="w-full bg-black/40 rounded-full overflow-hidden border border-[#5a4025]/30" style={{ height: responsive(4, 8) }}>
                                <View
                                    className="h-full bg-[#4ade80]"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </View>
                        </View>
                    </View>

                    <View className="ml-3 items-end">
                        {isPaused ? (
                            <View className="bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/50">
                                <Text className="text-red-400 font-bold uppercase" style={{ fontSize: responsive(8, 10) }}>{t.paused?.toUpperCase()}</Text>
                            </View>
                        ) : (
                            <View className="bg-green-500/20 px-1.5 py-0.5 rounded border border-green-500/50">
                                <Text className="text-green-400 font-bold uppercase" style={{ fontSize: responsive(8, 10) }}>{t.autoPlay}</Text>
                            </View>
                        )}
                        <Text className="text-[#8b6b4a] font-bold uppercase mt-0.5" style={{ fontSize: responsive(8, 10) }}>
                            {90 - remainingCount} <Text className="text-[#666]">{t.called}</Text>
                        </Text>
                    </View>
                </View>

                {/* Cards Container - Responsive bottom padding for safe area */}
                <View
                    className="flex-1 px-2 py-1"
                    style={{
                        gap: responsive(2, 8),
                        paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 10
                    }}
                >
                    {myCards.map((card) => (
                        <LotoCard
                            key={card.id}
                            card={card}
                            onCellPress={(r, c) => handleCellPress(card.id, r, c)}
                            showHeader={false}
                            calledNumbers={calledNumbers}
                            t={t}
                            compact={true}
                            style={{ flex: 1 }}
                            activeSkin={activeSkin}
                            activeTheme={activeTheme}
                        />
                    ))}
                </View>

                {/* Floating BINGO Button (Only when needed) */}
                {canBingo && (
                    <View
                        className="absolute left-0 right-0 items-center z-50"
                        style={{ bottom: Math.max(20, insets.bottom + 20) }}
                    >
                        <WoodenButton
                            onPress={handleClaimBingo}
                            variant="gold"
                            size="lg"
                            className="shadow-2xl border-4 border-[#ffd700]"
                            style={{ width: 200, height: 70 }}
                        >
                            <Text className="text-2xl mr-2">🏆</Text> BINGO!
                        </WoodenButton>
                    </View>
                )}

                {/* Pause Overlay Menu */}
                {isPaused && (
                    <View className="absolute inset-0 bg-black/60 z-[60] justify-center items-center">
                        <View className="bg-[#2d1f10] p-6 rounded-2xl border-2 border-[#8b6b4a] w-[80%] gap-4 shadow-xl">
                            <Text className="text-[#f5e6c8] text-2xl font-bold text-center mb-2 uppercase tracking-widest">{t.paused}</Text>

                            <WoodenButton onPress={resumeGame} variant="success" size="lg" fullWidth>
                                {t.resume?.toUpperCase() || 'RESUME'}
                            </WoodenButton>

                            <WoodenButton onPress={handleLeave} variant="secondary" size="md" fullWidth>
                                {t.exitGame?.toUpperCase() || 'EXIT GAME'}
                            </WoodenButton>
                        </View>
                    </View>
                )}

                <WinnerModal
                    visible={showWinner}
                    winnerName={winner?.name ?? 'Unknown'}
                    isMe={winner?.isMe ?? false}
                    prize={100}
                    onClose={() => setShowWinner(false)}
                    onPlayAgain={handlePlayAgain}
                />
            </View>
        </ImageBackground>
    );
};
