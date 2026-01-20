import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AnimatedModal } from './common';
import { WoodenButton, WoodenCard } from './common';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { Gamepad2, Users, Trophy, ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

const STORAGE_KEY = '@loto_onboarding_complete';

interface OnboardingStep {
    icon: React.ReactNode;
    emoji: string;
    title: string;
    description: string;
    color: string;
}

/**
 * Onboarding Modal
 * 
 * Shows a brief introduction to new users on their first app launch.
 * Only appears once - after completion, never shown again.
 */
export function OnboardingModal() {
    const [visible, setVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { language } = useGameStore();
    const t = translations[language];

    const steps: OnboardingStep[] = [
        {
            emoji: '🎱',
            icon: <Gamepad2 size={48} color="#ffd700" />,
            title: t.onboardingTitle1 || 'Welcome to LOTO!',
            description: t.onboardingDesc1 || 'The classic number game for family and friends. Match numbers on your card to win!',
            color: '#ffd700'
        },
        {
            emoji: '👥',
            icon: <Users size={48} color="#4ade80" />,
            title: t.onboardingTitle2 || 'Play Together',
            description: t.onboardingDesc2 || 'Create a room and invite friends, or practice solo against the machine.',
            color: '#4ade80'
        },
        {
            emoji: '🏆',
            icon: <Trophy size={48} color="#ffd700" />,
            title: t.onboardingTitle3 || 'Win Rewards',
            description: t.onboardingDesc3 || 'Complete your card first to win! Earn coins and climb the leaderboard.',
            color: '#ffd700'
        },
    ];

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const completed = await AsyncStorage.getItem(STORAGE_KEY);
            if (!completed) {
                // Small delay to let the app load first
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

    return (
        <AnimatedModal visible={visible} onClose={handleSkip} closeOnBackdrop={false}>
            <WoodenCard>
                <View className="items-center py-6 px-4">
                    {/* Step indicator dots */}
                    <View className="flex-row gap-2 mb-8">
                        {steps.map((_, idx) => (
                            <View
                                key={idx}
                                className={`w-3 h-3 rounded-full ${idx === currentStep ? 'bg-[#ffd700] w-8' : 'bg-[#5a4025]'
                                    }`}
                            />
                        ))}
                    </View>

                    {/* Premium Icon Set */}
                    <Animated.View
                        key={currentStep}
                        entering={ZoomIn.duration(400)}
                        exiting={FadeOut.duration(200)}
                        className="w-32 h-32 rounded-full bg-black/20 items-center justify-center mb-8 border-2"
                        style={{ borderColor: step.color + '40' }}
                    >
                        {step.icon}
                    </Animated.View>

                    {/* Content Section */}
                    <Animated.View
                        key={`content-${currentStep}`}
                        entering={FadeIn.duration(400)}
                        className="items-center"
                    >
                        <Text className="text-white font-black text-3xl uppercase tracking-tighter text-center mb-4">
                            {step.title}
                        </Text>
                        <Text className="text-[#e8d4b8] text-center text-lg mb-10 leading-relaxed font-medium">
                            {step.description}
                        </Text>
                    </Animated.View>

                    {/* Action Buttons */}
                    <View className="w-full gap-4">
                        <WoodenButton variant="gold" size="lg" fullWidth onPress={handleNext}>
                            <View className="flex-row items-center gap-2">
                                <Text className="text-[#3d2814] font-black text-xl uppercase">
                                    {isLastStep ? (t.letsPlay || "Let's Play!") : (t.next || 'Next')}
                                </Text>
                                {!isLastStep && <ChevronRight size={24} color="#3d2814" />}
                            </View>
                        </WoodenButton>

                        {!isLastStep && (
                            <TouchableOpacity onPress={handleSkip} className="py-2 active:opacity-60">
                                <Text className="text-[#8b6b4a] text-center font-bold uppercase tracking-[3px] text-xs">
                                    {t.skip || 'Skip Intro'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </WoodenCard>
        </AnimatedModal>
    );
}
