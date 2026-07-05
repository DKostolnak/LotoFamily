import React, { useCallback, useEffect, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { ModalShell, ListRow, WoodenButton } from '@/components/common';
import { useToast } from '@/components/ToastProvider';
import { translations, type TranslationKeys } from '@/lib/i18n';
import { useGameStore } from '@/lib/store';
import {
    acceptFriendRequest,
    fetchFriends,
    fetchPendingRequests,
    removeFriend,
    type FriendRecord,
    type PendingFriendRequest,
} from '@/lib/services/friends';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface FriendsModalProps {
    visible: boolean;
    onClose: () => void;
    roomCode?: string;
    onPendingCountChange?: (count: number) => void;
}

const formatInviteMessage = (t: TranslationKeys, url: string) => `${t.joinMyGame} ${url}`;

export function FriendsModal({
    visible,
    onClose,
    roomCode,
    onPendingCountChange,
}: FriendsModalProps) {
    const language = useGameStore((s) => s.language);
    const t = translations[language];
    const { showToast } = useToast();
    const [friends, setFriends] = useState<FriendRecord[]>([]);
    const [requests, setRequests] = useState<PendingFriendRequest[]>([]);
    const [busyId, setBusyId] = useState<string | null>(null);

    const showServiceError = useCallback(
        (error?: string) => {
            showToast(error === 'no_session' ? t.friendSignInRequired : t.connectionError, 'error', '⚠️');
        },
        [showToast, t.connectionError, t.friendSignInRequired]
    );

    const refresh = useCallback(async () => {
        const [friendsResult, requestsResult] = await Promise.all([
            fetchFriends(),
            fetchPendingRequests(),
        ]);

        if (friendsResult.success) {
            setFriends(friendsResult.data);
        } else {
            setFriends([]);
            if (friendsResult.error === 'no_session') showServiceError(friendsResult.error);
        }

        if (requestsResult.success) {
            setRequests(requestsResult.data);
            onPendingCountChange?.(requestsResult.data.length);
        } else {
            setRequests([]);
            onPendingCountChange?.(0);
            if (requestsResult.error === 'no_session') showServiceError(requestsResult.error);
        }
    }, [onPendingCountChange, showServiceError]);

    useEffect(() => {
        if (visible) {
            refresh();
        }
    }, [refresh, visible]);

    const handleAccept = useCallback(
        async (id: string) => {
            setBusyId(id);
            const result = await acceptFriendRequest(id);
            setBusyId(null);
            if (!result.success) {
                showServiceError(result.error);
                return;
            }
            refresh();
        },
        [refresh, showServiceError]
    );

    const handleRemove = useCallback(
        async (id: string) => {
            setBusyId(id);
            const result = await removeFriend(id);
            setBusyId(null);
            if (!result.success) {
                showServiceError(result.error);
                return;
            }
            refresh();
        },
        [refresh, showServiceError]
    );

    const handleInvite = useCallback(
        async () => {
            const url = roomCode
                ? Linking.createURL('/', { queryParams: { room: roomCode } })
                : Linking.createURL('/');
            await Share.share({
                message: formatInviteMessage(t, url),
                url,
                title: t.friendsTitle,
            });
        },
        [roomCode, t]
    );

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={t.friendsTitle}
            closeAccessibilityLabel={t.close}
            maxWidth={560}
        >
            <View style={styles.section}>
                <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
                    {t.friendRequestsSection}
                </Text>

                {requests.length === 0 ? (
                    <Text style={styles.emptyText}>{t.friendsEmpty}</Text>
                ) : (
                    requests.map((request) => (
                        <ListRow
                            key={request.id}
                            icon={<Text style={styles.avatar}>{request.requester.avatar}</Text>}
                            title={request.requester.nickname}
                            minHeight={72}
                            right={
                                <View style={styles.actions}>
                                    <WoodenButton
                                        size="sm"
                                        variant="gold"
                                        disabled={busyId === request.id}
                                        onPress={() => handleAccept(request.id)}
                                        accessibilityLabel={t.friendAccept}
                                        style={styles.smallButton}
                                    >
                                        {t.friendAccept}
                                    </WoodenButton>
                                    <WoodenButton
                                        size="sm"
                                        variant="secondary"
                                        disabled={busyId === request.id}
                                        onPress={() => handleRemove(request.id)}
                                        accessibilityLabel={t.friendDecline}
                                        style={styles.smallButton}
                                    >
                                        {t.friendDecline}
                                    </WoodenButton>
                                </View>
                            }
                        />
                    ))
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
                    {t.friendsSection}
                </Text>

                {friends.length === 0 ? (
                    <Text style={styles.emptyText}>{t.friendsEmpty}</Text>
                ) : (
                    friends.map((friendship) => (
                        <ListRow
                            key={friendship.id}
                            icon={<Text style={styles.avatar}>{friendship.friend.avatar}</Text>}
                            title={friendship.friend.nickname}
                            minHeight={72}
                            right={
                                <View style={styles.actions}>
                                    <WoodenButton
                                        size="sm"
                                        variant="gold"
                                        onPress={handleInvite}
                                        accessibilityLabel={t.friendInvite}
                                        style={styles.mediumButton}
                                    >
                                        {t.friendInvite}
                                    </WoodenButton>
                                    <WoodenButton
                                        size="sm"
                                        variant="secondary"
                                        disabled={busyId === friendship.id}
                                        onPress={() => handleRemove(friendship.id)}
                                        accessibilityLabel={t.friendRemove}
                                        style={styles.smallButton}
                                    >
                                        {t.friendRemove}
                                    </WoodenButton>
                                </View>
                            }
                        />
                    ))
                )}
            </View>
        </ModalShell>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: SPACING.sm,
    },
    sectionTitle: {
        ...TEXT_STYLES.captionUpper,
        color: '#ffd700',
        letterSpacing: 2,
    },
    emptyText: {
        ...TEXT_STYLES.body,
        color: '#d4b896',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        backgroundColor: 'rgba(26, 17, 9, 0.55)',
        borderRadius: RADII.md,
        borderWidth: 1,
        borderColor: 'rgba(90, 64, 37, 0.5)',
    },
    avatar: {
        fontSize: 24,
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: SPACING.sm,
        maxWidth: 220,
    },
    smallButton: {
        minWidth: 96,
    },
    mediumButton: {
        minWidth: 132,
    },
});

export default FriendsModal;
