import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { WoodenCard, RankBadge, AnimatedModal } from '@/components/common';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { BarChart2, Crown, Trophy, Coins } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay
} from 'react-native-reanimated';

interface StatsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const StatsModal = ({ visible, onClose }: StatsModalProps) => {
    const { playerName, playerAvatar, tier, stats, language } = useGameStore();
    const t = translations[language];

    const winRate = stats.gamesPlayed > 0
        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
        : 0;

    const level = Math.floor(stats.xp / 100) + 1;
    const xpInLevel = stats.xp % 100;
    const progressValue = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            progressValue.value = withDelay(300, withSpring(xpInLevel / 100, { damping: 12 }));
        } else {
            progressValue.value = 0;
        }
    }, [visible, xpInLevel]);

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: `${progressValue.value * 100}%`,
    }));

    return (
        <AnimatedModal visible={visible} onClose={onClose} animation="scale">
            <WoodenCard title={t.playerStats} onClose={onClose} className="w-[95%]">

                {/* Header Profile */}
                <View className="items-center mb-6 border-b border-[#5a4025]/30 pb-6">
                    <View className="relative">
                        <View className="w-20 h-20 bg-[#3d2814] rounded-2xl border-2 border-[#ffd700] items-center justify-center mb-3 shadow-lg">
                            <Text className="text-5xl">{playerAvatar}</Text>
                        </View>
                        <View className="absolute -bottom-1 -right-1 bg-[#ffd700] w-8 h-8 rounded-full border-2 border-[#3d2814] items-center justify-center">
                            <Text className="text-[#3d2814] font-black text-xs">L{level}</Text>
                        </View>
                    </View>

                    <Text className="text-[#e8d4b8] text-2xl font-bold mb-1">{playerName || 'Player'}</Text>
                    <RankBadge tier={tier} size="sm" className="mb-4" />

                    {/* XP Progress Bar */}
                    <View className="w-full px-6">
                        <View className="flex-row justify-between mb-1">
                            <Text className="text-[#8b6b4a] text-[10px] font-bold uppercase">Experience</Text>
                            <Text className="text-[#f5e6c8] text-[10px] font-bold">{xpInLevel}/100 XP</Text>
                        </View>
                        <View className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-[#5a4025]/30">
                            <Animated.View
                                className="h-full bg-blue-500"
                                style={animatedProgressStyle}
                            />
                        </View>
                    </View>
                </View>

                {/* Stats Grid */}
                <View className="flex-row flex-wrap justify-between gap-3">
                    {/* Games Played */}
                    <View className="w-[48%] bg-[#2d1f10] p-4 rounded-xl border border-[#5a4025] items-center">
                        <BarChart2 color="#e8d4b8" size={24} style={{ marginBottom: 4 }} />
                        <Text className="text-[#8b6b4a] uppercase text-[10px] font-bold tracking-wider">{t.games}</Text>
                        <Text className="text-[#e8d4b8] text-2xl font-bold">{stats.gamesPlayed}</Text>
                    </View>

                    {/* Wins */}
                    <View className="w-[48%] bg-[#2d1f10] p-4 rounded-xl border border-[#5a4025] items-center">
                        <Crown color="#ffd700" size={24} style={{ marginBottom: 4 }} />
                        <Text className="text-[#8b6b4a] uppercase text-[10px] font-bold tracking-wider">{t.wins}</Text>
                        <Text className="text-[#ffd700] text-2xl font-bold">{stats.gamesWon}</Text>
                    </View>

                    {/* Win Rate */}
                    <View className="w-[48%] bg-[#2d1f10] p-4 rounded-xl border border-[#5a4025] items-center">
                        <Trophy color="#4ade80" size={24} style={{ marginBottom: 4 }} />
                        <Text className="text-[#8b6b4a] uppercase text-[10px] font-bold tracking-wider">{t.winRate}</Text>
                        <Text className="text-[#4ade80] text-2xl font-bold">{winRate}%</Text>
                    </View>

                    {/* Earnings */}
                    <View className="w-[48%] bg-[#2d1f10] p-4 rounded-xl border border-[#5a4025] items-center">
                        <Coins color="#fbbf24" size={24} style={{ marginBottom: 4 }} />
                        <Text className="text-[#8b6b4a] uppercase text-[10px] font-bold tracking-wider">{t.earnings}</Text>
                        <Text className="text-[#fbbf24] text-xl font-bold">{stats.totalEarnings}</Text>
                    </View>
                </View>

                <View className="mt-6 p-4 bg-[#2d1f10]/60 rounded-xl">
                    <Text className="text-[#8b6b4a] text-xs text-center italic">
                        "Legendary players don't just clear lines, they clear the whole card."
                    </Text>
                </View>

            </WoodenCard>
        </AnimatedModal>
    );
};
