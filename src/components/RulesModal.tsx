import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    FadeInRight,
    FadeOutLeft
} from 'react-native-reanimated';
import { WoodenCard, AnimatedModal } from '@/components/common';
import { Info, Trophy, Coins, Users, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface RulesModalProps {
    visible: boolean;
    onClose: () => void;
    t: any;
}

export const RulesModal = ({ visible, onClose, t }: RulesModalProps) => {
    const [currentPage, setCurrentPage] = useState(0);
    const translateX = useSharedValue(0);

    const pages = [
        {
            title: t.rulesPage1Title,
            desc: t.rulesPage1Desc,
            icon: <Info size={40} color="#ffd700" />,
            color: '#ffd700'
        },
        {
            title: t.rulesPage2Title,
            desc: t.rulesPage2Desc,
            icon: <Trophy size={40} color="#4ade80" />,
            color: '#4ade80'
        },
        {
            title: t.rulesPage3Title,
            desc: t.rulesPage3Desc,
            icon: <Coins size={40} color="#c9a66b" />,
            color: '#c9a66b'
        },
        {
            title: t.rulesPage4Title,
            desc: t.rulesPage4Desc,
            icon: <Users size={40} color="#60a5fa" />,
            color: '#60a5fa'
        }
    ];

    const goToPage = (index: number) => {
        if (index < 0 || index >= pages.length) return;
        Haptics.selectionAsync(); // Add haptic feedback for better interaction feel
        setCurrentPage(index);
    };

    return (
        <AnimatedModal visible={visible} onClose={onClose} animation="scale">
            <WoodenCard
                title={t.rulesTitle || 'Instructions'}
                className="h-[65%] w-full"
                onClose={onClose}
            >
                <View className="flex-1 w-full pt-6 pb-2 px-2">
                    {/* Animated Content */}
                    <Animated.View
                        key={currentPage}
                        entering={FadeInRight.duration(300)}
                        exiting={FadeOutLeft.duration(200)}
                        className="items-center w-full flex-1 justify-center"
                    >
                        {/* Icon Container with Premium Glow */}
                        <View className="mb-6 relative items-center justify-center">
                            <View className="absolute w-24 h-24 rounded-full bg-[#ffd700]/20 blur-md" />
                            <View
                                className="w-20 h-20 rounded-full bg-black/60 items-center justify-center border-2 shadow-sm"
                                style={{ borderColor: pages[currentPage].color, shadowColor: pages[currentPage].color, shadowOpacity: 0.5, shadowRadius: 10 }}
                            >
                                {pages[currentPage].icon}
                            </View>
                        </View>

                        <Text className="text-[#ffd700] font-black text-2xl uppercase tracking-widest text-center mb-4"
                            style={{ textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 }}>
                            {pages[currentPage].title || 'Title'}
                        </Text>

                        <Text className="text-[#e8d4b8] font-medium text-base text-center leading-relaxed px-4 shadow-black shadow-sm min-h-[80px]">
                            {pages[currentPage].desc || 'Description'}
                        </Text>
                    </Animated.View>

                    {/* Navigation Footer */}
                    <View className="flex-row items-center justify-between mt-auto w-full pt-4 border-t border-[#d4b075]/20">
                        <TouchableOpacity
                            onPress={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 0}
                            className={`p-3 rounded-full bg-[#2d1f10] border border-[#5a4025] ${currentPage === 0 ? 'opacity-30' : 'opacity-100'}`}
                            activeOpacity={0.7}
                        >
                            <ChevronLeft size={24} color="#e8d4b8" />
                        </TouchableOpacity>

                        {/* Dots Indicator */}
                        <View className="flex-row gap-3">
                            {pages.map((_, i) => (
                                <View
                                    key={i}
                                    className={`h-2 rounded-full transition-all duration-300 ${i === currentPage ? 'w-6 bg-[#ffd700]' : 'w-2 bg-[#5a4025]'}`}
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={() => (currentPage === pages.length - 1 ? onClose() : goToPage(currentPage + 1))}
                            className={`p-3 rounded-full ${currentPage === pages.length - 1 ? 'bg-[#ffd700] px-6' : 'bg-[#2d1f10] border border-[#5a4025]'}`}
                            activeOpacity={0.7}
                        >
                            {currentPage === pages.length - 1 ? (
                                <Text className="font-bold text-[#1a1109] text-base uppercase tracking-wider">{t.gotIt || 'OK'}</Text>
                            ) : (
                                <ChevronRight size={24} color="#e8d4b8" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </WoodenCard>
        </AnimatedModal>
    );
};
