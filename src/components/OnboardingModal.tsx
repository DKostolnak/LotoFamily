import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { ModalShell, WoodenButton, WoodenInput } from './common';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { Gamepad2, Users, Trophy, ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';
import {
    DEFAULT_AVATARS,
    getNextAvatar,
    getRandomAvatar,
} from '@/lib/config/avatar.config';

const STORAGE_KEY = '@loto_onboarding_complete';

interface OnboardingStep {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}

const NAME_STEP_INDEX = 3;

export function OnboardingModal() {
    const [visible, setVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { language, inventory, setPlayerName, setPlayerAvatar } = useGameStore();
    const t = translations[language];

    const [localName, setLocalName] = useState('');
    const [currentAvatar, setCurrentAvatar] = useState<string>(DEFAULT_AVATARS[0]);

    const introSteps: OnboardingStep[] = [
        {
            icon: <Gamepad2 size={64} color="#ffd700" />,
            title: t.onboardingTitle1 || 'Welcome to LOTO!',
            description: t.onboardingDesc1 || 'The classic number game for family and friends. Match numbers on your card to win!',
            color: '#ffd700',
        },
        {
            icon: <Users size={64} color="#4ade80" />,
            title: t.onboardingTitle2 || 'Play Together',
            description: t.onboardingDesc2 || 'Create a room and invite friends, or practice solo against the machine.',
            color: '#4ade80',
        },
        {
            icon: <Trophy size={64} color="#ffd700" />,
            title: t.onboardingTitle3 || 'Win Rewards',
            description: t.onboardingDesc3 || 'Complete your card first to win! Earn coins and climb the leaderboard.',
            color: '#ffd700',
        },
    ];

    const totalSteps = introSteps.length + 1;

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const completed = await AsyncStorage.getItem(STORAGE_KEY);
            if (!completed) {
                setCurrentAvatar(getRandomAvatar());
                setTimeout(() => setVisible(true), 1000);
            }
        } catch (e) {
            console.warn('Failed to check onboarding status:', e);
        }
    };

    const persistComplete = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, 'true');
        } catch (e) {
            console.warn('Failed to save onboarding status:', e);
        }
    };

    const finishWithName = async () => {
        // Apply chosen identity to global store BEFORE marking onboarding complete
        // so MainMenu reads the proper name on the next render.
        setPlayerName(localName.trim());
        setPlayerAvatar(currentAvatar);
        await persistComplete();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setVisible(false);
    };

    const finishWithDefaults = async () => {
        // Skip path: assign locale-appropriate default name + random avatar
        // so the user is never stuck with an empty playerName downstream.
        const defaultName = language === 'sk' ? 'Hráč' : language === 'ru' ? 'Игрок' : language === 'uk' ? 'Гравець' : 'Player';
        setPlayerName(defaultName);
        setPlayerAvatar(getRandomAvatar());
        await persistComplete();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setVisible(false);
    };

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // On the last step (name) the primary button is "Start playing".
            finishWithName();
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        finishWithDefaults();
    };

    const handleCycleAvatar = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentAvatar(getNextAvatar(currentAvatar, inventory));
    };

    const isNameStep = currentStep === NAME_STEP_INDEX;
    const isLastIntroStep = currentStep === introSteps.length - 1;

    const trimmedName = localName.trim();
    const nameValid = trimmedName.length >= 2;

    // ----- Footer -----
    const footer = isNameStep ? (
        <>
            <WoodenButton
                variant="gold"
                size="xl"
                fullWidth
                onPress={handleNext}
                disabled={!nameValid}
                accessibilityLabel={(t as any).onboardingStartGame || "Start playing"}
            >
                {(t as any).onboardingStartGame || 'Start playing'}
            </WoodenButton>
            <TouchableOpacity
                onPress={handleSkip}
                style={{ paddingVertical: SPACING.sm, alignItems: 'center' }}
                accessibilityRole="button"
            >
                <Text style={[TEXT_STYLES.captionUpper, { color: '#d4b896' }]}>
                    {t.skip || 'Skip'}
                </Text>
            </TouchableOpacity>
        </>
    ) : (
        <>
            <WoodenButton
                variant="gold"
                size={isLastIntroStep ? 'lg' : 'lg'}
                fullWidth
                onPress={handleNext}
                icon={<ChevronRight size={24} color="#3d2814" />}
            >
                {t.next || 'Next'}
            </WoodenButton>

            <TouchableOpacity
                onPress={handleSkip}
                style={{ paddingVertical: SPACING.sm, alignItems: 'center' }}
                accessibilityRole="button"
            >
                <Text style={[TEXT_STYLES.captionUpper, { color: '#d4b896' }]}>
                    {t.skip || 'Skip Intro'}
                </Text>
            </TouchableOpacity>
        </>
    );

    // ----- Step indicator (shared) -----
    const stepIndicator = (
        <View style={{ flexDirection: 'row', gap: SPACING.sm, justifyContent: 'center' }}>
            {Array.from({ length: totalSteps }).map((_, idx) => (
                <View
                    key={idx}
                    style={{
                        height: 8,
                        borderRadius: RADII.pill,
                        width: idx === currentStep ? 32 : 8,
                        backgroundColor: idx === currentStep ? '#ffd700' : '#5a4025',
                    }}
                />
            ))}
        </View>
    );

    // ----- Body content -----
    let body: React.ReactNode;
    if (isNameStep) {
        body = (
            <Animated.View
                key="name-step"
                entering={FadeIn.duration(400)}
                style={{ alignItems: 'center', gap: SPACING.lg, width: '100%' }}
            >
                {stepIndicator}

                <Pressable
                    onPress={handleCycleAvatar}
                    accessibilityRole="button"
                    accessibilityLabel={(t as any).changeAvatarTitle || 'Change avatar'}
                    style={{
                        width: 96,
                        height: 96,
                        borderRadius: RADII.pill,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: '#ffd70060',
                    }}
                >
                    <Text style={{ fontSize: 64 }}>{currentAvatar}</Text>
                </Pressable>
                <Text style={[TEXT_STYLES.caption, { color: '#d4b896', textAlign: 'center' }]}>
                    {(t as any).tapToCycle || 'Tap avatar to change'}
                </Text>

                <View style={{ alignItems: 'center', width: '100%', gap: SPACING.sm }}>
                    <Text style={[TEXT_STYLES.display, { color: '#ffd700', textAlign: 'center' }]}>
                        {(t as any).onboardingNameTitle || 'Your name'}
                    </Text>
                    <Text style={[TEXT_STYLES.body, { color: '#d4b896', textAlign: 'center' }]}>
                        {(t as any).onboardingNameDesc || 'How should we call you?'}
                    </Text>
                </View>

                <WoodenInput
                    value={localName}
                    onChangeText={setLocalName}
                    placeholder={t.playerNamePlaceholder}
                    autoFocus
                    autoCapitalize="words"
                    maxLength={20}
                    accessibilityLabel={t.playerName}
                />
                {!nameValid && localName.length > 0 ? (
                    <Text style={[TEXT_STYLES.caption, { color: '#ef4444', textAlign: 'center' }]}>
                        {t.nameTooShort}
                    </Text>
                ) : null}
            </Animated.View>
        );
    } else {
        const step = introSteps[currentStep];
        body = (
            <View style={{ alignItems: 'center', gap: SPACING.lg }}>
                {stepIndicator}

                <Animated.View
                    key={currentStep}
                    entering={ZoomIn.duration(400)}
                    exiting={FadeOut.duration(200)}
                    style={{
                        width: 128,
                        height: 128,
                        borderRadius: RADII.pill,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: step.color + '60',
                    }}
                >
                    {step.icon}
                </Animated.View>

                <Animated.View
                    key={`content-${currentStep}`}
                    entering={FadeIn.duration(400)}
                    style={{ alignItems: 'center', width: '100%', gap: SPACING.md }}
                >
                    <Text
                        numberOfLines={2}
                        style={[
                            TEXT_STYLES.display,
                            { color: '#ffd700', textAlign: 'center' },
                        ]}
                    >
                        {step.title}
                    </Text>
                    <Text
                        style={[
                            TEXT_STYLES.body,
                            {
                                color: '#d4b896',
                                textAlign: 'center',
                                paddingHorizontal: SPACING.sm,
                            },
                        ]}
                    >
                        {step.description}
                    </Text>
                </Animated.View>
            </View>
        );
    }

    return (
        <ModalShell
            visible={visible}
            onClose={handleSkip}
            hideClose
            noScroll
            footer={footer}
        >
            {body}
        </ModalShell>
    );
}
