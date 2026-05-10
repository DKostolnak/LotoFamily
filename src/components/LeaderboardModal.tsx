import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { ModalShell, ListRow, Badge, RankBadge, EmptyState, SkeletonList, LeaderboardSkeleton } from '@/components/common';
import { Trophy, ArrowUpCircle } from 'lucide-react-native';
import { storageService, STORAGE_KEYS } from '@/lib/services/storage';
import { useGameStore } from '@/lib/store';
import { ENV } from '@/lib/config/env.config';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';
import { translations } from '@/lib/i18n';

interface LeaderboardModalProps {
    visible: boolean;
    onClose: () => void;
}

export const LeaderboardModal = ({ visible, onClose }: LeaderboardModalProps) => {
    const { playerName, language } = useGameStore();
    const t = translations[language];
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
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            setLeaders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[Leaderboard] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderRankIcon = (index: number) => {
        const rank = index + 1;
        if (rank === 1) {
            return <Trophy size={20} color="#ffd700" fill="#ffd70033" />;
        }
        if (rank === 2) {
            return <Trophy size={20} color="#d4b896" />;
        }
        if (rank === 3) {
            return <Trophy size={20} color="#5a4025" />;
        }
        return (
            <Text style={[TEXT_STYLES.bodyBold, { color: '#d4b896' }]}>
                #{rank}
            </Text>
        );
    };

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={(t as any).leagueStandingsTitle ?? 'League Standings'}
            subtitle={(t as any).leaguePromoteHint ?? 'Top 20% promote to the next league'}
        >
            {loading ? (
                <View style={{ paddingVertical: SPACING.sm }}>
                    <SkeletonList count={8} ItemSkeleton={LeaderboardSkeleton} />
                </View>
            ) : leaders.length === 0 ? (
                <EmptyState
                    title={(t as any).noCompetitorsTitle ?? 'No Competitors'}
                    description={(t as any).noCompetitorsDesc ?? 'You are the first one here! Play games to set the bar.'}
                    icon={Trophy}
                />
            ) : (
                <View style={{ gap: SPACING.md }}>
                    {leaders.map((leader, index) => {
                        const isPromotionZone = index < Math.max(1, Math.floor(leaders.length * 0.2));
                        const isMe = leader.nickname === playerName;
                        const points = leader.weeklyEarnings?.toLocaleString() || '0';

                        return (
                            <ListRow
                                key={leader.id}
                                icon={
                                    <View
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: RADII.pill,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {renderRankIcon(index)}
                                    </View>
                                }
                                title={`${leader.avatar ?? ''} ${leader.nickname}${isMe ? ` (${(t as any).youLabel ?? 'YOU'})` : ''}`.trim()}
                                subtitle={`${(t as any).weeklyWinPoints ?? 'Weekly Points'}: ${points}`}
                                selected={isMe}
                                right={
                                    <View style={{ alignItems: 'flex-end', gap: SPACING.xs }}>
                                        <RankBadge tier={leader.tier?.toString() || '1'} size="sm" />
                                        {isPromotionZone ? (
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: SPACING.xs,
                                                }}
                                            >
                                                <ArrowUpCircle size={14} color="#4ade80" />
                                                <Badge
                                                    label={(t as any).promote ?? 'PROMOTE'}
                                                    variant="success"
                                                />
                                            </View>
                                        ) : null}
                                    </View>
                                }
                            />
                        );
                    })}
                </View>
            )}
        </ModalShell>
    );
};
