import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Linking, Platform } from 'react-native';
import { Star } from 'lucide-react-native';
import { AnimatedModal } from './common';
import { WoodenButton, WoodenCard } from './common';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { APP_STORE_ID, PLAY_STORE_ID } from '@/lib/config';

const STORAGE_KEY = '@loto_rate_app';
const GAMES_BEFORE_PROMPT = 5;

interface RateAppState {
    hasRated: boolean;
    lastPromptTime: number;
    gamesPlayed: number;
    dismissed: number;
}

/**
 * Rate App Modal
 * 
 * Shows after user has played a certain number of games
 * Respects user's decision to not be prompted again
 */
export function RateAppModal() {
    const [visible, setVisible] = useState(false);
    const { stats, language } = useGameStore();
    const t = translations[language];

    const checkShouldShowPrompt = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            const state: RateAppState = stored ? JSON.parse(stored) : {
                hasRated: false,
                lastPromptTime: 0,
                gamesPlayed: 0,
                dismissed: 0,
            };

            // Don't show if already rated
            if (state.hasRated) return;

            // Don't show if dismissed 3+ times
            if (state.dismissed >= 3) return;

            // Don't show if shown in last 7 days
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            if (state.lastPromptTime > weekAgo) return;

            // Show if played enough games
            if (stats.gamesPlayed >= GAMES_BEFORE_PROMPT && stats.gamesPlayed > state.gamesPlayed) {
                setVisible(true);
                await saveState({ ...state, lastPromptTime: Date.now(), gamesPlayed: stats.gamesPlayed });
            }
        } catch (e) {
            console.warn('Failed to check rate app state:', e);
        }
    }, [stats.gamesPlayed]);

    useEffect(() => {
        checkShouldShowPrompt();
    }, [checkShouldShowPrompt]);

    const saveState = async (state: RateAppState) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save rate app state:', e);
        }
    };

    const handleRate = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Open app store using configured IDs
        const storeUrl = Platform.select({
            ios: `https://apps.apple.com/app/id${APP_STORE_ID}`,
            android: `market://details?id=${PLAY_STORE_ID}`,
            default: '',
        });

        if (storeUrl) {
            await Linking.openURL(storeUrl).catch(() => {
                // Fallback to web URL for Android
                Linking.openURL(`https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`);
            });
        }

        await saveState({
            hasRated: true,
            lastPromptTime: Date.now(),
            gamesPlayed: stats.gamesPlayed,
            dismissed: 0,
        });
        setVisible(false);
    };

    const handleLater = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const state: RateAppState = stored ? JSON.parse(stored) : {};
        await saveState({
            ...state,
            dismissed: (state.dismissed || 0) + 1,
            lastPromptTime: Date.now(),
        });
        setVisible(false);
    };

    return (
        <AnimatedModal visible={visible} onClose={handleLater} closeOnBackdrop={false}>
            <WoodenCard>
                <View className="items-center py-6 px-4">
                    {/* Stars */}
                    <View className="flex-row gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} size={28} color="#ffd700" fill="#ffd700" />
                        ))}
                    </View>

                    <Text className="text-[#ffd700] font-black text-2xl uppercase tracking-wider text-center mb-2">
                        {t.rateTitle || 'Enjoying LOTO?'}
                    </Text>
                    <Text className="text-[#8b6b4a] text-center mb-6">
                        {t.rateMessage || 'If you\'re having fun, please rate us! It helps others discover the game.'}
                    </Text>

                    <View className="w-full gap-3">
                        <WoodenButton variant="gold" fullWidth onPress={handleRate}>
                            <View className="flex-row items-center gap-2">
                                <Star size={20} color="#3d2814" fill="#3d2814" />
                                <Text className="text-[#3d2814] font-bold text-lg uppercase">
                                    {t.rateNow || 'Rate Now'}
                                </Text>
                            </View>
                        </WoodenButton>

                        <WoodenButton variant="secondary" fullWidth onPress={handleLater}>
                            {t.rateLater || 'Maybe Later'}
                        </WoodenButton>
                    </View>
                </View>
            </WoodenCard>
        </AnimatedModal>
    );
}
