import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Linking, Platform } from 'react-native';
import { Star } from 'lucide-react-native';
import { ModalShell, WoodenButton } from './common';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { APP_STORE_ID, PLAY_STORE_ID, TEXT_STYLES, SPACING } from '@/lib/config';

const STORAGE_KEY = '@loto_rate_app';
const GAMES_BEFORE_PROMPT = 5;

interface RateAppState {
    hasRated: boolean;
    lastPromptTime: number;
    gamesPlayed: number;
    dismissed: number;
}

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

            if (state.hasRated) return;
            if (state.dismissed >= 3) return;
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            if (state.lastPromptTime > weekAgo) return;

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

        const storeUrl = Platform.select({
            ios: `https://apps.apple.com/app/id${APP_STORE_ID}`,
            android: `market://details?id=${PLAY_STORE_ID}`,
            default: '',
        });

        if (storeUrl) {
            await Linking.openURL(storeUrl).catch(() => {
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
        const state: RateAppState = stored ? JSON.parse(stored) : ({} as RateAppState);
        await saveState({
            ...state,
            dismissed: (state.dismissed || 0) + 1,
            lastPromptTime: Date.now(),
        });
        setVisible(false);
    };

    const footer = (
        <>
            <WoodenButton
                variant="gold"
                size="lg"
                fullWidth
                onPress={handleRate}
                icon={<Star size={20} color="#3d2814" fill="#3d2814" />}
            >
                {t.rateNow || 'Rate Now'}
            </WoodenButton>
            <WoodenButton variant="secondary" size="md" fullWidth onPress={handleLater}>
                {t.rateLater || 'Maybe Later'}
            </WoodenButton>
        </>
    );

    return (
        <ModalShell
            visible={visible}
            onClose={handleLater}
            title={t.rateTitle || 'Enjoying LOTO?'}
            subtitle={t.rateMessage || "If you're having fun, please rate us! It helps others discover the game."}
            hideClose
            noScroll
            footer={footer}
        >
            <View style={{ alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.lg }}>
                <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={36} color="#ffd700" fill="#ffd700" />
                    ))}
                </View>
                <Text
                    style={[
                        TEXT_STYLES.body,
                        { color: '#d4b896', textAlign: 'center' },
                    ]}
                >
                    {(t as any).rateThanks ?? 'Your feedback helps us grow!'}
                </Text>
            </View>
        </ModalShell>
    );
}
