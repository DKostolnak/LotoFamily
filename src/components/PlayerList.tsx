import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Player } from '@/lib/types';
import { RankBadge } from '@/components/common';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface PlayerListProps {
    players: Player[];
    currentPlayerId: string;
    onPlayerClick?: (player: Player) => void;
    /** Compact mode kept for backwards-compat; all rows are 56pt regardless. */
    compact?: boolean;
}

const ROW_HEIGHT = 56;
const AVATAR_SIZE = 36;

export const PlayerList = memo(({ players, currentPlayerId, onPlayerClick }: PlayerListProps) => {
    return (
        <View style={{ width: '100%', gap: SPACING.xs }}>
            {players.map((p) => {
                const isMe = p.id === currentPlayerId;
                const isHost = p.isHost;
                const isConnected = p.isConnected !== false;

                return (
                    <TouchableOpacity
                        key={p.id}
                        onPress={() => onPlayerClick?.(p)}
                        accessibilityRole={onPlayerClick ? 'button' : undefined}
                        accessibilityLabel={`${p.name}${isHost ? ' (host)' : ''}${isMe ? ' (you)' : ''}`}
                        disabled={!onPlayerClick}
                        activeOpacity={onPlayerClick ? 0.7 : 1}
                        style={{
                            height: ROW_HEIGHT,
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
