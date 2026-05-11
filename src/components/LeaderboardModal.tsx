import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { ModalShell, ListRow, Badge, RankBadge, EmptyState, SkeletonList, LeaderboardSkeleton } from '@/components/common';
import { Trophy, ArrowUpCircle } from 'lucide-react-native';
import { supabase } from '@/lib/services/supabase';
import { useGameStore } from '@/lib/store';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';
import { translations } from '@/lib/i18n';

interface LeaderboardEntry {
    id: string;
    nickname: string;
    avatar: string;
    coins: number;
    games_won: number;
    tier: string;
}

interface LeaderboardModalProps {
    visible: boolean;
    onClose: () => void;
}

export const LeaderboardModal = ({ visible, onClose }: LeaderboardModalProps) => {
    const { playerName, language } = useGameStore();
    const t = translations[language];
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) fetchLeaderboard();
    }, [visible]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // Supabase query — top 50 hráčov zoradených podľa coins
            // POZN: potrebuješ pridať RLS politiku ktorá umožní čítať profily
            // ostatných hráčov pre leaderboard. Spusti v SQL Editore:
            //   CREATE POLICY "profiles: leaderboard read"
            //   ON public.profiles FOR SELECT TO authenticated USING (true);
            const { data, error } = await (supabase.from('profiles') as any)
                .select('id, nickname, avatar, coins, games_won, tier')
                .order('coins', { ascending: false })
                .limit(50);

            if (error) {
                console.error('[Leaderboard] Supabase error:', error.message);
                setLeaders([]);
            } else {
                setLeaders(data ?? []);
            }
        } catch (err) {
            console.error('[Leaderboard] Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderRankIcon = (index: number) => {
        const rank = index + 1;
        if (rank === 1) return <Trophy size={20} color="#ffd700" fill="#ffd70033" />;
        if (rank === 2) return <Trophy size={20} color="#d4b896" />;
        if (rank === 3) return <Trophy size={20} color="#5a4025" />;
        return <Text style={[TEXT_STYLES.bodyBold, { color: '#d4b896' }]}>#{rank}</Text>;
    };

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={(t as any).leagueStandingsTitle ?? 'Leaderboard'}
            subtitle={(t as any).leaguePromoteHint ?? 'Top players by coins'}
        >
            {loading ? (
                <View style={{ paddingVertical: SPACING.sm }}>
                    <SkeletonList count={8} ItemSkeleton={LeaderboardSkeleton} />
                </View>
            ) : leaders.length === 0 ? (
                <EmptyState
                    title={(t as any).noCompetitorsTitle ?? 'No Players Yet'}
                    description={(t as any).noCompetitorsDesc ?? 'Play games to appear on the leaderboard.'}
                    icon={Trophy}
                />
            ) : (
                <View style={{ gap: SPACING.md }}>
                    {leaders.map((leader, index) => {
                        const isPromotionZone = index < Math.max(1, Math.floor(leaders.length * 0.2));
                        const isMe = leader.nickname === playerName;

                        return (
                            <ListRow
                                key={leader.id}
                                icon={
                                    <View style={{
                                        width: 36, height: 36,
                                        borderRadius: RADII.pill,
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {renderRankIcon(index)}
                                    </View>
                                }
                                title={`${leader.avatar ?? ''} ${leader.nickname}${isMe ? ` (${(t as any).youLabel ?? 'YOU'})` : ''}`.trim()}
                                subtitle={`💰 ${leader.coins.toLocaleString()} · 🏆 ${leader.games_won} wins`}
                                selected={isMe}
                                right={
                                    <View style={{ alignItems: 'flex-end', gap: SPACING.xs }}>
                                        <RankBadge tier={leader.tier ?? 'bronze'} size="sm" />
                                        {isPromotionZone ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                                                <ArrowUpCircle size={14} color="#4ade80" />
                                                <Badge label={(t as any).promote ?? 'TOP'} variant="success" />
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
