import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    cancelAnimation,
    type SharedValue,
} from 'react-native-reanimated';
import { ModalShell, WoodenButton, CelebrationConfetti } from '@/components/common';
import { useGameStore } from '@/lib/store';
import { translations, type TranslationKeys } from '@/lib/i18n';
import * as Haptics from 'expo-haptics';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

/**
 * Reward table mirrors the one in `economySlice.checkDailyBonus`.
 * Day 1..7 -> indices 0..6. Day 8 cycles back to index 0 (50 coins) but the
 * underlying currentStreak/longestStreak counters keep climbing.
 */
const REWARD_TABLE = [50, 75, 100, 150, 200, 250, 500];
const AUTO_CLOSE_MS = 1500;

const DAY_KEYS: (keyof TranslationKeys)[] = [
    'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat', 'daySun',
];

interface DayCircleProps {
    label: string;
    reward: number;
    state: 'claimed' | 'today' | 'future';
    pulseScale: SharedValue<number>;
    tickScale: SharedValue<number>;
}

function DayCircle({ label, reward, state, pulseScale, tickScale }: DayCircleProps) {
    const todayStyle = useAnimatedStyle(() => ({
        transform: [{ scale: state === 'today' ? pulseScale.value : 1 }],
    }));
    const tickStyle = useAnimatedStyle(() => ({
        transform: [{ scale: tickScale.value }],
        opacity: tickScale.value,
    }));

    const bg =
        state === 'claimed' ? '#ffd700' :
            state === 'today' ? 'rgba(255, 215, 0, 0.15)' :
                'rgba(45, 31, 16, 0.6)';
    const borderColor =
        state === 'claimed' ? '#b8860b' :
            state === 'today' ? '#ffd700' :
                'rgba(90, 64, 37, 0.6)';
    const labelColor = state === 'future' ? '#d4b896' : '#f5e6c8';
    const rewardColor = state === 'claimed' ? '#1a1109' : state === 'today' ? '#ffd700' : '#d4b896';

    return (
        <View style={{ alignItems: 'center', gap: SPACING.xs, width: 44 }}>
            <Text style={[TEXT_STYLES.caption, { color: labelColor }]} numberOfLines={1}>
                {label}
            </Text>
            <Animated.View
                style={[
                    {
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: bg,
                        borderWidth: 2,
                        borderColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    state === 'today' ? todayStyle : null,
                ]}
            >
                {state === 'claimed' ? (
                    <Animated.Text style={[{ fontSize: 22, color: '#1a1109', fontWeight: '900' }, tickStyle]}>
                        ✓
                    </Animated.Text>
                ) : (
                    <Text style={[TEXT_STYLES.bodyBold, { color: state === 'today' ? '#ffd700' : '#d4b896' }]}>
                        {state === 'today' ? '★' : ''}
                    </Text>
                )}
            </Animated.View>
            <Text style={[TEXT_STYLES.caption, { color: rewardColor, fontWeight: '700' }]} numberOfLines={1}>
                +{reward}
            </Text>
        </View>
    );
}

const DailyBonusModal = () => {
    const { checkDailyBonus, language, stats } = useGameStore();
    const t = translations[language];

    const [visible, setVisible] = useState(false);
    /** Reward amount the user just claimed (from checkDailyBonus). */
    const [amount, setAmount] = useState(0);
    /** Streak day for the just-completed claim (1..N). */
    const [claimedDay, setClaimedDay] = useState(0);
    const [fireConfetti, setFireConfetti] = useState(false);

    const hasChecked = useRef(false);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pulsing border for "today" (deterministic — finite repeat count via reverse).
    const pulseScale = useSharedValue(1);
    // Tick reveal for the just-claimed day.
    const tickScale = useSharedValue(0);

    useEffect(() => {
        if (hasChecked.current) return;
        hasChecked.current = true;

        // Snapshot streak BEFORE claim — so we know which slot to mark as
        // freshly claimed. checkDailyBonus mutates currentStreak.
        const before = useGameStore.getState().stats.currentStreak ?? 0;
        const bonus = checkDailyBonus();
        if (bonus > 0) {
            const after = useGameStore.getState().stats.currentStreak ?? 0;
            // `after` is the day number of the claim that just happened.
            // (continued: before+1; reset: 1.)
            setAmount(bonus);
            setClaimedDay(after > 0 ? after : 1);
            void after; void before;
            setVisible(true);
            setFireConfetti(true);
            tickScale.value = withTiming(1, { duration: 380 });
            // Pulse 3x then settle. Deterministic — no infinite loop.
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.08, { duration: 600 }),
                    withTiming(1, { duration: 600 }),
                ),
                3,
                false,
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Auto-close after a short celebration window.
            closeTimer.current = setTimeout(() => {
                setVisible(false);
            }, AUTO_CLOSE_MS + 1200); // give user time to read; tap also closes
        }

        return () => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            cancelAnimation(pulseScale);
            cancelAnimation(tickScale);
        };
    }, [checkDailyBonus, pulseScale, tickScale]);

    const handleClaim = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setVisible(false);
    };

    // Visualisation logic: render days 1..7 of the current 7-day cycle.
    // claimedDay maps to `((claimedDay - 1) % 7) + 1` slot in the row.
    const slotInCycle = claimedDay > 0 ? ((claimedDay - 1) % 7) + 1 : 1;

    // Tomorrow's reward (next slot in the 7-day cycle, wrapping to day 1).
    const nextSlot = (slotInCycle % 7) + 1;
    const nextReward = REWARD_TABLE[nextSlot - 1];

    const streakLabel = (t.streakDays ?? '{n}-day streak').replace('{n}', String(claimedDay));
    const tomorrowLabel = (t.tomorrowReward ?? 'Tomorrow: +{n}').replace('{n}', String(nextReward));

    const footer = (
        <WoodenButton variant="gold" size="xl" fullWidth onPress={handleClaim}>
            {(t.claimAndPlay ?? 'CLAIM').replace('{n}', String(amount))} +{amount}
        </WoodenButton>
    );

    // currentStreak getter exposed for callers/tests; not used directly here.
    void stats;

    return (
        <ModalShell
            visible={visible}
            onClose={handleClaim}
            title={`🔥 ${streakLabel}`}
            subtitle={tomorrowLabel}
            hideClose
            noScroll
            footer={footer}
        >
            <View style={{ alignItems: 'center', gap: SPACING.lg, paddingVertical: SPACING.md }}>
                {/* 7-day grid */}
                <View
                    style={{
                        flexDirection: 'row',
                        gap: SPACING.sm,
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        borderRadius: RADII.lg,
                        paddingVertical: SPACING.md,
                        paddingHorizontal: SPACING.sm,
                    }}
                >
                    {REWARD_TABLE.map((reward, i) => {
                        const dayNumber = i + 1;
                        const state: 'claimed' | 'today' | 'future' =
                            dayNumber < slotInCycle ? 'claimed' :
                                dayNumber === slotInCycle ? 'claimed' : // today's claim already happened
                                    'future';
                        const label = t[DAY_KEYS[i]] ?? '';
                        return (
                            <DayCircle
                                key={i}
                                label={label}
                                reward={reward}
                                state={state}
                                pulseScale={pulseScale}
                                tickScale={tickScale}
                            />
                        );
                    })}
                </View>

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
                    <Text style={{ fontSize: 28 }}>💰</Text>
                    <Text style={[TEXT_STYLES.display, { color: '#ffd700' }]}>+{amount}</Text>
                </View>
            </View>

            <CelebrationConfetti fire={fireConfetti} onComplete={() => setFireConfetti(false)} />
        </ModalShell>
    );
};

export default DailyBonusModal;
