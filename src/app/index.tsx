import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground, StatusBar, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { WoodenCard, WoodenButton, WoodenInput, CoinBadge, RankBadge, MainMenuSkeleton } from '@/components/common';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { getAvailableAvatars, getNextAvatar } from '@/lib/config/avatar.config';
import { SHOP_ITEMS } from '@/lib/shop';
import { analytics } from '@/lib/services/analytics';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { Settings, Trophy, Users, Gamepad2, UserPlus, Swords, HelpCircle, ChevronRight, Target, Globe } from 'lucide-react-native';
import { RulesModal } from '@/components/RulesModal';
import { ShopModal } from '@/components/ShopModal';
import { LocalGameModal } from '@/components/LocalGameModal';
import { QuestsModal } from '@/components/QuestsModal';
import DailyBonusModal from '@/components/DailyBonusModal';
import { StatsModal } from '@/components/StatsModal';
import { SettingsModal } from '@/components/SettingsModal';
import { LeaderboardModal } from '@/components/LeaderboardModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/hooks';
import ENV from '@/lib/config/env.config';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    interpolate,
    Easing,
} from 'react-native-reanimated';

const WOOD_TEXTURE = require('../../assets/wood-seamless.png');

export default function MainMenu() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        playerName, playerAvatar, coins, tier, language, isLoading, inventory,
        setPlayerName, setPlayerAvatar,
        initialize
    } = useGameStore();
    const { scaleIcon, responsive, isSmallScreen, isTablet } = useResponsive();

    const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
    const [roomCode, setRoomCode] = useState('');
    const [localName, setLocalName] = useState('');
    const [crazyMode, setCrazyMode] = useState(false);
    const [isPublic, setIsPublic] = useState(true);
    const [publicRooms, setPublicRooms] = useState<any[]>([]);

    type MenuModal = 'rules' | 'shop' | 'stats' | 'settings' | 'leaderboard' | 'quests' | 'local' | null;
    const [activeModal, setActiveModal] = useState<MenuModal>(null);
    const [showLocalModal, setShowLocalModal] = useState(false);

    const openModal = (modal: Exclude<MenuModal, null>) => setActiveModal(modal);
    const closeModal = () => setActiveModal(null);

    const [isMounted, setIsMounted] = useState(false);

    // Animation values
    const logoScale = useSharedValue(0.8);
    const logoGlow = useSharedValue(0);
    const profileSlide = useSharedValue(50);
    const buttonsSlide = useSharedValue(100);
    const footerOpacity = useSharedValue(0);

    // Initial Load & Animations
    // Run only on mount: initialize and start entrance animations
    useEffect(() => {
        initialize();
        analytics.logScreenView('main_menu');

        // Staggered entrance animations
        // Smoother entrance animations
        logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
        logoGlow.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.4, { duration: 2500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        profileSlide.value = withDelay(100, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
        buttonsSlide.value = withDelay(200, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
        footerOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    }, [initialize, logoScale, logoGlow, profileSlide, buttonsSlide, footerOpacity]);

    useEffect(() => {
        if (playerName) setLocalName(playerName);
    }, [playerName]);

    useEffect(() => {
        // Keep modal behavior polished: leaving the menu/form should always close any open modal
        setActiveModal(null);
    }, [mode]);

    useEffect(() => {
        const handleDeepLink = (event: { url: string }) => {
            const { queryParams } = Linking.parse(event.url);
            if (queryParams?.room) {
                setRoomCode(String(queryParams.room).toUpperCase());
                setMode('join');
            }
        };
        const subscription = Linking.addEventListener('url', handleDeepLink);
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        setIsMounted(true);
        if (mode === 'join') {
            fetch(`${ENV.server.url}/rooms/public`)
                .then(res => res.json())
                .then(data => setPublicRooms(data))
                .catch(err => console.error('Failed to fetch public rooms:', err));
        }
    }, [mode]);

    const t = translations[language];

    // Animated styles
    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
    }));

    const glowAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(logoGlow.value, [0, 1], [0.3, 0.8]),
        transform: [{ scale: interpolate(logoGlow.value, [0, 1], [1, 1.2]) }],
    }));

    const profileAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: profileSlide.value }],
        opacity: interpolate(profileSlide.value, [50, 0], [0, 1]),
    }));

    const buttonsAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: buttonsSlide.value }],
        opacity: interpolate(buttonsSlide.value, [100, 0], [0, 1]),
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
                public: isPublic ? '1' : '0'
            }
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
        if (localName.length < 2) {
            Alert.alert('Error', t.nameError);
            return;
        }
        setPlayerName(localName);
        router.push({ pathname: '/game', params: { mode: 'practice' } });
    };

    // Quick Action Button Component - Icon only, centered
    const QuickAction = ({ icon: Icon, onPress, color = "#e8d4b8", emoji, style }: any) => (
        <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); onPress(); }}
            className="flex-1 bg-[#1a1109] rounded-xl border border-[#3d2814] items-center justify-center active:bg-[#2d1f10]"
            style={[
                {
                    height: responsive(56, 72),
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                },
                style
            ]}
        >
            {emoji ? (
                <Text style={{ fontSize: responsive(24, 28) }}>{emoji}</Text>
            ) : (
                <Icon size={responsive(24, 28)} color={color} strokeWidth={2} />
            )}
        </TouchableOpacity>
    );

    const renderMenu = () => (
        <View className="w-full">
            {/* Premium Profile Card */}
            <Animated.View style={profileAnimatedStyle}>
                <TouchableOpacity
                    onPress={() => openModal('stats')}
                    className="flex-row items-center bg-[#2d1f10]/85 p-4 rounded-2xl mb-6 border-2 border-[#5a4025]/40 shadow-xl"
                    activeOpacity={0.8}
                >
                    {/* Avatar with glow ring */}
                    <View className="relative mr-4">
                        <View className="w-14 h-14 rounded-2xl bg-[#3d2814] border-2 border-[#ffd700]/40 items-center justify-center shadow-lg">
                            <Text className="text-4xl">{playerAvatar}</Text>
                        </View>
                        <View className="absolute -bottom-1 -right-1 bg-[#ffd700] w-6 h-6 rounded-full border border-[#3d2814] items-center justify-center">
                            <Text className="text-[#3d2814] font-black text-[9px]">L{Math.floor((useGameStore.getState().stats.xp || 0) / 100) + 1}</Text>
                        </View>
                    </View>

                    <View className="flex-1">
                        <View className="flex-row items-center gap-1.5 mb-1">
                            <Text className="text-[#ffd700] font-black text-xl tracking-tight leading-tight">{playerName || 'Player'}</Text>
                            <ChevronRight size={14} color="#ffd700" opacity={0.5} />
                        </View>

                        {/* Compact XP Bar */}
                        <View className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden border border-[#5a4025]/30">
                            <View
                                className="h-full bg-blue-500"
                                style={{ width: `${((useGameStore.getState().stats.xp || 0) % 100)}%` }}
                            />
                        </View>
                        <Text className="text-[#8b6b4a] text-[8px] font-bold uppercase mt-1 tracking-widest">
                            {((useGameStore.getState().stats.xp || 0) % 100)}/100 XP
                        </Text>
                    </View>

                    <View className="items-end">
                        <RankBadge tier={tier} size="sm" />
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Main Game Buttons */}
            <Animated.View style={buttonsAnimatedStyle} className="gap-4 mb-8">
                {/* Primary: Create Game */}
                <WoodenButton
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        setMode('create');
                    }}
                    variant="gold"
                    size="lg"
                    fullWidth
                    style={{ height: 64, borderRadius: 16 }}
                >
                    <View className="flex-row items-center gap-3">
                        <Swords size={24} color="#3d2814" strokeWidth={2.5} />
                        <View className="items-start">
                            <Text className="text-[#3d2814] font-black text-xl uppercase tracking-widest">{t.createGame}</Text>
                            <Text className="text-[#3d2814]/70 text-[9px] font-bold uppercase tracking-widest">{t.hostOnline}</Text>
                        </View>
                    </View>
                </WoodenButton>

                <WoodenButton
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        setShowLocalModal(true);
                    }}
                    variant="secondary"
                    size="lg"
                    fullWidth
                    style={{ height: 64, borderRadius: 16, borderStyle: 'dashed' }}
                >
                    <View className="flex-row items-center gap-3">
                        <Globe size={24} color="#f5e6c8" strokeWidth={2.5} />
                        <View className="items-start">
                            <Text className="text-[#f5e6c8] font-black text-xl uppercase tracking-widest">WiFi Play</Text>
                            <Text className="text-[#f5e6c8]/70 text-[9px] font-bold uppercase tracking-widest">No Internet Needed</Text>
                        </View>
                    </View>
                </WoodenButton>

                {/* Secondary Row */}
                <View className="flex-row gap-3">
                    <WoodenButton
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setMode('join');
                        }}
                        variant="info"
                        className="flex-1"
                        style={{ minHeight: 70, borderRadius: 16 }}
                    >
                        <View className="flex-row items-center gap-2">
                            <UserPlus size={22} color="#fff" strokeWidth={2} />
                            <Text className="text-white font-bold text-lg uppercase tracking-wider">{t.joinGame}</Text>
                        </View>
                    </WoodenButton>

                    <WoodenButton
                        onPress={handlePractice}
                        variant="secondary"
                        className="flex-1"
                        style={{ minHeight: 70, borderRadius: 16 }}
                    >
                        <View className="flex-row items-center gap-2">
                            <Gamepad2 size={22} color="#f5e6c8" strokeWidth={2} />
                            <Text className="text-[#f5e6c8] font-bold text-lg uppercase tracking-wider">{t.practice}</Text>
                        </View>
                    </WoodenButton>
                </View>
            </Animated.View>

            {/* Quick Actions Row - Four icons, no text */}
            <Animated.View style={buttonsAnimatedStyle}>
                <View className="flex-row" style={{ gap: responsive(8, 12) }}>
                    <QuickAction
                        icon={Target}
                        onPress={() => openModal('quests')}
                        color="#ffffff"
                    />
                    <QuickAction
                        icon={Trophy}
                        onPress={() => openModal('stats')}
                        color="#ffd700"
                    />
                    <QuickAction
                        icon={Users}
                        onPress={() => openModal('leaderboard')}
                        color="#4ade80"
                    />
                    <QuickAction
                        emoji="🛒"
                        onPress={() => openModal('shop')}
                    />
                    <QuickAction
                        icon={Settings}
                        onPress={() => openModal('settings')}
                        color="#9ca3af"
                    />
                </View>
            </Animated.View>

            {/* In-Card Helper Button */}
            <TouchableOpacity
                onPress={() => openModal('rules')}
                className="mt-6 flex-row items-center justify-center gap-2 py-2 opacity-50 active:opacity-100"
            >
                <HelpCircle size={14} color="#8b6b4a" />
                <Text className="text-[#8b6b4a] text-[10px] font-bold uppercase tracking-widest">{t.howToPlay}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderForm = () => (
        <View className="w-full gap-5">
            {/* Player Info */}
            <View>
                <View className="flex-row gap-3 mb-3">
                    <TouchableOpacity
                        className="w-[70px] h-[70px] rounded-2xl bg-[#3d2814] border-2 border-[#5a4025] items-center justify-center shadow-lg transform active:scale-95"
                        onPress={() => {
                            Haptics.selectionAsync();
                            // Get purchased avatar icons from shop inventory
                            const purchasedAvatarIcons = SHOP_ITEMS
                                .filter(item => item.category === 'avatar' && inventory.includes(item.id))
                                .map(item => item.icon);
                            // Use helper to get available avatars and cycle through
                            const allAvatars = getAvailableAvatars(purchasedAvatarIcons);
                            const next = getNextAvatar(playerAvatar, allAvatars);
                            setPlayerAvatar(next);
                        }}
                    >
                        <Text className="text-4xl">{playerAvatar}</Text>
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
                <Text className="text-[#5a4025] text-xs text-center font-medium italic">{t.selectAvatar}</Text>
            </View>

            {/* Mode Inputs */}
            {mode === 'create' ? (
                <View className="gap-6">
                    <View>
                        <WoodenInput
                            label={`${t.roomCode} (${t.optionalLabel})`}
                            value={roomCode}
                            onChangeText={(text) => setRoomCode(text.toUpperCase())}
                            placeholder="AUTO"
                            maxLength={8}
                            style={{ textAlign: 'center', letterSpacing: 2 }}
                        />
                        <Text className="text-[#5a4025] text-xs mt-2 text-center">{t.customCodeHelp}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setCrazyMode(!crazyMode)}
                        className={`w-full p-4 rounded-xl border-2 flex-row items-center justify-between ${crazyMode ? 'bg-[#2d1f10] border-[#ffd700]' : 'bg-[#1a1109] border-[#3d2814]'}`}
                    >
                        <View className="flex-row items-center gap-3">
                            <Text className="text-2xl">🎲</Text>
                            <View>
                                <Text className={`font-bold ${crazyMode ? 'text-[#ffd700]' : 'text-[#8b6b4a]'}`}>{t.crazyMode}</Text>
                                <Text className="text-[#5a4025] text-xs">{t.crazyModeDesc}</Text>
                            </View>
                        </View>
                        <View className={`w-12 h-7 rounded-full justify-center ${crazyMode ? 'bg-[#ffd700]' : 'bg-[#3d2814]'}`}>
                            <View className={`w-6 h-6 rounded-full bg-white absolute ${crazyMode ? 'right-0.5' : 'left-0.5'}`} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setIsPublic(!isPublic)}
                        className={`w-full p-4 rounded-xl border-2 flex-row items-center justify-between ${isPublic ? 'bg-[#2d1f10] border-[#4ade80]' : 'bg-[#1a1109] border-[#3d2814]'}`}
                    >
                        <View className="flex-row items-center gap-3">
                            <Text className="text-2xl">{isPublic ? '🌐' : '🔒'}</Text>
                            <View>
                                <Text className={`font-bold ${isPublic ? 'text-[#4ade80]' : 'text-[#8b6b4a]'}`}>{isPublic ? t.public : t.private}</Text>
                                <Text className="text-[#5a4025] text-xs">{isPublic ? t.publicDesc : t.privateDesc}</Text>
                            </View>
                        </View>
                        <View className={`w-12 h-7 rounded-full justify-center ${isPublic ? 'bg-[#4ade80]' : 'bg-[#3d2814]'}`}>
                            <View className={`w-6 h-6 rounded-full bg-white absolute ${isPublic ? 'right-0.5' : 'left-0.5'}`} />
                        </View>
                    </TouchableOpacity>
                </View>
            ) : (
                <View className="gap-4">
                    <WoodenInput
                        label={t.roomCode}
                        value={roomCode}
                        onChangeText={(text) => setRoomCode(text.toUpperCase())}
                        placeholder={t.roomCodePlaceholder}
                        maxLength={8}
                        style={{ textAlign: 'center', fontSize: 24, letterSpacing: 4 }}
                    />

                    {publicRooms.length > 0 && (
                        <View className="mt-2">
                            <Text className="text-[#8b6b4a] text-[10px] font-bold uppercase mb-2 tracking-widest text-center">
                                or browse public rooms
                            </Text>
                            <View className="gap-2">
                                {publicRooms.map((room) => (
                                    <TouchableOpacity
                                        key={room.id}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setRoomCode(room.code);
                                        }}
                                        className={`flex-row items-center p-3 rounded-xl border ${roomCode === room.code ? 'bg-[#3d2814] border-[#ffd700]' : 'bg-[#1a1109] border-[#3d2814]'}`}
                                    >
                                        <View className="w-8 h-8 rounded-lg bg-[#2d1f10] items-center justify-center mr-3">
                                            <Text className="text-lg">🐙</Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[#e8d4b8] font-bold text-base">{room.code}</Text>
                                            <Text className="text-[#5a4025] text-[10px]">Host: {room.hostId.substring(0, 8)}...</Text>
                                        </View>
                                        <View className="flex-row items-center gap-1">
                                            <Users size={12} color="#8b6b4a" />
                                            <Text className="text-[#8b6b4a] font-bold text-xs">{room.players.length}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}

            <WoodenButton
                onPress={mode === 'create' ? handleCreate : handleJoin}
                variant="gold"
                size="lg"
                fullWidth
                style={{ marginTop: 8, borderRadius: 16 }}
            >
                {mode === 'create' ? t.createBtn : t.joinBtn}
            </WoodenButton>
        </View>
    );

    return (
        <ImageBackground source={WOOD_TEXTURE} style={{ flex: 1 }} resizeMode="repeat">
            <StatusBar barStyle="light-content" />

            {/* Premium Overlay with Vignette */}
            <View className="absolute inset-0 bg-black/50" pointerEvents="none" />
            <View
                className="absolute inset-0"
                pointerEvents="none"
                style={{
                    backgroundColor: 'transparent',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 100,
                }}
            />

            {isLoading ? (
                <View style={{ paddingTop: insets.top + 20 }}>
                    <MainMenuSkeleton />
                </View>
            ) : (
                <>
                    {/* Coin Badge - Fixed Top Right (outside ScrollView) */}
                    <View className="absolute right-4 z-50" style={{ top: insets.top + 8 }}>
                        <CoinBadge coins={coins} size="md" />
                    </View>

                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            padding: 20,
                            paddingTop: mode === 'menu' ? insets.top + 80 : insets.top + 20,
                            paddingBottom: insets.bottom + 80,
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Logo Section - Only show in menu mode */}
                        {mode === 'menu' && (
                            <View className="items-center mb-8">
                                {/* Glow Effect */}
                                <Animated.View
                                    style={[glowAnimatedStyle]}
                                    className="absolute w-32 h-32 rounded-full bg-[#ffd700]/30"
                                />

                                <Animated.View style={logoAnimatedStyle} className="items-center">
                                    <Text style={{ fontSize: 64, lineHeight: 80 }}>🎱</Text>
                                    <Text
                                        className="font-black text-[#ffd700] text-5xl uppercase tracking-[6px] mt-2"
                                        style={{
                                            textShadowColor: '#b8860b',
                                            textShadowOffset: { width: 0, height: 4 },
                                            textShadowRadius: 0,
                                            fontSize: responsive(40, 48, 54)
                                        }}
                                    >
                                        {t.title}
                                    </Text>
                                    <Text className="text-[#8b6b4a] font-bold text-[10px] tracking-[4px] uppercase mt-1">
                                        {t.subtitle}
                                    </Text>
                                </Animated.View>
                            </View>
                        )}

                        {/* Form Header for Create/Join - Clean compact header */}
                        {mode !== 'menu' && (
                            <View className="flex-row items-center mb-6" style={{ paddingTop: insets.top > 20 ? 0 : 20 }}>
                                <TouchableOpacity
                                    onPress={() => setMode('menu')}
                                    className="w-12 h-12 rounded-xl bg-[#2d1f10] border border-[#5a4025] items-center justify-center mr-4"
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 3,
                                    }}
                                >
                                    <ChevronRight size={24} color="#e8d4b8" style={{ transform: [{ rotate: '180deg' }] }} />
                                </TouchableOpacity>
                                <View className="flex-1">
                                    <Text className="text-[#8b6b4a] text-xs font-bold uppercase tracking-wider mb-1">
                                        {mode === 'create' ? t.hostOnline : 'Enter Room'}
                                    </Text>
                                    <Text
                                        className="font-black text-[#ffd700] text-2xl uppercase tracking-widest"
                                        style={{
                                            textShadowColor: '#b8860b',
                                            textShadowOffset: { width: 0, height: 2 },
                                            textShadowRadius: 0,
                                        }}
                                    >
                                        {mode === 'create' ? t.createGame : t.joinGame}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Main Content Card */}
                        <WoodenCard
                            showBackArrow={false}
                            className="mb-4"
                        >
                            {mode === 'menu' ? renderMenu() : renderForm()}
                        </WoodenCard>
                    </ScrollView>
                </>
            )}

            {/* Removed the overlapping absolute footer button */}

            {activeModal === 'rules' && <RulesModal visible={true} onClose={closeModal} t={t} />}
            {activeModal === 'shop' && isMounted && <ShopModal visible={true} onClose={closeModal} />}
            {activeModal === 'stats' && <StatsModal visible={true} onClose={closeModal} />}
            {activeModal === 'settings' && <SettingsModal visible={true} onClose={closeModal} />}
            {activeModal === 'leaderboard' && <LeaderboardModal visible={true} onClose={closeModal} />}
            {activeModal === 'quests' && <QuestsModal visible={true} onClose={closeModal} />}
            <LocalGameModal visible={showLocalModal} onClose={() => setShowLocalModal(false)} />
            <DailyBonusModal />
            <OnboardingModal />
        </ImageBackground>
    );
}
