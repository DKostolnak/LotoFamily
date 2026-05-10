import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ModalShell, WoodenButton } from './common';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { Gamepad2, Users, Trophy, ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

const STORAGE_KEY = '@loto_onboarding_complete';

interface OnboardingStep {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}

export function OnboardingModal() {
    const [visible, setVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { language } = useGameStore();
    const t = translations[language];

    const steps: OnboardingStep[] = [
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

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const completed = await AsyncStorage.getItem(STORAGE_KEY);
            if (!completed) {
                setTimeout(() => setVisible(true), 1000);
            }
        } catch (e) {
            console.warn('Failed to check onboarding status:', e);
        }
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, 'true');
        } catch (e) {
            console.warn('Failed to save onboarding status:', e);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setVisible(false);
    };

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeOnboarding();
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        completeOnboarding();
    };

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    const footer = (
        <>
            <WoodenButton
                variant="gold"
                size={isLastStep ? 'xl' : 'lg'}
                fullWidth
                onPress={handleNext}
                icon={!isLastStep ? <ChevronRight size={24} color="#3d2814" /> : undefined}
            >
                {isLastStep ? (t.letsPlay || "Let's Play!") : (t.next || 'Next')}
            </WoodenButton>

            {!isLastStep && (
                <TouchableOpacity
                    onPress={handleSkip}
                    style={{ paddingVertical: SPACING.sm, alignItems: 'center' }}
                    accessibilityRole="button"
                >
                    <Text style={[TEXT_STYLES.captionUpper, { color: '#d4b896' }]}>
                        {t.skip || 'Skip Intro'}
                    </Text>
                </TouchableOpacity>
            )}
        </>
    );

    return (
        <ModalShell
            visible={visible}
            onClose={handleSkip}
            hideClose
            noScroll
            footer={footer}
        >
            <View style={{ alignItems: 'center', gap: SPACING.lg }}>
                {/* Step indicator dots */}
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                    {steps.map((_, idx) => (
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

                {/* Hero Icon */}
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
        </ModalShell>
    );
}
