import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import {
    WoodenCard,
    WoodenButton,
    WoodenInput,
    MainMenuSkeleton,
    EmptyState,
    LeaderboardSkeleton,
    SkeletonList,
    StickyHeader,
    DailyBonusCard,
    SeasonPassChip,
    FreeCoinsCTA,
    PlayNowButton,
    HomeFooter,
    ModePickerSheet,
    WoodBackground,
} from '@/components/common';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { getAvailableAvatars, getNextAvatar } from '@/lib/config/avatar.config';
import { SHOP_ITEMS } from '@/lib/shop';
import { analytics } from '@/lib/services/analytics';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import {
    Users,
    ChevronRight,
    Inbox,
} from 'lucide-react-native';
import { RulesModal } from '@/components/RulesModal';
import { ShopModal } from '@/components/ShopModal';
import { QuestsModal } from '@/components/QuestsModal';
import DailyBonusModal from '@/components/DailyBonusModal';
import { StatsModal } from '@/components/StatsModal';
import { SettingsModal } from '@/components/SettingsModal';
import { LeaderboardModal } from '@/components/LeaderboardModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { BattlePassModal } from '@/components/BattlePassModal';
import { FriendsModal } from '@/components/FriendsModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/hooks';
import { supabase } from '@/lib/services/supabase';
import { fetchPendingRequests } from '@/lib/services/friends';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    interpolate,
    Easing,
} from 'react-native-reanimated';

