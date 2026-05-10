import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WoodenCard, RankBadge, AnimatedModal, WoodenInput, WoodenButton } from '@/components/common';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { SHOP_ITEMS } from '@/lib/shop';
import { getAvailableAvatars, getNextAvatar } from '@/lib/config/avatar.config';
import { BarChart2, Crown, Trophy, Coins, Pencil, RotateCw, Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
    const {
        playerName, playerAvatar, tier, stats, language, inventory,
        setPlayerName, setPlayerAvatar,
    } = useGameStore();
    const t = translations[language];

    const [isEditingName, setIsEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState(playerName || '');
    const [nameError, setNameError] = useState<string | null>(null);

    // Reset edit state on open/close.
    useEffect(() => {
        if (!visible) {
            setIsEditingName(false);
            setNameError(null);
        } else {
            setNameDraft(playerName || '');
        }
    }, [visible, playerName]);

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

    const handleCycleAvatar = () => {
        Haptics.selectionAsync().catch(() => { });
        const purchasedAvatarIcons = SHOP_ITEMS
            .filter(item => item.category === 'avatar' && inventory.includes(item.id))
            .map(item => item.icon);
        const allAvatars = getAvailableAvatars(purchasedAvatarIcons);
        const next = getNextAvatar(playerAvatar, allAvatars);
        setPlayerAvatar(next);
    };

    const handleStartEditName = () => {
        Haptics.selectionAsync().catch(() => { });
        setNameDraft(playerName || '');
        setNameError(null);
        setIsEditingName(true);
    };

    const handleSaveName = () => {
        const trimmed = nameDraft.trim();
        if (trimmed.length < 2) {
            setNameError(t.nameTooShort);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
            return;
        }
        setPlayerName(trimmed);
        setIsEditingName(false);
        setNameError(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    };

    const handleCancelEditName = () => {
        setIsEditingName(false);
        setNameError(null);
        setNameDraft(playerName || '');
    };

    return (
        <AnimatedModal visible={visible} onClose={onClose} animation="scale">
            <WoodenCard title={t.playerStats} onClose={onClose} className="w-[95%]">

                {/* Header Profile */}
                <View className="items-center mb-6 border-b border-[#5a4025]/30 pb-6">
                    {/* Avatar (tap to cycle) */}
                    <TouchableOpacity
                        onPress={handleCycleAvatar}
                        activeOpacity={0.75}
                        accessibilityLabel={t.changeAvatar}
                    >
                        <View className="relative">
                            <View className="w-20 h-20 bg-[#3d2814] rounded-2xl border-2 border-[#ffd700] items-center justify-center mb-3 shadow-lg">
                                <Text className="text-5xl">{playerAvatar}</Text>
                            </View>
                            {/* Cycle hint badge */}
                            <View className="absolute -top-1 -left-1 bg-[#3d2814] w-7 h-7 rounded-full border border-[#ffd700] items-center justify-center">
                                <RotateCw size={12} color="#ffd700" />
                            </View>
                            <View className="absolute -bottom-1 -right-1 bg-[#ffd700] w-8 h-8 rounded-full border-2 border-[#3d2814] items-center justify-center">
                                <Text className="text-[#3d2814] font-black text-xs">L{level}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Name (tap to edit) */}
                    {isEditingName ? (
                        <View className="w-full px-4 mb-2">
                            <WoodenInput
                                value={nameDraft}
                                onChangeText={(text) => {
                                    setNameDraft(text);
                                    if (nameError) setNameError(null);
                                }}
                                placeholder={t.playerNamePlaceholder}
                                maxLength={18}
                                autoFocus
                            />
                            {nameError && (
                                <Text className="text-red-400 text-xs mt-1 text-center">{nameError}</Text>
                            )}
                            <View className="flex-row gap-2 mt-2">
                                <WoodenButton onPress={handleSaveName} variant="gold" className="flex-1">
                                    <View className="flex-row items-center gap-1.5">
                                        <Check size={16} color="#3d2814" strokeWidth={3} />
                                        <Text className="text-[#3d2814] font-bold uppercase">{t.saveChanges}</Text>
                                    </View>
                                </WoodenButton>
                                <WoodenButton onPress={handleCancelEditName} variant="secondary" className="flex-1">
                                    <View className="flex-row items-center gap-1.5">
                                        <X size={16} color="#f5e6c8" strokeWidth={3} />
                                        <Text className="text-cream font-bold uppercase">{t.cancel}</Text>
                                    </View>
                                </WoodenButton>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={handleStartEditName}
                            activeOpacity={0.7}
                            className="flex-row items-center gap-2 mb-1"
                            accessibilityLabel={t.changeName}
                        >
                            <Text className="text-[#e8d4b8] text-2xl font-bold">{playerName || 'Player'}</Text>
                            <Pencil size={16} color="#ffd700" />
                        </TouchableOpacity>
                    )}

                    {!isEditingName && (
                        <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">
                            {t.tapToEdit}
                        </Text>
                    )}

                    <RankBadge tier={tier} size="sm" className="mb-4" />

                    {/* XP Progress Bar */}
                    <View className="w-full px-6">
                        <View className="flex-row justify-between mb-1">
                            <Text className="text-muted text-[10px] font-bold uppercase">Experience</Text>
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
                        <Text className="text-muted uppercase text-[10px] font-bold tracking-wider">{t.games}</Text>
                        <Text className="text-[#e8d4b8] text-2xl font-bold">{stats.gamesPlayed}</Text>
                    </View>

                    {/* Wins */}
                    <View className="w-[48%] bg-[#2d1f10] p-4 rounded-xl border border-[#5a4025] items-center">
                        <Crown color="#ffd700" size={24} style={{ marginBottom: 4 }} />
                        <Text className="text-muted uppercase text-[10px] font-bold tracking-wider">{t.wins}</Text>
                        <Text className="text-[#ffd700] text-2xl font-bold">{stats.gamesWon}</Text>
                    </View>

                    {/* Win Rate */}
                    <View className="w-[48%] bg-[#2d1f10] p-4 rounded-xl border border-[#5a4025] items-center">
                        <Trophy color="#4ade80" size={24} style={{ marginBottom: 4 }} />
                        <Text className="text-muted uppercase text-[10px] font-bold tracking-wider">{t.winRate}</Text>
                        <Text className="text-[#4ade80] text-2xl font-bold">{winRate}%</Text>
                    </View>

                    {/* Earnings */}
                    <View className="w-[48%] bg-[#2d1f10] p-4 rounded-xl border border-[#5a4025] items-center">
                        <Coins color="#fbbf24" size={24} style={{ marginBottom: 4 }} />
                        <Text className="text-muted uppercase text-[10px] font-bold tracking-wider">{t.earnings}</Text>
                        <Text className="text-[#fbbf24] text-xl font-bold">{stats.totalEarnings}</Text>
                    </View>
                </View>

                <View className="mt-6 p-4 bg-[#2d1f10]/60 rounded-xl">
                    <Text className="text-muted text-xs text-center italic">
                        "Legendary players don't just clear lines, they clear the whole card."
                    </Text>
                </View>

            </WoodenCard>
        </AnimatedModal>
    );
};
