import React, { useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import { ModalShell, ListRow, Badge, WoodenButton, SkeletonList, QuestSkeleton, EmptyState } from '@/components/common';
import { Coins, CheckCircle2, Trophy, Target } from 'lucide-react-native';
import { useGameStore } from '@/lib/store';
import { useHapticFeedback, useQuests } from '@/hooks';
import { TEXT_STYLES, SPACING } from '@/lib/config';
import { translations } from '@/lib/i18n';

interface QuestsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const QuestsModal = ({ visible, onClose }: QuestsModalProps) => {
    const {
        quests,
        loading,
        fetchQuests,
        claimReward,
    } = useQuests();
    const haptics = useHapticFeedback();
    const { language } = useGameStore();
    const t = translations[language];

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
        // Local midnight — quests reset per local date (see quests.config.ts).
        tomorrow.setHours(24, 0, 0, 0);
        const diff = tomorrow.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }, [visible]);

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={(t as any).dailyMissionsTitle ?? 'Daily Missions'}
            subtitle={`${(t as any).dailyResetIn ?? 'Resets in'} ${timeLeft}`}
        >
            {loading ? (
                <View style={{ paddingVertical: SPACING.sm }}>
                    <SkeletonList count={4} ItemSkeleton={QuestSkeleton} />
                </View>
            ) : quests.length === 0 ? (
                <EmptyState
                    title={(t as any).allDoneTitle ?? 'All Done!'}
                    description={(t as any).allDoneDesc ?? "You've completed all missions for today. Great job!"}
                    icon={Trophy}
                    iconColor="#4ade80"
                />
            ) : (
                <View style={{ gap: SPACING.md }}>
                    {quests.map((uq) => {
                        const isComplete = uq.progress >= uq.quest.target;
                        const right = uq.isClaimed ? (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: SPACING.xs,
                                }}
                            >
                                <CheckCircle2 size={16} color="#4ade80" />
                                <Badge
                                    label={(t as any).missionClaimed ?? 'CLAIMED'}
                                    variant="success"
                                />
                            </View>
                        ) : isComplete ? (
                            <WoodenButton
                                size="sm"
                                variant="gold"
                                onPress={() => handleClaim(uq.id)}
                            >
                                {(t as any).claimReward ?? 'CLAIM'}
                            </WoodenButton>
                        ) : (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: SPACING.xs,
                                }}
                            >
                                <Coins size={14} color="#ffd700" />
                                <Text
                                    style={[
                                        TEXT_STYLES.bodyBold,
                                        { color: '#ffd700' },
                                    ]}
                                >
                                    +{uq.quest.reward}
                                </Text>
                            </View>
                        );

                        return (
                            <ListRow
                                key={uq.id}
                                icon={
                                    isComplete && !uq.isClaimed ? (
                                        <Trophy size={20} color="#ffd700" />
                                    ) : (
                                        <Target size={20} color="#d4b896" />
                                    )
                                }
                                title={uq.quest.title}
                                subtitle={`${uq.quest.description} — ${uq.progress}/${uq.quest.target}`}
                                selected={isComplete && !uq.isClaimed}
                                right={right}
                            />
                        );
                    })}
                </View>
            )}
        </ModalShell>
    );
};
