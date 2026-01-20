import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Player } from '@/lib/types';
import { RankBadge } from '@/components/common';

interface PlayerListProps {
    players: Player[];
    currentPlayerId: string;
    onPlayerClick?: (player: Player) => void;
    compact?: boolean;
}

export const PlayerList = memo(({ players, currentPlayerId, onPlayerClick, compact }: PlayerListProps) => {
    return (
        <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}
        >
            {players.map((p) => {
                const isMe = p.id === currentPlayerId;
                return (
                    <TouchableOpacity
                        key={p.id}
                        onPress={() => onPlayerClick?.(p)}
                        className={`items-center justify-center p-2 rounded-xl border-2 ${isMe ? 'bg-[#3d2814]/80 border-[#ffd700]' : 'bg-[#2d1f10]/60 border-[#5a4025]'}`}
                        style={{ width: compact ? 80 : 100, elevation: 2 }}
                    >
                        {/* Avatar */}
                        <View className="mb-1 relative">
                            <Text className={`text-3xl ${compact ? 'text-2xl' : ''}`}>{p.avatar}</Text>
                            {/* Host Badge */}
                            {false /* TODO: Host check */ && (
                                <View className="absolute -top-2 -right-2 bg-yellow-500 rounded-full w-4 h-4 items-center justify-center">
                                    <Text className="text-[8px]">👑</Text>
                                </View>
                            )}
                        </View>

                        {/* Name */}
                        <Text
                            className={`font-bold text-center text-xs ${isMe ? 'text-[#ffd700]' : 'text-[#e8d4b8]'}`}
                            numberOfLines={1}
                        >
                            {p.name}
                        </Text>

                        {/* Rank */}
                        {!compact && p.tier && (
                            <View className="mt-1 scale-75">
                                <RankBadge tier={p.tier} size="sm" />
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
});
PlayerList.displayName = 'PlayerList';
