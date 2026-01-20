/**
 * P2PGame - Local WiFi multiplayer mode using PeerJS
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, ImageBackground, StatusBar, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { useHapticFeedback, useAudio } from '@/hooks';
import { useP2PGame } from '@/lib/p2p/P2PContext';
import { WaitingLobby } from '@/components/WaitingLobby';
import { LotoCard } from '@/components/LotoCard';
import { GameHeader } from '@/components/GameHeader';
import { WoodenButton } from '@/components/common';
import { WinnerModal } from '@/components/WinnerModal';
import { TriangleAlert, Wifi, WifiOff } from 'lucide-react-native';

const WOOD_TEXTURE = require('../../../assets/wood-seamless.png');

export const P2PGame = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { playerName, playerAvatar, coins, language, activeSkin, activeTheme } = useGameStore();
    const haptics = useHapticFeedback();
    const { speak, speakNumber, playSound } = useAudio();
    const t = translations[language];

    const {
        gameState,
        isConnected,
        isHost,
        roomCode,
        error,
        playerId: myPlayerId,
        leaveRoom,
        startGame,
        markCell,
        claimWin,
        pauseGame,
        resumeGame,
    } = useP2PGame();

    const [showWinner, setShowWinner] = useState(false);

    // Audio effects
    useEffect(() => {
        if (gameState?.currentNumber) {
            speakNumber(gameState.currentNumber);
        }
    }, [gameState?.currentNumber, speakNumber]);

    useEffect(() => {
        if (gameState?.phase === 'finished') {
            setShowWinner(true);
            haptics.notifySuccess();
            playSound('win');
            speak('Bingo! We have a winner!');
        }
    }, [gameState?.phase, haptics, speak, playSound]);

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

    const handleStart = () => {
        if (!isHost) return;
        haptics.impactMedium();
        startGame();
    };

    const handleLeave = () => {
        leaveRoom();
        router.replace('/');
    };

    const handleCellPress = (cardId: string, row: number, col: number) => {
        markCell(cardId, row, col);
        haptics.impactLight();
        playSound('chip');
    };

    const handleClaimBingo = () => {
        haptics.impactHeavy();
        const firstCard = myCards[0];
        if (firstCard) {
            playSound('win');
            claimWin(firstCard.id);
        }
    };

    if (!isConnected || !gameState) {
        return (
            <ImageBackground source={WOOD_TEXTURE} style={{ flex: 1 }} resizeMode="repeat">
                <View className="flex-1 bg-black/60 justify-center items-center">
                    <Wifi size={48} color="#ffd700" className="mb-4" />
                    <ActivityIndicator size="large" color="#ffd700" />
                    <Text className="text-[#e8d4b8] mt-4 font-bold text-lg">Setting up WiFi Room...</Text>
                    {error && (
                        <View className="mt-4 flex-row items-center bg-red-500/20 p-4 rounded-xl border border-red-500/50">
                            <TriangleAlert color="#ef4444" size={20} />
                            <Text className="text-red-400 ml-2 font-bold">{error}</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={handleLeave} className="mt-8 bg-[#5a4025] px-8 py-4 rounded-xl border-b-4 border-[#3d2814]">
                        <Text className="text-[#e8d4b8] font-bold">Back to Menu</Text>
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
                        chatMessages={[]} // P2P chat not implemented yet
                        onSendMessage={() => { }}
                        t={t}
                    />
                </SafeAreaView>
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
                    currentNumber={gameState.currentNumber}
                    history={gameState.calledNumbers.map(n => n.value)}
                    coins={coins}
                    isConnected={true}
                    onLeave={handleLeave}
                />

                {/* Connection Status Indicator */}
                <View className="absolute top-2 left-4 z-50 flex-row items-center gap-1 opacity-60">
                    <Wifi size={12} color="#4ade80" />
                    <Text className="text-[#4ade80] text-[8px] font-bold">P2P MODE</Text>
                </View>

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
                        <Text className="text-[#f5e6c8] font-bold">{gameState.players.length} <Text className="text-[#8b6b4a] text-xs">CONNECTED</Text></Text>
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
                            calledNumbers={gameState.calledNumbers.map(n => n.value)}
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

                    <View className="-mt-8 shadow-xl">
                        <WoodenButton
                            onPress={handleClaimBingo}
                            variant="danger"
                            size="lg"
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                            }}
                        >
                            <View className="items-center justify-center h-full w-full">
                                <Text className="text-3xl mb-1">🏆</Text>
                            </View>
                        </WoodenButton>
                    </View>

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
                    prize={100} // Lower prize for local play
                    onClose={() => setShowWinner(false)}
                />
            </View>
        </ImageBackground>
    );
};
