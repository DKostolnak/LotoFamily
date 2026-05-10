import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { ModalShell, Section, ListRow, Badge, RankBadge, WoodenInput, WoodenButton } from '@/components/common';
import { TEXT_STYLES, SPACING } from '@/lib/config';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { SHOP_ITEMS } from '@/lib/shop';
import { getAvailableAvatars, getNextAvatar } from '@/lib/config/avatar.config';
import { BarChart2, Crown, Trophy, Coins, Pencil, RotateCw, Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

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
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={t.playerStats}
            subtitle={`${(t as any).level ?? 'Level'} ${level}`}
            headerRight={<RankBadge tier={tier} size="sm" />}
        >
            <Section title={(t as any).profileSection ?? 'Profile'}>
                <ListRow
                    icon={<Text style={{ fontSize: 28 }}>{playerAvatar}</Text>}
                    title={(t as any).changeAvatarTitle ?? t.changeAvatar}
                    subtitle={(t as any).tapToCycle ?? t.tapToEdit}
                    right={<RotateCw size={18} color="#ffd700" />}
                    onPress={handleCycleAvatar}
                />

                {isEditingName ? (
                    <View style={{ gap: SPACING.sm }}>
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
                            <Text style={[TEXT_STYLES.caption, { color: '#ef4444', textAlign: 'center' }]}>
                                {nameError}
                            </Text>
                        )}
                        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                            <WoodenButton onPress={handleSaveName} variant="gold" size="sm" fullWidth icon={<Check size={16} color="#3d2814" strokeWidth={3} />}>
                                {t.saveChanges}
                            </WoodenButton>
                            <WoodenButton onPress={handleCancelEditName} variant="secondary" size="sm" fullWidth icon={<X size={16} color="#f5e6c8" strokeWidth={3} />}>
                                {t.cancel}
                            </WoodenButton>
                        </View>
                    </View>
                ) : (
                    <ListRow
                        icon={<Pencil size={20} color="#ffd700" />}
                        title={playerName || 'Player'}
                        subtitle={t.tapToEdit}
                        right={<Pencil size={16} color="#ffd700" />}
                        onPress={handleStartEditName}
                    />
                )}

                <ListRow
                    icon={<Text style={[TEXT_STYLES.bodyBold, { color: '#ffd700' }]}>L{level}</Text>}
                    title={(t as any).experience ?? 'Experience'}
                    subtitle={`${xpInLevel} / 100 XP`}
                    right={<Badge label={`L${level}`} variant="gold" />}
                />
            </Section>

            <Section title={(t as any).statsSection ?? t.statsTitle}>
                <ListRow
                    icon={<BarChart2 size={20} color="#ffd700" />}
                    title={t.games}
                    right={<Badge label={String(stats.gamesPlayed)} variant="neutral" />}
                />
                <ListRow
                    icon={<Crown size={20} color="#ffd700" />}
                    title={t.wins}
                    right={<Badge label={String(stats.gamesWon)} variant="gold" />}
                />
                <ListRow
                    icon={<Trophy size={20} color="#4ade80" />}
                    title={t.winRate}
                    right={<Badge label={`${winRate}%`} variant="success" />}
                />
                <ListRow
                    icon={<Coins size={20} color="#ffd700" />}
                    title={t.earnings}
                    right={<Badge label={String(stats.totalEarnings)} variant="gold" />}
                />
            </Section>
        </ModalShell>
    );
};
