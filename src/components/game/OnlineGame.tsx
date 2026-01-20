/**
 * OnlineGame - Multiplayer mode using Socket.io
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, ImageBackground, StatusBar, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { useGameSocket, useHapticFeedback, useAudio } from '@/hooks';
import { WaitingLobby } from '@/components/WaitingLobby';
import { LotoCard } from '@/components/LotoCard';
import { GameHeader } from '@/components/GameHeader';
import { WoodenButton } from '@/components/common';
import { ChatOverlay } from '@/components/ChatOverlay';
import { WinnerModal } from '@/components/WinnerModal';
import { TriangleAlert } from 'lucide-react-native';

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
    const { playerName, playerAvatar, coins, language, activeSkin, activeTheme } = useGameStore();
    const haptics = useHapticFeedback();
    const { speak, speakNumber, playSound } = useAudio();
    const t = translations[language];

    // Socket game hook
    const {
        gameState,
        isConnected,
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
    } = useGameSocket({
        autoConnect: true,
    });

    const [hasJoined, setHasJoined] = useState(false);
    const [showWinner, setShowWinner] = useState(false);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    // Handle connection and joining
    useEffect(() => {
        if (isConnected && !hasJoined) {
            if (mode === 'create') {
                createRoom(
                    playerName || 'Player',
                    playerAvatar || '🐻',
                    { isPublic, crazyMode, customRoomCode: initialRoomCode }
                );
            } else if (mode === 'join' && initialRoomCode) {
                joinRoom(initialRoomCode, playerName || 'Player', playerAvatar || '🐻');
            }
            setHasJoined(true);
        }
    }, [isConnected, hasJoined, mode, initialRoomCode, createRoom, joinRoom, playerName, playerAvatar]);

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
        }
    }, [gameState?.phase, haptics, speak]);

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
    // Remaining count available via gameState if needed

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

    if (!isConnected || !gameState) {
        return (
            <ImageBackground source={WOOD_TEXTURE} style={{ flex: 1 }} resizeMode="repeat">
                <View className="flex-1 bg-black/60 justify-center items-center">
                    <ActivityIndicator size="large" color="#ffd700" />
                    <Text className="text-[#e8d4b8] mt-4 font-bold text-lg">{t.connecting}</Text>
                    {socketError && (
                        <View className="mt-4 flex-row items-center bg-red-500/20 p-4 rounded-xl border border-red-500/50">
                            <TriangleAlert color="#ef4444" size={20} />
                            <Text className="text-red-400 ml-2 font-bold">{socketError}</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={handleLeave} className="mt-8 bg-[#5a4025] px-8 py-4 rounded-xl border-b-4 border-[#3d2814]">
                        <Text className="text-[#e8d4b8] font-bold">Cancel</Text>
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
                />
            </ImageBackground>
        );
    }

    const isPaused = gameState.phase === 'paused';

    return (
        <ImageBackground source={WOOD_TEXTURE} style={{ flex: 1 }} resizeMode="repeat">
            <StatusBar barStyle="light-content" />
            <View className="absolute inset-0 bg-black/30" pointerEvents="none" />

            <View className="flex-1">
                <GameHeader
                    currentNumber={currentNumber}
                    history={calledNumbers}
                    coins={coins}
                    isConnected={true}
                    onLeave={handleLeave}
                />

                {/* Game Info Strip */}
                <View className="flex-row items-center justify-between px-3 py-2 bg-[#2d1f10]/80 border-b border-[#5a4025] z-40">
                    <View className="flex-row items-center gap-3 flex-1">
                        <View className="w-10 h-10 bg-[#3d2814] rounded-lg border border-[#ffd700]/50 items-center justify-center">
                            <Text className="text-xl">{playerAvatar}</Text>
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between mb-1">
                                <Text className="text-[#8b6b4a] text-[10px] font-bold uppercase tracking-wider">{t.progress}</Text>
                                <Text className="text-[#f5e6c8] text-[10px] font-bold">
                                    {markedNumbers}/{totalNumbers}
                                </Text>
                            </View>
                            <View className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-[#5a4025]/30">
                                <View
                                    className="h-full bg-[#4ade80]"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </View>
                        </View>
                    </View>

                    <View className="ml-4 items-end">
                        <View className="flex-row items-center gap-1">
                            <View className={`w-2 h-2 rounded-full ${isHost ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                            <Text className="text-[#8b6b4a] text-[10px] font-bold uppercase tracking-wider">{isHost ? 'HOST' : 'PLAYER'}</Text>
                        </View>
                        <Text className="text-[#f5e6c8] font-bold">{gameState.players.length} <Text className="text-[#8b6b4a] text-xs">{t.online?.toUpperCase()}</Text></Text>
                    </View>
                </View>

                {/* Cards Container */}
                <View className="flex-1 px-2 py-2 justify-evenly gap-2">
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

                {/* Control Deck Footer */}
                <View
                    style={{ paddingBottom: Math.max(16, insets.bottom + 8) }}
                    className="h-24 bg-[#1a1109] border-t-[4px] border-[#8b6b4a] flex-row items-center justify-between px-6 shadow-lg z-50"
                >

                    {/* Left: Host Pause or Empty */}
                    {isHost ? (
                        <TouchableOpacity
                            onPress={isPaused ? resumeGame : pauseGame}
                            className="items-center justify-center w-14 h-14 rounded-full bg-[#2d1f10] border-2 border-[#5a4025] active:bg-[#3d2814]"
                        >
                            <Text className="text-2xl">{isPaused ? '▶️' : '⏸️'}</Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="w-14" />
                    )}

                    {/* Center: BINGO Button (Main Action) */}
                    <View className="-mt-8 shadow-xl">
                        <WoodenButton
                            onPress={handleClaimBingo}
                            variant="danger"
                            size="lg"
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                shadowColor: '#ef4444',
                                shadowOffset: { width: 0, height: 8 },
                                shadowOpacity: 0.6,
                                shadowRadius: 16,
                                borderWidth: 4,
                                borderColor: '#991b1b'
                            }}
                        >
                            <View className="items-center justify-center h-full w-full">
                                <Text className="text-3xl mb-1">🏆</Text>
                            </View>
                        </WoodenButton>
                        <View className="absolute -bottom-8 left-0 right-0 items-center">
                            <Text className="text-[#ef4444] font-black text-xs uppercase tracking-widest shadow-black">BINGO!</Text>
                        </View>
                    </View>

                    {/* Right: Leave/Menu */}
                    <TouchableOpacity
                        onPress={handleLeave}
                        className="items-center justify-center w-14 h-14 rounded-full bg-[#2d1f10] border-2 border-[#5a4025] active:bg-[#3d2814]"
                    >
                        <Text className="text-xl">🚪</Text>
                    </TouchableOpacity>
                </View>

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
