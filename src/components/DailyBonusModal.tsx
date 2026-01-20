import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { AnimatedModal, WoodenButton, WoodenCard } from '@/components/common';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import * as Haptics from 'expo-haptics';

const DailyBonusModal = () => {
    const { checkDailyBonus, language } = useGameStore();
    const t = translations[language];
    const [visible, setVisible] = useState(false);
    const [amount, setAmount] = useState(0);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const hasChecked = useRef(false);

    useEffect(() => {
        // Only check once
        if (hasChecked.current) return;
        hasChecked.current = true;

        // Check for bonus on mount
        const bonus = checkDailyBonus();
        if (bonus > 0) {
            setAmount(bonus);
            setVisible(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Pop in animation
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7
            }).start();
        }
    }, [checkDailyBonus, scaleAnim]);

    const handleClaim = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setVisible(false);
    };

    return (
        <AnimatedModal
            visible={visible}
            onClose={handleClaim}
            animation="scale"
            closeOnBackdrop={false}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', maxWidth: 380 }}>
                <WoodenCard
                    title={(t.dailyBonus || 'Daily Bonus').toUpperCase()}
                    className="w-full"
                >
                    <Text className="text-[#e8d4b8] text-center mb-6 font-medium">
                        {t.dailyBonusWelcome}
                    </Text>

                    {/* Gift Icon */}
                    <View className="mb-6">
                        <Text className="text-[80px]">🎁</Text>
                    </View>

                    {/* Reward Amount */}
                    <View className="flex-row items-center justify-center bg-black/40 px-8 py-4 rounded-2xl border border-[#ffd700]/30 mb-8 gap-3 w-full">
                        <Text className="text-4xl">💰</Text>
                        <Text className="text-[#ffd700] text-5xl font-black">{amount}</Text>
                    </View>

                    <WoodenButton
                        variant="gold"
                        size="lg"
                        fullWidth
                        onPress={handleClaim}
                    >
                        {t.claimAndPlay}
                    </WoodenButton>
                </WoodenCard>
            </Animated.View>
        </AnimatedModal>
    );
};

export default DailyBonusModal;
