/**
 * OnlineGame - Multiplayer mode using Supabase Realtime
 * (migrated from Socket.io — useSupabaseGame má rovnaký interface)
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, ImageBackground, StatusBar, TouchableOpacity, Text, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { useHapticFeedback, useAudio } from '@/hooks';
import { useSupabaseGame } from '@/hooks/useSupabaseGame';
import { WaitingLobby } from '@/components/WaitingLobby';
import { LotoCard } from '@/components/LotoCard';
import { GameHeader } from '@/components/GameHeader';
import { WoodenButton, ErrorView, ConnectionBanner, PowerUpBar } from '@/components/common';
import { useToast } from '@/components/ToastProvider';
import { adsService, AD_PLACEMENTS } from '@/lib/services/ads';
import type { PowerUpInventory } from '@/lib/store/types';
import { ChatOverlay } from '@/components/ChatOverlay';
import { WinnerModal } from '@/components/WinnerModal';
import GamePausedOverlay from '@/components/GamePausedOverlay';
import GameStatusListener from '@/components/GameStatusListener';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

const WOOD_TEXTURE = require('../../../assets/wood-seamless.png');

interface OnlineGameProps {
    mode: 'create' | 'join';
    initialRoomCode?: string;
    isPublic?: boolean;
    crazyMode?: boolean;
}

export const OnlineGame = ({ mode, initialRoomCode, isPublic = true, crazyMode = false }: OnlineGameProps) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { playerName, playerAvatar, coins, language, activeSkin, activeTheme, powerUps, usePowerUp: consumePowerUp, addPowerUp } = useGameStore();
    const { showToast } = useToast();
    const haptics = useHapticFeedback();
    const { speak, speakNumber, playSound } = useAudio();
    const t = translations[language];

    // Supabase Realtime game hook (nahradil Socket.io useGameSocket)
    const {
        socket,
        onGameEvent,
        gameState,
        isConnected,
        status: connStatus,
        error: socketError,
        isHost,
        roomCode,
        currentNumber,
        calledNumbers,
        chatMessages,
        myPlayerId,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        sendChatMessage,
        markCell,
        claimWin,
        pauseGame,
        resumeGame,
    } = useSupabaseGame();

    const [hasJoined, setHasJoined] = useState(false);
    const [showWinner, setShowWinner] = useState(false);

    // Connection banner — zobrazí stav Supabase Realtime pripojenia
    const connBannerMessage = useMemo(() => {
        switch (connStatus) {
            case 'reconnecting':
            case 'connecting': return t.connStatusReconnecting;
            case 'disconnected': return t.connStatusDisconnected;
            case 'error': return t.connStatusError;
            case 'connected': return t.connStatusConnected;
            default: return undefined;
        }
    }, [connStatus, t]);
    const handleRetryConnection = () => {
        // S Supabase Realtime sa reconnect rieši automaticky
        // Allow the join/create effect to fire again once reconnected.
        setHasJoined(false);
    };

    // ========================================================================
    // EFFECTS
    // ========================================================================

    // Handle connection and joining
    // Supabase: createRoom/joinRoom sa volá na mount (nie po isConnected)
    // pretože Supabase NASTAVÍ isConnected až PO volaní createRoom.
    useEffect(() => {
        if (hasJoined) return;
        setHasJoined(true);

        if (mode === 'create') {
            createRoom(
                playerName || 'Player',
                playerAvatar || '🐻',
                { isPublic, crazyMode, customRoomCode: initialRoomCode, cardsPerPlayer: 3 }
            );
        } else if (mode === 'join' && initialRoomCode) {
            joinRoom(initialRoomCode, playerName || 'Player', playerAvatar || '🐻');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // mount only

    // Handle game end (winner)
    // Audio effects
    useEffect(() => {
        if (currentNumber) speakNumber(currentNumber);
    }, [currentNumber, speakNumber]);

    useEffect(() => {
        if (gameState?.phase === 'finished') {
            setShowWinner(true);
            haptics.notifySuccess();
            playSound('win');
            speak('Bingo! We have a winner!');

            // Update stats and persist to Supabase
            const store = useGameStore.getState();
            const isWin = gameState.winnerId === myPlayerId;
            const prevStats = store.stats;
            const newGamesPlayed = prevStats.gamesPlayed + 1;
            const newWins = isWin ? prevStats.gamesWon + 1 : prevStats.gamesWon;
            const newWinStreak = isWin ? (prevStats.currentWinStreak ?? 0) + 1 : 0;
            const bestWinStreak = Math.max(newWinStreak, prevStats.longestWinStreak ?? 0);

            store.updateStats({
                ...prevStats,
                gamesPlayed: newGamesPlayed,
                gamesWon: newWins,
                currentWinStreak: newWinStreak,
                longestWinStreak: bestWinStreak,
            });

            store.addSeasonXp(50); // game played
            if (isWin) {
                store.addSeasonXp(150); // win bonus
                if (newWinStreak >= 3) store.addSeasonXp(100); // streak bonus
            }

            // Daily quests progress
            store.trackQuestProgress('GAMES_PLAYED');
            if (isWin) store.trackQuestProgress('GAMES_WON');

            store.syncToSupabase().catch(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState?.phase]);

    // Handle socket errors (connection lost, etc)
    // could add a toast or alert here

    // ========================================================================
    // DERIVED STATE
    // ========================================================================

    const myPlayer = useMemo(() =>
        gameState?.players.find(p => p.id === myPlayerId),
        [gameState?.players, myPlayerId]
    );

    const myCards = useMemo(() => myPlayer?.cards ?? [], [myPlayer]);

    const totalNumbers = useMemo(() => myCards.reduce((sum, card) => {
        return sum + card.grid.flat().filter(c => c.value !== null).length;
    }, 0), [myCards]);

    const markedNumbers = useMemo(() => myCards.reduce((sum, card) => {
        return sum + card.grid.flat().filter(c => c.value !== null && c.isMarked).length;
    }, 0), [myCards]);

    const progressPercent = totalNumbers > 0 ? Math.round((markedNumbers / totalNumbers) * 100) : 0;

    // True when every non-null cell on at least one card is marked — BINGO button appears
    const canBingo = useMemo(() =>
        myCards.some(card =>
            card.grid.flat().every(c => c.value === null || c.isMarked)
        ),
        [myCards]
    );

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleStart = () => {
        if (!isHost) return;
        haptics.impactMedium();
        startGame({ autoCallIntervalMs: 3000 }); // Host starts with auto-call
    };

    const handleLeave = () => {
        leaveRoom();
        router.replace('/');
    };

    const handleCellPress = (cardId: string, row: number, col: number) => {
        // Optimistic update locally? The sockethook doesn't do optimistic yet, but engine handles it fast.
        markCell(cardId, row, col);
        haptics.impactLight();
        playSound('chip');
        useGameStore.getState().trackQuestProgress('NUMBERS_MARKED', 1);
    };

    const handleClaimBingo = () => {
        haptics.impactHeavy();
        // Check for any possibly winning card and claim
        // Just claim the first one that looks ready or all?
        // Socket API `claimWin` takes cardId.
        // I should find a card that matches locally first to avoid spamming
        const calledSet = new Set(calledNumbers);
        const completeCard = myCards.find(card =>
            card.grid.flat().every(c => c.value === null || calledSet.has(c.value))
        );

        if (completeCard) {
            playSound('win');
            claimWin(completeCard.id);
        } else {
            // maybe claim anyway if user insists? Or show feedback "Not ready"
            // For now, simple check
            const firstCard = myCards[0];
            if (firstCard) {
                playSound('win');
                claimWin(firstCard.id);
            }
        }
    };

    // ========================================================================
    // POWER-UPS (online: only `peek` works client-side; lucky-mark / slow-time
    // need server cooperation for fairness, so they are best-effort only.)
    // ========================================================================

    const powerUpDisplayNames: Record<keyof PowerUpInventory, string> = {
        peek: t.powerUpPeek,
        luckyMark: t.powerUpLuckyMark,
        slowTime: t.powerUpSlowTime,
    };

    const handleUsePowerUp = (type: keyof PowerUpInventory) => {
        if (type !== 'peek') {
            // lucky-mark and slow-time require server logic which is not yet
            // implemented online — do not consume inventory.
            return;
        }
        if (!consumePowerUp(type)) return;
        haptics.impactMedium();
        useGameStore.getState().trackQuestProgress('POWERUP_USED');
        const upcoming = (gameState?.remainingNumbers ?? []).slice(0, 3);
        const text = t.nextNumbersAre.replace('{numbers}', upcoming.join(', '));
        showToast(text, 'info', '🔮');
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

    // R-Soft ad philosophy: NO forced interstitials — ads are always
    // opt-in rewarded (power-up refill, free coins, bonus doubling).
    const handlePlayAgain = () => {
        setShowWinner(false);
        if (isHost) {
            // socketService needs restart capability
            // restartGame(); // assume hook has it
        } else {
            // Client waits
        }
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    // Error state: socket reported error and we are not connected.
    if (socketError && !isConnected) {
        return (
            <ImageBackground source={WOOD_TEXTURE} style={{ flex: 1 }} resizeMode="repeat">
                <StatusBar barStyle="light-content" />
                <View className="absolute inset-0 bg-black/50" pointerEvents="none" />
                <ErrorView
                    message={socketError || t.connectionError}
                    retryLabel={t.retry}
                    onRetry={() => {
                        // Allow the join/create effect to fire again once reconnected.
                        setHasJoined(false);
                    }}
                    secondaryLabel={t.cancel}
                    onSecondary={handleLeave}
                />
            </ImageBackground>
        );
    }

    // Loading state: connecting / waiting for first gameState payload.
    if (!isConnected || !gameState) {
        return (
            <ImageBackground source={WOOD_TEXTURE} style={{ flex: 1 }} resizeMode="repeat">
                <View
                    className="flex-1 bg-black/60 justify-center items-center"
                    accessibilityRole="progressbar"
                    accessibilityLabel={t.a11yLoadingGame}
                >
                    <ActivityIndicator size="large" color="#ffd700" />
                    <Text style={[TEXT_STYLES.h3, { color: '#e8d4b8', marginTop: SPACING.lg }]}>
                        {t.connecting}
                    </Text>
                    <TouchableOpacity
                        onPress={handleLeave}
                        accessibilityRole="button"
                        accessibilityLabel={t.cancel}
                        style={{
                            marginTop: SPACING.xxl,
                            backgroundColor: '#5a4025',
                            paddingHorizontal: SPACING.xl,
                            paddingVertical: SPACING.md,
                            borderRadius: RADII.lg,
                            borderBottomWidth: 4,
                            borderColor: '#3d2814',
                            minHeight: 56,
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={[TEXT_STYLES.button, { color: '#e8d4b8' }]}>{t.cancel}</Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        );
    }

    if (gameState.phase === 'lobby') {
        return (
            <ImageBackground source={WOOD_TEXTURE} style={{ flex: 1 }} resizeMode="repeat">
                <StatusBar barStyle="light-content" />
                <View className="absolute inset-0 bg-black/30" pointerEvents="none" />
                <SafeAreaView className="flex-1">
                    <WaitingLobby
                        roomCode={roomCode || '...'}
                        players={gameState.players}
                        currentPlayerId={myPlayerId || ''}
                        isHost={isHost}
                        onStart={handleStart}
                        onLeave={handleLeave}
                        chatMessages={chatMessages}
                        onSendMessage={sendChatMessage}
                        t={t}
                    />
                </SafeAreaView>

                {/* Chat Overlay */}
                <ChatOverlay
                    messages={chatMessages}
                    onSendMessage={sendChatMessage}
                    currentPlayerId={myPlayerId || ''}
                    players={gameState.players}
                    roomCode={roomCode}
                />

                <ConnectionBanner
                    status={connStatus}
                    message={connBannerMessage}
                    retryLabel={t.connRetry}
                    onRetry={handleRetryConnection}
                />
            </ImageBackground>
        );
    }

    const isPaused = gameState.phase === 'paused';

    return (
        <ImageBackground source={WOOD_TEXTURE} style={{ flex: 1 }} resizeMode="repeat">
            <StatusBar barStyle="light-content" />
            <View className="absolute inset-0 bg-black/30" pointerEvents="none" />

            <ConnectionBanner
                status={connStatus}
                message={connBannerMessage}
                retryLabel={t.connRetry}
                onRetry={handleRetryConnection}
            />

            <GameStatusListener
                socket={socket}
                onGameEvent={onGameEvent}
                gameState={gameState}
                playerId={myPlayerId}
                isConnected={isConnected}
                error={socketError}
            />

            <View className="flex-1">
                <GameHeader
                    currentNumber={currentNumber}
                    history={calledNumbers}
                    coins={coins}
                    isConnected={true}
                    onLeave={handleLeave}
                    onTogglePause={isHost ? (isPaused ? resumeGame : pauseGame) : undefined}
                    isPaused={isPaused}
                />

                {/* Game Info Strip */}
                <View
                    className="flex-row items-center justify-between bg-wood-darker/85 border-b border-wood-medium z-40"
                    style={{
                        paddingHorizontal: SPACING.lg,
                        paddingVertical: SPACING.sm,
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                            <View
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: isHost ? '#ffd700' : '#3b82f6',
                                }}
                            />
                            <Text style={[TEXT_STYLES.captionUpper, { color: '#d4b896' }]}>
                                {isHost ? (t.host ?? 'HOST') : (t.players ?? 'PLAYER')}
                            </Text>
                        </View>
                        <Text style={[TEXT_STYLES.bodyBold, { color: '#f5e6c8' }]}>
                            {gameState.players.length}{' '}
                            <Text style={[TEXT_STYLES.caption, { color: '#d4b896' }]}>
                                {t.online?.toUpperCase()}
                            </Text>
                        </Text>
                    </View>
                </View>

                {/* Power-up bar — peek works client-side; lucky-mark / slow-time
                    are no-ops online until server support lands. */}
                <PowerUpBar
                    inventory={powerUps}
                    onUse={handleUsePowerUp}
                    onWatchAd={handleWatchAdForPowerUp}
                    a11yWatchAdLabel={t.watchAdForPowerUp}
                />

                {/* Cards Container — scrolls on short screens (iPhone SE), caps
                    card width on tablets so cells keep a sane tap size. */}
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: SPACING.lg,
                        paddingTop: SPACING.sm,
                        paddingBottom: Math.max(SPACING.md, insets.bottom),
                        gap: SPACING.sm,
                        alignItems: 'center',
                    }}
                >
                    {myCards.map((card) => (
                        <LotoCard
                            key={card.id}
                            card={card}
                            onCellPress={(r, c) => handleCellPress(card.id, r, c)}
                            showHeader={true}
                            calledNumbers={calledNumbers}
                            t={t}
                            compact={true}
                            activeSkin={activeSkin}
                            activeTheme={activeTheme}
                            style={{ width: '100%', maxWidth: 560 }}
                        />
                    ))}
                </ScrollView>

                {/* Floating BINGO button — appears only when a card is fully marked */}
                {canBingo && (
                    <View
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

                {/* Pause Overlay */}
                {isPaused && (
                    <GamePausedOverlay
                        roomCode={roomCode || undefined}
                        isHost={isHost}
                        onResume={resumeGame}
                        onQuit={handleLeave}
                        t={{
                            paused: t.paused ?? 'PAUSED',
                            pausedByHost: t.pausedByHost,
                            roomCodeLabel: t.roomCodeLabel,
                            resume: t.resume ?? 'RESUME',
                            exitGame: t.exitGame ?? 'EXIT',
                            waitingForHost: t.waitingForHost ?? 'Waiting for host…',
                            tapToCopy: t.tapToCopy,
                            copied: t.copied,
                        }}
                    />
                )}

                <WinnerModal
                    visible={showWinner}
                    winnerName={gameState.winnerId ? gameState.players.find(p => p.id === gameState.winnerId)?.name ?? 'Unknown' : 'Unknown'}
                    isMe={gameState.winnerId === myPlayerId}
                    prize={1000}
                    onClose={() => setShowWinner(false)}
                    onPlayAgain={isHost ? handlePlayAgain : undefined}
                />
            </View>
        </ImageBackground>
    );
};
