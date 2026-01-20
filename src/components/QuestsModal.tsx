import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList } from 'react-native';
import { WoodenCard, AnimatedModal, WoodenButton, SkeletonList, QuestSkeleton, EmptyState } from '@/components/common';
import { Clock, Coins, CheckCircle2, Trophy } from 'lucide-react-native';
import { useGameStore } from '@/lib/store';
import { useHapticFeedback, useQuests } from '@/hooks';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring } from 'react-native-reanimated';

interface QuestsModalProps {
    visible: boolean;
    onClose: () => void;
}

const QuestItem = ({ uq, onClaim, visible }: { uq: any, onClaim: (id: string) => void, visible: boolean }) => {
    const isComplete = uq.progress >= uq.quest.target;
    const progressPercent = Math.min(1, uq.progress / uq.quest.target);
    const progressValue = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            progressValue.value = withDelay(400, withSpring(progressPercent, { damping: 15 }));
        } else {
            progressValue.value = 0;
        }
    }, [visible, progressPercent]);

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: `${progressValue.value * 100}%`,
    }));

    return (
        <View
            className={`mb-4 bg-[#2d1f10] p-4 rounded-2xl border-2 ${isComplete && !uq.isClaimed ? 'border-[#ffd700]' : 'border-[#5a4025]'}`}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                    <Text className="text-[#f5e6c8] font-black text-lg leading-tight uppercase">
                        {uq.quest.title}
                    </Text>
                    <Text className="text-[#8b6b4a] text-xs font-medium mt-1">
                        {uq.quest.description}
                    </Text>
                </View>
                <View className="items-end">
                    <View className="flex-row items-center bg-black/40 px-2 py-1 rounded-lg border border-[#ffd700]/30 shadow-sm">
                        <Coins size={12} color="#ffd700" />
                        <Text className="text-[#ffd700] font-black ml-1">+{uq.quest.reward}</Text>
                    </View>
                </View>
            </View>

            {/* Progress Bar */}
            <View className="mt-2">
                <View className="flex-row justify-between mb-1.5">
                    <Text className="text-[#a6814c] text-[10px] font-black uppercase tracking-widest">Progress</Text>
                    <Text className="text-[#f5e6c8] text-[10px] font-black">{uq.progress} / {uq.quest.target}</Text>
                </View>
                <View className="h-3.5 w-full bg-black/40 rounded-full overflow-hidden border border-[#5a4025]/30">
                    <Animated.View
                        className={`h-full ${isComplete ? 'bg-[#4ade80]' : 'bg-[#d4b075]'}`}
                        style={animatedProgressStyle}
                    />
                </View>
            </View>

            {/* Claim Section */}
            <View className="mt-4">
                {uq.isClaimed ? (
                    <View className="flex-row items-center justify-center gap-2 py-2.5 bg-black/20 rounded-xl">
                        <CheckCircle2 size={16} color="#4ade80" />
                        <Text className="text-[#4ade80] font-bold uppercase tracking-widest text-xs">Mission Claimed</Text>
                    </View>
                ) : (
                    <WoodenButton
                        onPress={() => onClaim(uq.id)}
                        disabled={!isComplete}
                        variant={isComplete ? 'gold' : 'secondary'}
                        size="sm"
                        fullWidth
                        style={isComplete ? { shadowColor: '#ffd700', shadowOpacity: 0.3, shadowRadius: 10 } : {}}
                    >
                        {isComplete ? 'CLAIM REWARD' : 'IN PROGRESS'}
                    </WoodenButton>
                )}
            </View>
        </View>
    );
};

export const QuestsModal = ({ visible, onClose }: QuestsModalProps) => {
    const {
        quests,
        loading,
        fetchQuests,
        claimReward,
    } = useQuests();
    const haptics = useHapticFeedback();

    useEffect(() => {
        if (visible) {
            fetchQuests();
        }
    }, [visible, fetchQuests]);

    const handleClaim = async (userQuestId: string) => {
        haptics.impactMedium();
        const result = await claimReward(userQuestId);
        if (result.success) {
            haptics.notifySuccess();
        }
    };

    const timeLeft = useMemo(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCHours(24, 0, 0, 0);
        const diff = tomorrow.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }, [visible]);

    return (
        <AnimatedModal visible={visible} onClose={onClose} animation="slide">
            <WoodenCard
                title="DAILY MISSIONS"
                className="w-full max-h-[85%]"
                onClose={onClose}
            >
                <View className="w-full flex-row items-center justify-between bg-black/20 rounded-xl px-4 py-3 mb-4 border border-[#d4b075]/20">
                    <View className="flex-row items-center gap-2">
                        <Clock size={16} color="#d4b075" />
                        <Text className="text-[#a6814c] font-black text-xs uppercase tracking-tight">Daily reset in</Text>
                    </View>
                    <Text className="text-[#ffd700] font-black text-lg">{timeLeft}</Text>
                </View>

                {loading ? (
                    <View className="w-full py-2">
                        <SkeletonList count={4} ItemSkeleton={QuestSkeleton} />
                    </View>
                ) : (
                    <FlatList
                        data={quests}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        windowSize={5}
                        ListEmptyComponent={
                            <EmptyState
                                title="All Done!"
                                description="You've completed all missions for today. Great job!"
                                icon={Trophy}
                                iconColor="#4ade80"
                            />
                        }
                        renderItem={({ item: uq }) => (
                            <QuestItem
                                uq={uq}
                                onClaim={handleClaim}
                                visible={visible}
                            />
                        )}
                    />
                )}
            </WoodenCard>
        </AnimatedModal>
    );
};
