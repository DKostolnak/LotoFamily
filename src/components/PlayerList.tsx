import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Player } from '@/lib/types';
import { RankBadge, WoodenButton } from '@/components/common';
import { useToast } from '@/components/ToastProvider';
import { translations } from '@/lib/i18n';
import { useGameStore } from '@/lib/store';
import { fetchFriends, fetchSentFriendRequests, sendFriendRequest } from '@/lib/services/friends';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface PlayerListProps {
    players: Player[];
    currentPlayerId: string;
    onPlayerClick?: (player: Player) => void;
    showFriendActions?: boolean;
    /** Compact mode kept for backwards-compat; all rows are 56pt regardless. */
    compact?: boolean;
}

const ROW_HEIGHT = 56;
const ROW_HEIGHT_WITH_ACTION = 72;
const AVATAR_SIZE = 36;

export const PlayerList = memo(({
    players,
    currentPlayerId,
    onPlayerClick,
    showFriendActions = false,
}: PlayerListProps) => {
    const language = useGameStore((s) => s.language);
    const t = translations[language];
    const { showToast } = useToast();
    const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function loadFriends() {
            if (!showFriendActions) return;
            const [friendsResult, sentResult] = await Promise.all([
                fetchFriends(),
                fetchSentFriendRequests(),
            ]);
            if (!mounted) return;
            if (friendsResult.success) {
                setFriendIds(new Set(friendsResult.data.map((friend) => friend.friend.id)));
            }
            if (sentResult.success) {
                setPendingIds(new Set(sentResult.data.map((friend) => friend.friend.id)));
            }
        }

        loadFriends();
        return () => {
            mounted = false;
        };
    }, [showFriendActions]);

    const playersById = useMemo(
        () => new Map(players.map((player) => [player.id, player])),
        [players]
    );

    const handleAddFriend = useCallback(
        async (playerId: string) => {
            if (!playersById.has(playerId)) return;
            setBusyId(playerId);
            const result = await sendFriendRequest(playerId);
            setBusyId(null);

            if (!result.success) {
                showToast(
                    result.error === 'no_session' ? t.friendSignInRequired : t.connectionError,
                    'error',
                    '⚠️'
                );
                return;
            }

            setPendingIds((prev) => new Set(prev).add(playerId));
        },
        [playersById, showToast, t.connectionError, t.friendSignInRequired]
    );

    return (
        <View style={{ width: '100%', gap: SPACING.xs }}>
            {players.map((p) => {
                const isMe = p.id === currentPlayerId;
                const isHost = p.isHost;
                const isConnected = p.isConnected !== false;
                const isFriend = friendIds.has(p.id);
                const isPending = pendingIds.has(p.id);
                const showAction = showFriendActions && !isMe;
                const actionLabel = isFriend
                    ? t.friendsTitle
                    : isPending
                      ? t.friendPending
                      : t.addFriend;

                return (
                    <TouchableOpacity
                        key={p.id}
                        onPress={() => onPlayerClick?.(p)}
                        accessibilityRole={onPlayerClick ? 'button' : undefined}
                        accessibilityLabel={`${p.name}${isHost ? ' (host)' : ''}${isMe ? ' (you)' : ''}`}
                        disabled={!onPlayerClick}
                        activeOpacity={onPlayerClick ? 0.7 : 1}
                        style={{
                            minHeight: showAction ? ROW_HEIGHT_WITH_ACTION : ROW_HEIGHT,
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: SPACING.md,
                            gap: SPACING.md,
                            backgroundColor: isMe ? 'rgba(255, 215, 0, 0.08)' : 'rgba(45, 31, 16, 0.4)',
                            borderRadius: RADII.md,
                            borderWidth: 1,
                            borderColor: isMe ? '#ffd700' : 'rgba(90, 64, 37, 0.5)',
                        }}
                    >
                        {/* Avatar with optional host crown */}
                        <View
                            style={{
                                width: AVATAR_SIZE,
                                height: AVATAR_SIZE,
                                borderRadius: AVATAR_SIZE / 2,
                                backgroundColor: '#1a1109',
                                borderWidth: 2,
                                borderColor: isHost ? '#ffd700' : '#5a4025',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 22 }}>{p.avatar}</Text>
                            {isHost && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -8,
                                        right: -6,
                                    }}
                                >
                                    <Text style={{ fontSize: 14 }}>👑</Text>
                                </View>
                            )}
                        </View>

                        {/* Name */}
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text
                                style={[
                                    TEXT_STYLES.bodyBold,
                                    { color: isMe ? '#ffd700' : '#f5e6c8' },
                                ]}
                                numberOfLines={1}
                            >
                                {p.name}
                            </Text>
                        </View>

                        {/* Tier badge */}
                        {p.tier && (
                            <View>
                                <RankBadge tier={p.tier} size="sm" />
                            </View>
                        )}

                        {showAction && (
                            <WoodenButton
                                size="sm"
                                variant={isFriend || isPending ? 'secondary' : 'gold'}
                                disabled={isFriend || isPending || busyId === p.id}
                                onPress={() => handleAddFriend(p.id)}
                                accessibilityLabel={actionLabel}
                                style={{ minWidth: 118 }}
                                textStyle={{ fontSize: 11 }}
                            >
                                {actionLabel}
                            </WoodenButton>
                        )}

                        {/* Connected dot */}
                        <View
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: isConnected ? '#4ade80' : '#ef4444',
                                shadowColor: isConnected ? '#4ade80' : '#ef4444',
                                shadowOpacity: 0.6,
                                shadowRadius: 3,
                                elevation: 2,
                            }}
                            accessibilityLabel={isConnected ? 'connected' : 'disconnected'}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
});
PlayerList.displayName = 'PlayerList';
