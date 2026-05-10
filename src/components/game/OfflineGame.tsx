/**
 * OfflineGame - Single player practice mode
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ImageBackground, StatusBar, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { useLocalGame, useHapticFeedback, useAudio, useQuests } from '@/hooks';
import { WaitingLobby } from '@/components/WaitingLobby';
import { LotoCard } from '@/components/LotoCard';
import { GameHeader } from '@/components/GameHeader';
import GamePausedOverlay from '@/components/GamePausedOverlay';
import { WoodenButton, TutorialOverlay, type TutorialStep, PowerUpBar } from '@/components/common';
import { useToast } from '@/components/ToastProvider';
import { adsService, AD_PLACEMENTS } from '@/lib/services/ads';
import type { PowerUpInventory } from '@/lib/store/types';
import { WinnerModal } from '@/components/WinnerModal';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Player } from '@/lib/types';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

const WOOD_TEXTURE = require('../../../assets/wood-seamless.png');

export const OfflineGame = () => {
    const router = useRouter();
    const {
        playerName,
        playerAvatar,
        coins,
        language,
        stats,
        updateStats,
        activeSkin,
        activeTheme,
        tutorialCompleted,
        setTutorialCompleted,
        powerUps,
        usePowerUp,
        addPowerUp,
    } = useGameStore();
    const { showToast } = useToast();
    const haptics = useHapticFeedback();
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
        peekUpcoming,
        luckyMark,
        enableSlowTime,
        isSlowTimeActive,
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
    // TUTORIAL (first-time-user coach marks)
    // ========================================================================
    // Refs to spotlight target views during the tutorial.
    const headerRef = useRef<View | null>(null);
    const cardsRef = useRef<View | null>(null);
    const bingoButtonRef = useRef<View | null>(null);

    const [tutorialVisible, setTutorialVisible] = useState(false);

    const tutorialSteps = useMemo<TutorialStep[]>(
        () => [
            // Step 1: card overview (no spotlight — full intro)
            {
                title: t.tutorialStep1Title,
                body: t.tutorialStep1Body,
                targetRef: cardsRef,
            },
            // Step 2: called numbers (header)
            {
                title: t.tutorialStep2Title,
                body: t.tutorialStep2Body,
                targetRef: headerRef,
            },
            // Step 3: tap a number on the card
            {
                title: t.tutorialStep3Title,
                body: t.tutorialStep3Body,
                targetRef: cardsRef,
            },
            // Step 4: goal — full card
            {
                title: t.tutorialStep4Title,
                body: t.tutorialStep4Body,
                targetRef: cardsRef,
            },
            // Step 5: BINGO button (may not be visible — bubble centers if no target)
            {
                title: t.tutorialStep5Title,
                body: t.tutorialStep5Body,
                targetRef: bingoButtonRef,
            },
        ],
        [t]
    );

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

    // Show tutorial once gameplay begins, for first-time users.
    // Slight delay so target views are mounted/laid-out before measure().
    useEffect(() => {
        if (tutorialCompleted) return;
        if (phase !== 'playing') return;
        if (tutorialVisible) return;
        const handle = setTimeout(() => setTutorialVisible(true), 400);
        return () => clearTimeout(handle);
    }, [tutorialCompleted, phase, tutorialVisible]);

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
            const newWinStreak = isWin ? (stats.currentWinStreak ?? 0) + 1 : 0;
            const bestWinStreak = Math.max(newWinStreak, stats.longestWinStreak ?? 0);

            updateStats({
                ...stats,
                gamesPlayed: newGamesPlayed,
                gamesWon: newWins,
                currentWinStreak: newWinStreak,
                longestWinStreak: bestWinStreak,
            });

            // Battle Pass: grant season XP for game completion / win / streak.
            // Read directly from store so we avoid adding new hook deps to the
            // existing winner effect (which intentionally has narrow deps).
            const addSeasonXp = useGameStore.getState().addSeasonXp;
            addSeasonXp(50); // game played
            if (isWin) {
                addSeasonXp(150); // win bonus
                if (newWinStreak >= 3) addSeasonXp(100); // streak bonus
            }
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
    // POWER-UPS
    // ========================================================================

    const powerUpDisplayNames: Record<keyof PowerUpInventory, string> = {
        peek: t.powerUpPeek,
        luckyMark: t.powerUpLuckyMark,
        slowTime: t.powerUpSlowTime,
    };

    const handleUsePowerUp = (type: keyof PowerUpInventory) => {
        // Decrement inventory first; if none, the bar's onUse won't fire
        // (count===0 routes through onWatchAd). usePowerUp returns false
        // defensively if state changed mid-tap.
        if (!usePowerUp(type)) return;
        haptics.impactMedium();

        if (type === 'peek') {
            const upcoming = peekUpcoming(3);
            const text = t.nextNumbersAre.replace('{numbers}', upcoming.join(', '));
            showToast(text, 'info', '🔮');
        } else if (type === 'luckyMark') {
            const marked = luckyMark();
            if (marked) {
                haptics.notifySuccess();
                playSound('chip');
            } else {
                // Nothing markable — refund the consumed power-up.
                addPowerUp('luckyMark', 1);
            }
        } else if (type === 'slowTime') {
            enableSlowTime(30000);
            showToast(t.slowTimeActive, 'info', '⏰');
        }
    };

    const handleWatchAdForPowerUp = async (type: keyof PowerUpInventory) => {
        haptics.impactLight();
        const result = await adsService.showRewardedAd(AD_PLACEMENTS.POWER_UP_REWARD);
        if (result.rewarded) {
            addPowerUp(type, 1);
            const earnedText = t.powerUpEarned.replace('{name}', powerUpDisplayNames[type]);
            showToast(earnedText, 'success', '🎁');
        }
    };

    const activeEffects = useMemo(
        () => ({ slowTime: isSlowTimeActive }),
        [isSlowTimeActive]
    );

    // ========================================================================
    // RENDER - LOBBY
    // ========================================================================

    // Loading state - while local game is being created
    if (!gameState) {
        return (
            <ImageBackground source={WOOD_TEXTURE} style={{ flex: 1 }} resizeMode="repeat">
                <StatusBar barStyle="light-content" />
                <View className="absolute inset-0 bg-black/40" pointerEvents="none" />
                <View
                    className="flex-1 items-center justify-center"
                    accessibilityRole="progressbar"
                    accessibilityLabel={t.a11yLoadingGame}
                >
                    <ActivityIndicator size="large" color="#ffd700" />
                    <Text
                        style={[TEXT_STYLES.button, { color: '#f5e6c8', marginTop: SPACING.lg }]}
                    >
                        {t.loadingGame}
                    </Text>
                </View>
            </ImageBackground>
        );
    }

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
                <View ref={headerRef} collapsable={false} className="relative z-50">
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

                {/* Game Info Strip */}
                <View
                    className="flex-row items-center justify-between bg-wood-darker/85 border-b border-wood-medium z-40"
                    style={{
                        paddingVertical: SPACING.sm,
                        paddingHorizontal: SPACING.lg,
                        gap: SPACING.md,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                            gap: SPACING.md,
                        }}
                    >
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: RADII.md,
                                backgroundColor: '#3d2814',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 215, 0, 0.5)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 22 }}>{playerAvatar}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    marginBottom: SPACING.xs,
                                }}
                            >
                                <Text style={[TEXT_STYLES.captionUpper, { color: '#d4b896' }]}>
                                    {t.progress}
                                </Text>
                                <Text style={[TEXT_STYLES.bodyBold, { color: '#f5e6c8' }]}>
                                    {markedNumbers}/{totalNumbers}
                                </Text>
                            </View>
                            <View
                                style={{
                                    height: 8,
                                    width: '100%',
                                    backgroundColor: 'rgba(0,0,0,0.4)',
                                    borderRadius: RADII.pill,
                                    overflow: 'hidden',
                                    borderWidth: 1,
                                    borderColor: 'rgba(90, 64, 37, 0.3)',
                                }}
                            >
                                <View
                                    style={{
                                        height: '100%',
                                        width: `${progressPercent}%`,
                                        backgroundColor: '#4ade80',
                                    }}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: SPACING.xs }}>
                        {isPaused ? (
                            <View
                                style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    paddingHorizontal: SPACING.sm,
                                    paddingVertical: SPACING.xs,
                                    borderRadius: RADII.sm,
                                    borderWidth: 1,
                                    borderColor: 'rgba(239, 68, 68, 0.5)',
                                }}
                            >
                                <Text style={[TEXT_STYLES.captionUpper, { color: '#ef4444' }]}>
                                    {t.paused?.toUpperCase()}
                                </Text>
                            </View>
                        ) : (
                            <View
                                style={{
                                    backgroundColor: 'rgba(74, 222, 128, 0.18)',
                                    paddingHorizontal: SPACING.sm,
                                    paddingVertical: SPACING.xs,
                                    borderRadius: RADII.sm,
                                    borderWidth: 1,
                                    borderColor: 'rgba(74, 222, 128, 0.5)',
                                }}
                            >
                                <Text style={[TEXT_STYLES.captionUpper, { color: '#4ade80' }]}>
                                    {t.autoPlay}
                                </Text>
                            </View>
                        )}
                        <Text style={[TEXT_STYLES.caption, { color: '#d4b896' }]}>
                            {90 - remainingCount} {t.called}
                        </Text>
                    </View>
                </View>

                {/* Power-up bar — consumable boosts (peek / lucky mark / slow time) */}
                <PowerUpBar
                    inventory={powerUps}
                    onUse={handleUsePowerUp}
                    onWatchAd={handleWatchAdForPowerUp}
                    activeEffects={activeEffects}
                    a11yWatchAdLabel={t.watchAdForPowerUp}
                />

                {/* Cards Container - Responsive bottom padding for safe area */}
                <View
                    ref={cardsRef}
                    collapsable={false}
                    className="flex-1"
                    style={{
                        paddingHorizontal: SPACING.lg,
                        paddingTop: SPACING.sm,
                        gap: SPACING.sm,
                        paddingBottom: insets.bottom > 0 ? insets.bottom + SPACING.md : SPACING.md,
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
                        ref={bingoButtonRef}
                        collapsable={false}
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            alignItems: 'center',
                            zIndex: 50,
                            bottom: Math.max(SPACING.xl, insets.bottom + SPACING.xl),
                        }}
                    >
                        <WoodenButton
                            onPress={handleClaimBingo}
                            variant="gold"
                            size="lg"
                            accessibilityLabel="BINGO"
                        >
                            {t.claimBingo ?? 'BINGO!'}
                        </WoodenButton>
                    </View>
                )}

                {/* Pause Overlay (full-screen, design-system) */}
                {isPaused && (
                    <GamePausedOverlay
                        isHost
                        onResume={resumeGame}
                        onRestart={restartGame}
                        onQuit={handleLeave}
                        t={{
                            paused: t.paused ?? 'PAUSED',
                            resume: t.resume ?? 'RESUME',
                            restart: t.playAgain ?? 'RESTART',
                            exitGame: t.exitGame ?? 'EXIT',
                            waitingForHost: t.waitingForHost ?? 'Waiting…',
                        }}
                    />
                )}

                <WinnerModal
                    visible={showWinner}
                    winnerName={winner?.name ?? 'Unknown'}
                    isMe={winner?.isMe ?? false}
                    prize={100}
                    onClose={() => setShowWinner(false)}
                    onPlayAgain={handlePlayAgain}
                />

                {/* First-time-user interactive tutorial. Always skippable. */}
                <TutorialOverlay
                    visible={tutorialVisible}
                    steps={tutorialSteps}
                    labels={{
                        next: t.tutorialNext,
                        done: t.tutorialDone,
                        skip: t.tutorialSkip,
                        stepCount: t.tutorialStepCount,
                    }}
                    onComplete={() => {
                        setTutorialVisible(false);
                        setTutorialCompleted(true);
                    }}
                    onSkip={() => {
                        setTutorialVisible(false);
                        setTutorialCompleted(true);
                    }}
                />
            </View>
        </ImageBackground>
    );
};