export default function MainMenu() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        playerName,
        playerAvatar,
        coins,
        language,
        isLoading,
        inventory,
        lastDailyBonus,
        addCoins,
        setPlayerName,
        setPlayerAvatar,
        initialize,
    } = useGameStore();
    const pendingDeepLink = useGameStore((s) => s.pendingDeepLink);
    const setPendingDeepLink = useGameStore((s) => s.setPendingDeepLink);
    // Reactive XP read so the level pill / progress bar update on stat changes.
    const xp = useGameStore((s) => s.stats.xp || 0);
    const currentStreak = useGameStore((s) => s.stats.currentStreak ?? 0);
    const level = Math.floor(xp / 100) + 1;
    const xpProgress = xp % 100;
    const { responsive } = useResponsive();

    const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
    const [modePickerOpen, setModePickerOpen] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [localName, setLocalName] = useState('');
    const [crazyMode, setCrazyMode] = useState(false);
    const [isPublic, setIsPublic] = useState(true);
    const [publicRooms, setPublicRooms] = useState<any[]>([]);
    const [publicRoomsState, setPublicRoomsState] = useState<'idle' | 'loading' | 'error' | 'loaded'>('idle');
    const [publicRoomsError, setPublicRoomsError] = useState<string | null>(null);
    const [publicRoomsRefreshKey, setPublicRoomsRefreshKey] = useState(0);
    const [joinedViaInvite, setJoinedViaInvite] = useState(false);

    type MenuModal = 'rules' | 'shop' | 'stats' | 'settings' | 'leaderboard' | 'quests' | 'seasonPass' | 'friends' | null;
    const [activeModal, setActiveModal] = useState<MenuModal>(null);
    const [pendingFriendCount, setPendingFriendCount] = useState(0);

    const openModal = (modal: Exclude<MenuModal, null>) => setActiveModal(modal);
    const closeModal = () => setActiveModal(null);

    const [isMounted, setIsMounted] = useState(false);

    // Animation values
    const logoScale = useSharedValue(0.85);
    const profileSlide = useSharedValue(40);
    const buttonsSlide = useSharedValue(60);
    const footerOpacity = useSharedValue(0);

    useEffect(() => {
        initialize();
        analytics.logScreenView('main_menu');

        // Smooth entrance animations (no infinite loops — battery-friendly)
        logoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
        profileSlide.value = withDelay(100, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
        buttonsSlide.value = withDelay(200, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
        footerOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    }, [initialize, logoScale, profileSlide, buttonsSlide, footerOpacity]);

    useEffect(() => {
        if (playerName) setLocalName(playerName);
    }, [playerName]);

    useEffect(() => {
        // Leaving the menu/form should always close any open modal
        setActiveModal(null);
    }, [mode]);

    const refreshPendingFriends = useCallback(async () => {
        const result = await fetchPendingRequests();
        setPendingFriendCount(result.success ? result.data.length : 0);
    }, []);

    useEffect(() => {
        refreshPendingFriends();
    }, [refreshPendingFriends, activeModal]);

    // Handle deep-links from push notification taps
    useEffect(() => {
        if (!pendingDeepLink) return;
        if (pendingDeepLink === 'season_ending') {
            setActiveModal('seasonPass');
        }
        // 'daily_bonus' is handled automatically by DailyBonusModal on mount
        setPendingDeepLink(null);
    }, [pendingDeepLink, setPendingDeepLink]);

    useEffect(() => {
        const handleDeepLink = (event: { url: string }) => {
            const { queryParams } = Linking.parse(event.url);
            if (queryParams?.room) {
                setRoomCode(String(queryParams.room).toUpperCase());
                setMode('join');
                setJoinedViaInvite(true);
            }
        };
        // Cold-start: app launched directly from a deep link
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink({ url });
        }).catch(() => {});
        const subscription = Linking.addEventListener('url', handleDeepLink);
        return () => subscription.remove();
    }, []);

    // Clear the invite banner when leaving join mode so it doesn't reappear
    // if the user opens Join again manually.
    useEffect(() => {
        if (mode !== 'join') setJoinedViaInvite(false);
    }, [mode]);

    useEffect(() => {
        setIsMounted(true);
        if (mode !== 'join') return;

        let cancelled = false;
        setPublicRoomsState('loading');
        setPublicRoomsError(null);

        (supabase.from('game_rooms') as any)
            .select('id, room_code, host_id, players, settings, created_at')
            .eq('phase', 'lobby')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(20)
            .then(({ data, error }: { data: any[] | null; error: any }) => {
                if (cancelled) return;
                if (error) throw new Error(error.message ?? 'Supabase error');
                const rooms = (data ?? [])
                    .map((r: any) => ({
                        id: r.id,
                        code: r.room_code,
                        hostId: r.host_id ?? '',
                        players: Array.isArray(r.players) ? r.players : [],
                    }));
                setPublicRooms(rooms);
                setPublicRoomsState('loaded');
            })
            .catch((err: Error) => {
                if (cancelled) return;
                console.error('[PublicRooms] fetch failed:', err);
                setPublicRoomsError(err?.message ?? 'Unknown error');
                setPublicRoomsState('error');
            });

        return () => {
            cancelled = true;
        };
    }, [mode, publicRoomsRefreshKey]);

    const t = translations[language] as any;

    // Localized fallbacks for keys that may not exist yet (parallel agent task)
    const labelPracticeVsBots = t.practiceVsBots ?? t.crazyModeDesc ?? 'Vs Bots';
    const labelHostOnline = t.hostOnline ?? 'Host';
    const labelJoinByCode = t.joinByCode ?? t.roomCodePlaceholder ?? 'Code';
    const labelDailyBonus = t.dailyBonus ?? 'Daily Bonus';
    const labelClaim = t.claimNow ?? t.claimAndPlay ?? 'CLAIM';
    const labelNextIn = t.nextBonusIn ?? 'Next in';
    const labelFreeCoins = t.freeCoins ?? 'Get free coins';
    const labelWatchAd = t.watchAd ?? 'WATCH';
    const labelAvailableIn = t.availableIn ?? 'Available in';

    // Animated styles
    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: interpolate(logoScale.value, [0.85, 1], [0, 1]),
    }));

    const profileAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: profileSlide.value }],
        opacity: interpolate(profileSlide.value, [40, 0], [0, 1]),
    }));

    const buttonsAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: buttonsSlide.value }],
        opacity: interpolate(buttonsSlide.value, [60, 0], [0, 1]),
    }));

    const footerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: footerOpacity.value,
    }));

    const handleCreate = () => {
        if (localName.length < 2) {
            Alert.alert('Error', t.nameError);
            return;
        }
        setPlayerName(localName);
        router.push({
            pathname: '/game',
            params: {
                mode: 'create',
                room: roomCode,
                crazy: crazyMode ? '1' : undefined,
                public: isPublic ? '1' : '0',
            },
        });
    };

    const handleJoin = () => {
        if (localName.length < 2) {
            Alert.alert('Error', t.nameError);
            return;
        }
        if (roomCode.length < 6) {
            Alert.alert('Error', t.codeError);
            return;
        }
        setPlayerName(localName);
        router.push({ pathname: '/game', params: { mode: 'join', room: roomCode } });
    };

    const handlePractice = () => {
        const name = localName || playerName;
        if (!name || name.length < 2) {
            // Silently set a default; practice should be friction-free
            const fallback = name && name.length >= 2 ? name : 'Player';
            setPlayerName(fallback);
        } else {
            setPlayerName(name);
        }
        router.push({ pathname: '/game', params: { mode: 'practice' } });
    };

    const handleClaimDailyBonus = () => {
        // The DailyBonusModal calls checkDailyBonus on mount and shows itself.
        // We force a remount via state; simpler is to just open the modal —
        // but the modal already manages its own visibility. Here we just
        // trigger a no-op refresh: the existing modal will pop next mount.
        // Quickest fix: manually call store.checkDailyBonus and rely on the
        // modal's internal state next mount. To keep UX immediate, we open
        // a small inline acknowledgement by triggering the modal directly.
        // Simplest reliable path: call checkDailyBonus and add coins fallback.
        const bonus = useGameStore.getState().checkDailyBonus();
        if (bonus > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const labelPlayNow = (t.playNow ?? t.play ?? 'PLAY NOW') as string;
    const labelTapToChoose = (t.tapToChoose ?? t.choosePlayMode ?? 'Tap to choose a game') as string;
    const labelChooseGame = (t.chooseGame ?? t.choosePlayMode ?? 'Choose a game') as string;

    const renderMenu = () => (
        <View style={{ width: '100%' }}>
            {/* Hero zone — compact so SE screen fits without scrolling */}
            <Animated.View
                style={[
                    logoAnimatedStyle,
                    {
                        alignItems: 'center',
                        paddingTop: SPACING.md,
                        paddingBottom: SPACING.lg,
                    },
                ]}
            >
                <Text style={{ fontSize: 48, lineHeight: 56 }}>🎲</Text>
                <Text
                    style={[
                        TEXT_STYLES.display,
                        {
                            color: '#ffd700',
                            marginTop: SPACING.sm,
                            textShadowColor: '#b8860b',
                            textShadowOffset: { width: 0, height: 3 },
                            textShadowRadius: 0,
                        },
                    ]}
                    numberOfLines={1}
                >
                    {t.title ?? 'LOTO'}
                </Text>
                <Text
                    style={[
                        TEXT_STYLES.body,
                        { color: '#d4b896', marginTop: SPACING.xs, fontStyle: 'italic' },
                    ]}
                    numberOfLines={1}
                >
                    {t.subtitle ?? 'Rodinné hry'}
                </Text>
            </Animated.View>

            {/* Primary CTA */}
            <Animated.View style={[buttonsAnimatedStyle, { marginBottom: SPACING.md }]}>
                <PlayNowButton
                    onPress={() => setModePickerOpen(true)}
                    title={labelPlayNow}
                    subtitle={labelTapToChoose}
                />
            </Animated.View>

            {/* Inline chips — daily bonus only when ready, free coins always */}
            <Animated.View style={[footerAnimatedStyle, { gap: SPACING.sm, marginBottom: SPACING.sm }]}>
                <DailyBonusCard
                    compact
                    lastDailyBonus={lastDailyBonus}
                    onClaim={handleClaimDailyBonus}
                    currentStreak={currentStreak}
                    labels={{
                        ready: labelDailyBonus,
                        claim: labelClaim,
                        nextIn: labelNextIn,
                        streakTemplate: t.streakDays,
                    }}
                />
                <FreeCoinsCTA
                    compact
                    onReward={(amount) => addCoins(amount)}
                    labels={{
                        title: labelFreeCoins,
                        action: labelWatchAd,
                        cooldown: labelAvailableIn,
                    }}
                />
                <SeasonPassChip
                    onPress={() => openModal('seasonPass')}
                    label={t.seasonPass ?? 'Season Pass'}
                    claimLabel={t.claim ?? 'Claim'}
                    levelLabel={t.seasonLevel ?? t.level ?? 'Level'}
                />
            </Animated.View>
        </View>
    );

    const renderForm = () => (
        <View style={{ width: '100%', gap: SPACING.xl }}>
            {/* Player Info */}
            <View>
                <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md }}>
                    <TouchableOpacity
                        style={{
                            width: 70,
                            height: 70,
                            borderRadius: RADII.lg,
                            backgroundColor: '#3d2814',
                            borderWidth: 2,
                            borderColor: '#5a4025',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onPress={() => {
                            Haptics.selectionAsync();
                            const purchasedAvatarIcons = SHOP_ITEMS.filter(
                                (item) => item.category === 'avatar' && inventory.includes(item.id)
                            ).map((item) => item.icon);
                            const allAvatars = getAvailableAvatars(purchasedAvatarIcons);
                            const next = getNextAvatar(playerAvatar, allAvatars);
                            setPlayerAvatar(next);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={t.selectAvatar}
                    >
                        <Text style={{ fontSize: 36, lineHeight: 44 }}>{playerAvatar}</Text>
                    </TouchableOpacity>
                    <WoodenInput
                        label={t.playerName}
                        value={localName}
                        onChangeText={setLocalName}
                        placeholder={t.playerNamePlaceholder}
                        maxLength={18}
                        containerStyle={{ flex: 1 }}
                    />
                </View>
                <Text style={[TEXT_STYLES.caption, { color: '#5a4025', textAlign: 'center', fontStyle: 'italic' }]}>
                    {t.selectAvatar}
                </Text>
            </View>

            {/* Mode Inputs */}
            {mode === 'create' ? (
                <View style={{ gap: SPACING.xl }}>
                    <View>
                        <WoodenInput
                            label={`${t.roomCode} (${t.optionalLabel})`}
                            value={roomCode}
                            onChangeText={(text) => setRoomCode(text.toUpperCase())}
                            placeholder="AUTO"
                            maxLength={8}
                            style={{ textAlign: 'center', letterSpacing: 2 }}
                        />
                        <Text style={[TEXT_STYLES.caption, { color: '#5a4025', marginTop: SPACING.sm, textAlign: 'center' }]}>
                            {t.customCodeHelp}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setCrazyMode(!crazyMode)}
                        style={{
                            width: '100%',
                            padding: SPACING.lg,
                            borderRadius: RADII.lg,
                            borderWidth: 2,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: 64,
                            backgroundColor: crazyMode ? '#2d1f10' : '#1a1109',
                            borderColor: crazyMode ? '#ffd700' : '#3d2814',
                        }}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: crazyMode }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 }}>
                            <Text style={{ fontSize: 28, lineHeight: 32 }}>🎲</Text>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={[TEXT_STYLES.bodyBold, { color: crazyMode ? '#ffd700' : '#d4b896' }]} numberOfLines={1}>
                                    {t.crazyMode}
                                </Text>
                                <Text style={[TEXT_STYLES.caption, { color: '#5a4025' }]} numberOfLines={2}>
                                    {t.crazyModeDesc}
                                </Text>
                            </View>
                        </View>
                        <View
                            style={{
                                width: 48,
                                height: 28,
                                borderRadius: RADII.pill,
                                backgroundColor: crazyMode ? '#ffd700' : '#3d2814',
                                justifyContent: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: RADII.pill,
                                    backgroundColor: '#fff',
                                    position: 'absolute',
                                    [crazyMode ? 'right' : 'left']: 2,
                                }}
                            />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setIsPublic(!isPublic)}
                        style={{
                            width: '100%',
                            padding: SPACING.lg,
                            borderRadius: RADII.lg,
                            borderWidth: 2,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: 64,
                            backgroundColor: isPublic ? '#2d1f10' : '#1a1109',
                            borderColor: isPublic ? '#4ade80' : '#3d2814',
                        }}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: isPublic }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 }}>
                            <Text style={{ fontSize: 28, lineHeight: 32 }}>{isPublic ? '🌐' : '🔒'}</Text>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={[TEXT_STYLES.bodyBold, { color: isPublic ? '#4ade80' : '#d4b896' }]} numberOfLines={1}>
                                    {isPublic ? t.public : t.private}
                                </Text>
                                <Text style={[TEXT_STYLES.caption, { color: '#5a4025' }]} numberOfLines={2}>
                                    {isPublic ? t.publicDesc : t.privateDesc}
                                </Text>
                            </View>
                        </View>
                        <View
                            style={{
                                width: 48,
                                height: 28,
                                borderRadius: RADII.pill,
                                backgroundColor: isPublic ? '#4ade80' : '#3d2814',
                                justifyContent: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: RADII.pill,
                                    backgroundColor: '#fff',
                                    position: 'absolute',
                                    [isPublic ? 'right' : 'left']: 2,
                                }}
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ gap: SPACING.lg }}>
                    {joinedViaInvite && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: SPACING.sm,
                                paddingVertical: SPACING.sm,
                                paddingHorizontal: SPACING.md,
                                borderRadius: RADII.lg,
                                borderWidth: 1,
                                borderColor: '#ffd700',
                                backgroundColor: 'rgba(255, 215, 0, 0.08)',
                            }}
                            accessibilityRole="text"
                        >
                            <Text style={{ fontSize: 18, lineHeight: 22 }}>👋</Text>
                            <Text
                                style={[TEXT_STYLES.bodyBold, { color: '#ffd700', textAlign: 'center', flexShrink: 1 }]}
                                numberOfLines={2}
                            >
                                {(t as any).invitedToJoin ?? "You're joining via invite"}
                            </Text>
                        </View>
                    )}
                    <WoodenInput
                        label={t.roomCode}
                        value={roomCode}
                        onChangeText={(text) => setRoomCode(text.toUpperCase())}
                        placeholder={t.roomCodePlaceholder}
                        maxLength={8}
                        style={{ textAlign: 'center', fontSize: 24, letterSpacing: 4 }}
                    />

                    <View style={{ marginTop: SPACING.sm }}>
                        <Text
                            style={[
                                TEXT_STYLES.captionUpper,
                                { color: '#d4b896', textAlign: 'center', marginBottom: SPACING.sm },
                            ]}
                        >
                            {t.browsePublicRooms}
                        </Text>

                        {publicRoomsState === 'loading' && (
                            <View style={{ paddingVertical: SPACING.sm }}>
                                <SkeletonList count={3} ItemSkeleton={LeaderboardSkeleton} />
                            </View>
                        )}

                        {publicRoomsState === 'error' && (
                            <View
                                style={{
                                    paddingVertical: SPACING.sm,
                                    paddingHorizontal: SPACING.lg,
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                    borderRadius: RADII.lg,
                                    borderWidth: 1,
                                    borderColor: 'rgba(239, 68, 68, 0.3)',
                                }}
                            >
                                <Text style={[TEXT_STYLES.bodyBold, { color: '#ef4444', marginTop: SPACING.md, marginBottom: SPACING.xs }]}>
                                    {t.noConnection}
                                </Text>
                                <Text style={[TEXT_STYLES.caption, { color: '#d4b896', textAlign: 'center', marginBottom: SPACING.md }]}>
                                    {publicRoomsError}
                                </Text>
                                <WoodenButton
                                    onPress={() => setPublicRoomsRefreshKey((k) => k + 1)}
                                    variant="secondary"
                                    size="sm"
                                    style={{ marginBottom: SPACING.md }}
                                >
                                    {t.retry}
                                </WoodenButton>
                            </View>
                        )}

                        {publicRoomsState === 'loaded' && publicRooms.length === 0 && (
                            <EmptyState title={t.noPublicRooms} description={t.noPublicRoomsDesc} icon={Inbox} />
                        )}

                        {publicRoomsState === 'loaded' && publicRooms.length > 0 && (
                            <View style={{ gap: SPACING.sm }}>
                                {publicRooms.map((room) => (
                                    <TouchableOpacity
                                        key={room.id}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setRoomCode(room.code);
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            padding: SPACING.md,
                                            borderRadius: RADII.lg,
                                            borderWidth: 1,
                                            minHeight: 56,
                                            backgroundColor: roomCode === room.code ? '#3d2814' : '#1a1109',
                                            borderColor: roomCode === room.code ? '#ffd700' : '#3d2814',
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel={`${room.code}, ${room.players.length} ${t.players}`}
                                    >
                                        <View
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: RADII.md,
                                                backgroundColor: '#2d1f10',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: SPACING.md,
                                            }}
                                        >
                                            <Text style={{ fontSize: 20, lineHeight: 24 }}>🐙</Text>
                                        </View>
                                        <View style={{ flex: 1, minWidth: 0 }}>
                                            <Text style={[TEXT_STYLES.bodyBold, { color: '#e8d4b8' }]} numberOfLines={1}>
                                                {room.code}
                                            </Text>
                                            <Text style={[TEXT_STYLES.caption, { color: '#5a4025' }]} numberOfLines={1}>
                                                Host: {room.hostId.substring(0, 8)}...
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                                            <Users size={14} color="#d4b896" />
                                            <Text style={[TEXT_STYLES.bodySmall, { color: '#d4b896', fontWeight: '700' }]}>
                                                {room.players.length}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            )}

            <WoodenButton
                onPress={mode === 'create' ? handleCreate : handleJoin}
                variant="gold"
                size="lg"
                fullWidth
                style={{ marginTop: SPACING.sm, borderRadius: RADII.lg }}
            >
                {mode === 'create' ? t.createBtn : t.joinBtn}
            </WoodenButton>
        </View>
    );

    return (
        <WoodBackground useFolkPattern={true} overlayOpacity={0.5}>

            {isLoading ? (
                <View style={{ paddingTop: insets.top + SPACING.xl }}>
                    <MainMenuSkeleton />
                </View>
            ) : (
                <>
                    {/* Sticky header — visible only in menu mode (compact) */}
                    {mode === 'menu' && (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
                            <StickyHeader
                                compact
                                avatar={playerAvatar}
                                name={playerName || 'Player'}
                                level={level}
                                xpProgress={xpProgress}
                                coins={coins}
                                topInset={insets.top}
                                onPressProfile={() => openModal('stats')}
                                onPressCoins={() => openModal('shop')}
                            />
                        </View>
                    )}

                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            flexGrow: 1,
                            padding: SPACING.lg,
                            paddingTop:
                                mode === 'menu'
                                    ? insets.top + 72 // compact sticky header height
                                    : insets.top + SPACING.lg,
                            paddingBottom:
                                mode === 'menu'
                                    ? SPACING.sm
                                    : insets.bottom + SPACING.xxl,
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Form Header for Create/Join */}
                        {mode !== 'menu' && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginBottom: SPACING.lg,
                                    paddingTop: insets.top > 20 ? 0 : SPACING.lg,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => setMode('menu')}
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: RADII.md,
                                        backgroundColor: '#2d1f10',
                                        borderWidth: 1,
                                        borderColor: '#5a4025',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: SPACING.lg,
                                    }}
                                    accessibilityRole="button"
                                    accessibilityLabel={t.back}
                                >
                                    <ChevronRight
                                        size={24}
                                        color="#e8d4b8"
                                        style={{ transform: [{ rotate: '180deg' }] }}
                                    />
                                </TouchableOpacity>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text
                                        style={[
                                            TEXT_STYLES.captionUpper,
                                            { color: '#d4b896', marginBottom: 2 },
                                        ]}
                                    >
                                        {mode === 'create' ? t.hostOnline : labelJoinByCode}
                                    </Text>
                                    <Text
                                        style={[
                                            TEXT_STYLES.h1,
                                            {
                                                color: '#ffd700',
                                                textTransform: 'uppercase',
                                                textShadowColor: '#b8860b',
                                                textShadowOffset: { width: 0, height: 2 },
                                                textShadowRadius: 0,
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {mode === 'create' ? t.createGame : t.joinGame}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Main Content */}
                        {mode === 'menu' ? (
                            renderMenu()
                        ) : (
                            <WoodenCard showBackArrow={false} className="mb-4">
                                {renderForm()}
                            </WoodenCard>
                        )}
                    </ScrollView>

                    {/* Home footer — minimalist 3-icon row, only on home menu */}
                    {mode === 'menu' && (
                        <Animated.View style={footerAnimatedStyle}>
                            <HomeFooter
                                onFriendsPress={() => openModal('friends')}
                                onStatsPress={() => openModal('stats')}
                                onShopPress={() => openModal('shop')}
                                onSettingsPress={() => openModal('settings')}
                                onHelpPress={() => openModal('rules')}
                                pendingFriendsCount={pendingFriendCount}
                                bottomInset={insets.bottom}
                                labels={{
                                    friends: t.friendsTitle,
                                    stats: t.statsTitle ?? t.playerStats ?? 'Stats',
                                    shop: t.shop ?? 'Shop',
                                    settings: t.settings ?? 'Settings',
                                    help: t.howToPlay ?? 'How to play',
                                }}
                            />
                        </Animated.View>
                    )}
                </>
            )}

            <ModePickerSheet
                visible={modePickerOpen}
                onClose={() => setModePickerOpen(false)}
                onPractice={() => {
                    setModePickerOpen(false);
                    handlePractice();
                }}
                onCreate={() => {
                    setModePickerOpen(false);
                    setMode('create');
                }}
                onJoin={() => {
                    setModePickerOpen(false);
                    setMode('join');
                }}
                labels={{
                    title: labelChooseGame,
                    practice: t.practice ?? 'Practice',
                    practiceSubtitle: labelPracticeVsBots,
                    create: t.createGame ?? 'Create Game',
                    createSubtitle: labelHostOnline,
                    join: t.joinGame ?? 'Join Game',
                    joinSubtitle: labelJoinByCode,
                }}
            />

            {activeModal === 'rules' && <RulesModal visible={true} onClose={closeModal} t={t} />}
            {activeModal === 'shop' && isMounted && <ShopModal visible={true} onClose={closeModal} />}
            {activeModal === 'stats' && <StatsModal visible={true} onClose={closeModal} />}
            {activeModal === 'settings' && <SettingsModal visible={true} onClose={closeModal} />}
            {activeModal === 'leaderboard' && <LeaderboardModal visible={true} onClose={closeModal} />}
            {activeModal === 'quests' && <QuestsModal visible={true} onClose={closeModal} />}
            {activeModal === 'seasonPass' && <BattlePassModal visible={true} onClose={closeModal} />}
            {activeModal === 'friends' && (
                <FriendsModal
                    visible={true}
                    onClose={closeModal}
                    onPendingCountChange={setPendingFriendCount}
                />
            )}
            <DailyBonusModal />
            <OnboardingModal />
        </WoodBackground>
    );
}
