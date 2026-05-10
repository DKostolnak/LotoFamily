import React, { useState } from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { ModalShell, WoodenButton } from '@/components/common';
import { Info, Trophy, Coins, Users, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface RulesModalProps {
    visible: boolean;
    onClose: () => void;
    t: any;
}

export const RulesModal = ({ visible, onClose, t }: RulesModalProps) => {
    const [currentPage, setCurrentPage] = useState(0);

    const pages = [
        {
            title: t.rulesPage1Title,
            desc: t.rulesPage1Desc,
            icon: <Info size={40} color="#ffd700" />,
            color: '#ffd700',
        },
        {
            title: t.rulesPage2Title,
            desc: t.rulesPage2Desc,
            icon: <Trophy size={40} color="#4ade80" />,
            color: '#4ade80',
        },
        {
            title: t.rulesPage3Title,
            desc: t.rulesPage3Desc,
            icon: <Coins size={40} color="#ffd700" />,
            color: '#ffd700',
        },
        {
            title: t.rulesPage4Title,
            desc: t.rulesPage4Desc,
            icon: <Users size={40} color="#60a5fa" />,
            color: '#60a5fa',
        },
    ];

    const goToPage = (index: number) => {
        if (index < 0 || index >= pages.length) return;
        Haptics.selectionAsync().catch(() => { });
        setCurrentPage(index);
    };

    const isLast = currentPage === pages.length - 1;

    const footer = (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
            <WoodenButton
                size="md"
                variant="secondary"
                onPress={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                icon={<ChevronLeft size={20} color="#f5e6c8" />}
            >
                {(t as any).previous ?? 'Previous'}
            </WoodenButton>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm }}>
                {pages.map((_, i) => (
                    <View
                        key={i}
                        style={{
                            height: 8,
                            width: i === currentPage ? 24 : 8,
                            borderRadius: RADII.pill,
                            backgroundColor: i === currentPage ? '#ffd700' : '#5a4025',
                        }}
                    />
                ))}
            </View>
            <WoodenButton
                size="md"
                variant="gold"
                onPress={() => (isLast ? onClose() : goToPage(currentPage + 1))}
                icon={!isLast ? <ChevronRight size={20} color="#3d2814" /> : undefined}
            >
                {isLast ? (t.gotIt || 'OK') : (t.next || 'Next')}
            </WoodenButton>
        </View>
    );

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={t.rulesTitle || 'Instructions'}
            subtitle={`${currentPage + 1}/${pages.length}`}
            noScroll
            footer={footer}
        >
            <Animated.View
                key={currentPage}
                entering={FadeInRight.duration(300)}
                exiting={FadeOutLeft.duration(200)}
                style={{ alignItems: 'center', gap: SPACING.lg, paddingVertical: SPACING.lg }}
            >
                <View
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: RADII.pill,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        borderWidth: 2,
                        borderColor: pages[currentPage].color,
                    }}
                >
                    {pages[currentPage].icon}
                </View>

                <Text
                    numberOfLines={2}
                    style={[
                        TEXT_STYLES.h1,
                        { color: '#ffd700', textAlign: 'center' },
                    ]}
                >
                    {pages[currentPage].title || 'Title'}
                </Text>

                <Text
                    style={[
                        TEXT_STYLES.body,
                        {
                            color: '#d4b896',
                            textAlign: 'center',
                            paddingHorizontal: SPACING.md,
                        },
                    ]}
                >
                    {pages[currentPage].desc || 'Description'}
                </Text>
            </Animated.View>
        </ModalShell>
    );
};
