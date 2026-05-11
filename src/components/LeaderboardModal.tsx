import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withTiming,
    withRepeat,
    withSequence,
    cancelAnimation,
} from 'react-native-reanimated';
import { ModalShell, ListRow, Badge, RankBadge, EmptyState, SkeletonList, LeaderboardSkeleton, WoodenButton } from '@/components/common';
import { Trophy, ArrowUpCircle } from 'lucide-react-native';
import { supabase } from '@/lib/services/supabase';
import { useGameStore } from '@/lib/store';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';
import { translations, type TranslationKeys } from '@/lib/i18n';

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

// ── LeaderRow — animated list row with stagger entrance + "me" pulse ─────────
interface LeaderRowProps {
    leader: LeaderboardEntry;
    index: number;
    isMe: boolean;
    isPromotionZone: boolean;
    t: TranslationKeys;
    renderRankIcon: (index: number) => React.ReactNode;
}

function LeaderRow({ leader, index, isMe, isPromotionZone, t, renderRankIcon }: LeaderRowProps) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(16);
    const scale = useSharedValue(1);

    useEffect(() => {
        const delay = Math.min(index * 40, 500);
        opacity.value = withDelay(delay, withTiming(1, { duration: 260 }));
        translateY.value = withDelay(delay, withTiming(0, { duration: 260 }));
        if (isMe) {
            scale.value = withDelay(
                delay + 400,
                withRepeat(
                    withSequence(
                        withTiming(1.018, { duration: 650 }),
                        withTiming(1.0, { duration: 650 }),
                    ),
                    -1,
                    false,
                )
            );
        }
        return () => cancelAnimation(scale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }));

    return (
        <Animated.View style={animStyle}>
            <ListRow
                icon={
                    <View style={{
                        width: 36, height: 36,
                        borderRadius: RADII.pill,
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        {renderRankIcon(index)}
                    </View>
                }
                title={`${leader.avatar ?? ''} ${leader.nickname}${isMe ? ` (${t.youLabel})` : ''}`.trim()}
                subtitle={`💰 ${leader.coins.toLocaleString()} · 🏆 ${leader.games_won} ${t.wins.toLowerCase()}`}
                selected={isMe}
                right={
                    <View style={{ alignItems: 'flex-end', gap: SPACING.xs }}>
                        <RankBadge tier={leader.tier ?? 'bronze'} size="sm" />
                        {isPromotionZone ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                                <ArrowUpCircle size={14} color="#4ade80" />
                                <Badge label={t.promote} variant="success" />
                            </View>
                        ) : null}
                    </View>
                }
            />
        </Animated.View>
    );
}

export const LeaderboardModal = ({ visible, onClose }: LeaderboardModalProps) => {
    const { playerName, language } = useGameStore();
    const t = translations[language];
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (visible) fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const { data, error } = await (supabase.from('profiles') as any)
                .select('id, nickname, avatar, coins, games_won, tier')
                .order('coins', { ascending: false })
                .limit(50);

            if (error) {
                console.error('[Leaderboard] Supabase error:', error.message);
                setFetchError(error.message ?? t.connectionError);
                setLeaders([]);
            } else {
                setLeaders(data ?? []);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : t.connectionError;
            console.error('[Leaderboard] Fetch error:', err);
            setFetchError(msg);
        } finally {
            setLoading(false);
        }
    };

    const renderRankIcon = (index: number) => {
        const rank = index + 1;
        const label = `${t.playerRank} ${rank}`;
        if (rank === 1) return (
            <View accessibilityLabel={label}>
                <Trophy size={20} color="#ffd700" fill="#ffd70033" />
            </View>
        );
        if (rank === 2) return (
            <View accessibilityLabel={label}>
                <Trophy size={20} color="#d4b896" />
            </View>
        );
        if (rank === 3) return (
            <View accessibilityLabel={label}>
                <Trophy size={20} color="#5a4025" />
            </View>
        );
        return <Text style={[TEXT_STYLES.bodyBold, { color: '#d4b896' }]} accessibilityLabel={label}>#{rank}</Text>;
    };

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={t.leagueStandingsTitle}
            subtitle={t.leaguePromoteHint}
        >
            {loading ? (
                <View style={{ paddingVertical: SPACING.sm }}>
                    <SkeletonList count={8} ItemSkeleton={LeaderboardSkeleton} />
                </View>
            ) : fetchError ? (
                <View style={{
                    padding: SPACING.lg,
                    alignItems: 'center',
                    gap: SPACING.md,
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderRadius: RADII.lg,
                    borderWidth: 1,
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                }}>
                    <Text style={[TEXT_STYLES.bodyBold, { color: '#ef4444', textAlign: 'center' }]}>
                        {t.noConnection}
                    </Text>
                    <Text style={[TEXT_STYLES.caption, { color: '#d4b896', textAlign: 'center' }]}>
                        {fetchError}
                    </Text>
                    <WoodenButton
                        onPress={fetchLeaderboard}
                        variant="secondary"
                        size="sm"
                    >
                        {t.retry}
                    </WoodenButton>
                </View>
            ) : leaders.length === 0 ? (
                <EmptyState
                    title={t.noCompetitorsTitle}
                    description={t.noCompetitorsDesc}
                    icon={Trophy}
                />
            ) : (
                <View style={{ gap: SPACING.md }}>
                    {leaders.map((leader, index) => (
                        <LeaderRow
                            key={leader.id}
                            leader={leader}
                            index={index}
                            isMe={leader.nickname === playerName}
                            isPromotionZone={index < Math.max(1, Math.floor(leaders.length * 0.2))}
                            t={t}
                            renderRankIcon={renderRankIcon}
                        />
                    ))}
                </View>
            )}
        </ModalShell>
    );
};
