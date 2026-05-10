import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { ModalShell, WoodenButton } from '@/components/common';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import * as Haptics from 'expo-haptics';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

const DailyBonusModal = () => {
    const { checkDailyBonus, language } = useGameStore();
    const t = translations[language];
    const [visible, setVisible] = useState(false);
    const [amount, setAmount] = useState(0);
    const hasChecked = useRef(false);

    useEffect(() => {
        if (hasChecked.current) return;
        hasChecked.current = true;

        const bonus = checkDailyBonus();
        if (bonus > 0) {
            setAmount(bonus);
            setVisible(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }, [checkDailyBonus]);

    const handleClaim = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setVisible(false);
    };

    const footer = (
        <WoodenButton variant="gold" size="xl" fullWidth onPress={handleClaim}>
            {t.claimAndPlay}
        </WoodenButton>
    );

    return (
        <ModalShell
            visible={visible}
            onClose={handleClaim}
            title={t.dailyBonus || 'Daily Bonus'}
            subtitle={t.dailyBonusWelcome}
            hideClose
            noScroll
            footer={footer}
        >
            <View style={{ alignItems: 'center', gap: SPACING.lg, paddingVertical: SPACING.lg }}>
                <Text style={{ fontSize: 80 }}>🎁</Text>

                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: SPACING.md,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        borderRadius: RADII.lg,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 215, 0, 0.3)',
                        paddingHorizontal: SPACING.xl,
                        paddingVertical: SPACING.md,
                        width: '100%',
                    }}
                >
                    <Text style={{ fontSize: 36 }}>💰</Text>
                    <Text style={[TEXT_STYLES.display, { color: '#ffd700' }]}>+{amount}</Text>
                </View>
            </View>
        </ModalShell>
    );
};

export default DailyBonusModal;
