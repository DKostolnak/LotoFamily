import React, { useEffect, useState } from 'react';
import { WoodenCard, RankBadge, AnimatedModal, EmptyState, SkeletonList, LeaderboardSkeleton } from '@/components/common';
import { Trophy, Medal, ArrowUpCircle, Crown } from 'lucide-react-native';
import { storageService, STORAGE_KEYS } from '@/lib/services/storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useGameStore } from '@/lib/store';
import { View, Text, FlatList } from 'react-native';
import { ENV } from '@/lib/config/env.config';

interface LeaderboardModalProps {
    visible: boolean;
    onClose: () => void;
}

export const LeaderboardModal = ({ visible, onClose }: LeaderboardModalProps) => {
    const { playerName } = useGameStore();
    const [leaders, setLeaders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchLeaderboard();
        }
    }, [visible]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const token = await storageService.getString(STORAGE_KEYS.PLAYER_TOKEN);
            const response = await fetch(`${ENV.server.url}/leagues/standings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setLeaders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[Leaderboard] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPosColor = (pos: number) => {
        if (pos === 1) return '#ffd700'; // Gold
        if (pos === 2) return '#c0c0c0'; // Silver
        if (pos === 3) return '#cd7f32'; // Bronze
        return '#f5e6c8';
    };

    return (
        <AnimatedModal visible={visible} onClose={onClose} animation="scale">
            <WoodenCard
                title="LEAGUE STANDINGS"
                className="w-full max-h-[85%]"
                onClose={onClose}
            >
                {/* Header Info */}
                <View className="w-full bg-[#3d2814]/60 rounded-xl px-4 py-3 mb-4 border border-[#ffd700]/10 flex-row items-center gap-3">
                    <Crown size={18} color="#ffd700" />
                    <Text className="text-[#ffd700] text-[10px] font-black uppercase tracking-[2px] flex-1">
                        TOP 20% PROMOTE TO NEXT LEAGUE
                    </Text>
                </View>

                {/* Column Headers */}
                <View className="w-full flex-row items-center justify-between border-b border-[#d4b075]/20 pb-2 mb-2 px-2">
                    <Text className="text-[#a6814c] font-black text-[10px] uppercase tracking-widest">Player Rank</Text>
                    <Text className="text-[#a6814c] font-black text-[10px] uppercase tracking-widest">Weekly Win Points</Text>
                </View>

                {loading ? (
                    <View className="w-full py-4">
                        <SkeletonList count={8} ItemSkeleton={LeaderboardSkeleton} />
                    </View>
                ) : (
                    <FlatList
                        data={leaders}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        windowSize={10}
                        ListEmptyComponent={
                            <EmptyState
                                title="No Competitors"
                                description="You are the first one here! Play games to set the bar."
                                icon={Trophy}
                            />
                        }
                        renderItem={({ item: leader, index }) => {
                            const isPromotionZone = index < Math.max(1, Math.floor(leaders.length * 0.2));
                            const isMe = leader.nickname === playerName;

                            return (
                                <Animated.View
                                    entering={FadeInDown.delay(index * 50).duration(400)}
                                    className={`flex-row items-center justify-between py-3.5 border-b border-[#d4b075]/10 px-2 ${isPromotionZone ? 'bg-[#4ade80]/5' : ''} ${isMe ? 'bg-[#ffd700]/10 rounded-xl' : ''}`}
                                    style={isPromotionZone && index === 0 ? { borderLeftWidth: 3, borderLeftColor: '#ffd700' } : {}}
                                >
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-7 items-center">
                                            {(index + 1) <= 3 ? (
                                                <Trophy size={18} color={getPosColor(index + 1)} fill={index === 0 ? '#ffd70033' : 'transparent'} />
                                            ) : (
                                                <Text className="text-[#a6814c] font-black text-sm">#{index + 1}</Text>
                                            )}
                                        </View>

                                        <View className="flex-row items-center gap-3">
                                            <View className="w-10 h-10 bg-black/40 rounded-xl items-center justify-center border border-[#5a4025]">
                                                <Text className="text-2xl">{leader.avatar}</Text>
                                            </View>
                                            <View>
                                                <View className="flex-row items-center gap-1.5">
                                                    <Text className={`font-black text-sm uppercase tracking-tight ${isMe ? 'text-[#ffd700]' : 'text-[#f5e6c8]'}`}>
                                                        {leader.nickname}
                                                        {isMe && <Text className="text-[10px] italic opacity-60"> (YOU)</Text>}
                                                    </Text>
                                                    {isPromotionZone && (
                                                        <ArrowUpCircle size={14} color="#4ade80" />
                                                    )}
                                                </View>
                                                <RankBadge tier={leader.tier?.toString() || '1'} size="sm" />
                                            </View>
                                        </View>
                                    </View>

                                    <View className="items-end">
                                        <Text className={`font-black text-xl italic ${index === 0 ? 'text-[#ffd700]' : 'text-[#f5e6c8]'}`}>
                                            {leader.weeklyEarnings?.toLocaleString() || '0'}
                                        </Text>
                                        <View className="flex-row items-center gap-1 opacity-60">
                                            <Medal size={10} color="#d4b075" />
                                            <Text className="text-[#d4b075] text-[10px] font-black">LCOINS</Text>
                                        </View>
                                    </View>
                                </Animated.View>
                            );
                        }}
                    />
                )}
            </WoodenCard>
        </AnimatedModal>
    );
};
