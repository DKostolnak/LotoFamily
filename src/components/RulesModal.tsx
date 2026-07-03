import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withTiming, withSpring, runOnJS,
    FadeIn, FadeOut,
} from 'react-native-reanimated';
import { ModalShell, WoodenButton } from '@/components/common';
import { ChevronLeft, ChevronRight, Eye, Star, Clock } from 'lucide-react-native';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface RulesModalProps {
    visible: boolean;
    onClose: () => void;
    t: any;
}

// ─── Visual illustrations ────────────────────────────────────────────────────

/** Mini loto card snippet — 3 rows × 5 cols for illustration */
const MiniCard = ({ highlightRow = -1 }: { highlightRow?: number }) => {
    const grid = [
        [5, null, 23, null, 45],
        [12, 34, null, 56, null],
        [null, 18, 38, null, 72],
    ];
    const chipped = new Set([23, 34, 56]);

    return (
        <View style={{ borderRadius: 8, overflow: 'hidden', borderWidth: 1.5, borderColor: '#5a4025' }}>
            {grid.map((row, rIdx) => (
                <View
                    key={rIdx}
                    style={{
                        flexDirection: 'row',
                        backgroundColor: rIdx === highlightRow
                            ? 'rgba(255,215,0,0.12)' : 'rgba(230,210,180,0.08)',
                        borderTopWidth: rIdx > 0 ? 1 : 0,
                        borderColor: 'rgba(90,64,37,0.3)',
                    }}
                >
                    {row.map((val, cIdx) => (
                        <View
                            key={cIdx}
                            style={{
                                width: 36, height: 36,
                                alignItems: 'center', justifyContent: 'center',
                                borderRightWidth: cIdx < 4 ? 1 : 0,
                                borderColor: 'rgba(90,64,37,0.25)',
                                backgroundColor: val === null ? 'transparent' : 'rgba(245,230,200,0.06)',
                            }}
                        >
                            {val !== null && chipped.has(val) ? (
                                <View style={{
                                    width: 26, height: 26, borderRadius: 13,
                                    backgroundColor: '#c0392b', borderWidth: 2, borderColor: '#7b1a10',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff' }}>{val}</Text>
                                </View>
                            ) : val !== null ? (
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#e8d4b8' }}>{val}</Text>
                            ) : null}
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};

/** Drum + history chips row */
const DrumIllustration = () => (
    <View style={{ alignItems: 'center', gap: SPACING.md }}>
        {/* History */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {[36, 86, 52, 65].map((n) => (
                <View key={n} style={{
                    width: 34, height: 34, borderRadius: 17,
                    backgroundColor: '#3d2814', borderWidth: 1.5, borderColor: '#8b6b4a',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#d4b896' }}>{n}</Text>
                </View>
            ))}
            <Text style={{ color: '#5a4025', fontSize: 16 }}>→</Text>
        </View>
        {/* Main drum */}
        <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: '#3d2814',
            borderWidth: 3, borderColor: '#ffd700',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#ffd700', shadowOpacity: 0.4, shadowRadius: 8,
        }}>
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#ffd700' }}>12</Text>
        </View>
    </View>
);

/** Single cell — normal vs tapped wrong */
const TapIllustration = () => (
    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
        {/* Correct tap */}
        <View style={{ alignItems: 'center', gap: 8 }}>
            <View style={{
                width: 50, height: 50, borderRadius: 6,
                backgroundColor: 'rgba(245,230,200,0.08)', borderWidth: 1.5, borderColor: 'rgba(90,64,37,0.3)',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: '#c0392b', borderWidth: 2.5, borderColor: '#7b1a10',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>52</Text>
                </View>
            </View>
            <Text style={{ fontSize: 11, color: '#4ade80', fontWeight: '700' }}>✓ Called</Text>
        </View>

        <Text style={{ fontSize: 22, color: '#5a4025' }}>vs</Text>

        {/* Wrong tap */}
        <View style={{ alignItems: 'center', gap: 8 }}>
            <View style={{
                width: 50, height: 50, borderRadius: 6,
                backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.4)',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: 'rgba(239,68,68,0.7)' }}>31</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '700' }}>✗ Freeze!</Text>
        </View>
    </View>
);

/** Highlighted row = LINE win */
const LineIllustration = () => <MiniCard highlightRow={1} />;

/** Full card all chipped = BINGO */
const BingoIllustration = () => {
    const grid = [
        [5, null, 23, null, 45],
        [12, 34, null, 56, null],
        [null, 18, 38, null, 72],
    ];
    return (
        <View style={{ borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#ffd700' }}>
            {grid.map((row, rIdx) => (
                <View key={rIdx} style={{
                    flexDirection: 'row',
                    backgroundColor: 'rgba(255,215,0,0.08)',
                    borderTopWidth: rIdx > 0 ? 1 : 0,
                    borderColor: 'rgba(255,215,0,0.2)',
                }}>
                    {row.map((val, cIdx) => (
                        <View key={cIdx} style={{
                            width: 36, height: 36,
                            alignItems: 'center', justifyContent: 'center',
                            borderRightWidth: cIdx < 4 ? 1 : 0,
                            borderColor: 'rgba(255,215,0,0.15)',
                        }}>
                            {val !== null ? (
                                <View style={{
                                    width: 26, height: 26, borderRadius: 13,
                                    backgroundColor: '#c0392b', borderWidth: 2, borderColor: '#7b1a10',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff' }}>{val}</Text>
                                </View>
                            ) : null}
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};

/** Power-up icons grid — items supplied by parent so labels/descs are translated */
interface PowerUpItem {
    icon: React.ReactNode;
    color: string;
    bg: string;
    label: string;
    desc: string;
}

const PowerUpIllustration = ({ items }: { items: PowerUpItem[] }) => (
    <View style={{ flexDirection: 'row', gap: SPACING.md, justifyContent: 'center' }}>
        {items.map(({ icon, color, bg, label, desc }) => (
            <View key={label} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{
                    width: 52, height: 52, borderRadius: 14,
                    backgroundColor: bg, borderWidth: 1.5, borderColor: color + '60',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    {icon}
                </View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#e8d4b8' }}>{label}</Text>
                <Text style={{ fontSize: 11, color: '#d4b896', textAlign: 'center', width: 56 }}>{desc}</Text>
            </View>
        ))}
    </View>
);

// ─── Slide content ───────────────────────────────────────────────────────────

const Bullet = ({ text, accent = false }: { text: string; accent?: boolean }) => (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <View style={{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: accent ? '#ef4444' : '#ffd700',
            marginTop: 7, flexShrink: 0,
        }} />
        <Text style={{
            flex: 1, fontSize: 14, lineHeight: 21,
            color: accent ? '#fca5a5' : '#d4b896',
        }}>
            {text}
        </Text>
    </View>
);

// ─── Main component ──────────────────────────────────────────────────────────

export const RulesModal = ({ visible, onClose, t }: RulesModalProps) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [displayPage, setDisplayPage] = useState(0);
    const slideX = useSharedValue(0);
    const opacity = useSharedValue(1);

    // Split newline-separated translation strings into bullet arrays.
    // Lines starting with ⚠️ are rendered as warning (red) bullets.
    const parseBullets = (raw: string) => {
        const lines = (raw ?? '').split('\n').filter(Boolean);
        return {
            bullets: lines.filter(l => !l.startsWith('⚠️')),
            warningBullets: lines.filter(l => l.startsWith('⚠️')),
        };
    };

    const pages = [
        {
            emoji: '🃏',
            title: t.rulesPage1Title ?? 'Your Cards',
            color: '#ffd700',
            visual: <MiniCard />,
            ...parseBullets(t.rulesPage1Desc ?? ''),
        },
        {
            emoji: '🥁',
            title: t.rulesPage2Title ?? 'The Drum Calls',
            color: '#fbbf24',
            visual: <DrumIllustration />,
            ...parseBullets(t.rulesPage2Desc ?? ''),
        },
        {
            emoji: '👆',
            title: t.rulesPage3Title ?? 'Mark Your Numbers',
            color: '#4ade80',
            visual: <TapIllustration />,
            ...parseBullets(t.rulesPage3Desc ?? ''),
        },
        {
            emoji: '➡️',
            title: t.rulesPage4Title ?? 'Win: LINE',
            color: '#60a5fa',
            visual: <LineIllustration />,
            ...parseBullets(t.rulesPage4Desc ?? ''),
        },
        {
            emoji: '🎉',
            title: t.rulesPage5Title ?? 'Win: BINGO!',
            color: '#ffd700',
            visual: <BingoIllustration />,
            ...parseBullets(t.rulesPage5Desc ?? ''),
        },
        {
            emoji: '⚡',
            title: t.rulesPage6Title ?? 'Power-ups',
            color: '#a78bfa',
            visual: <PowerUpIllustration items={[
                { icon: <Eye size={22} color="#a78bfa" />, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', label: t.powerUpPeek, desc: t.powerUpPeekDesc },
                { icon: <Star size={22} color="#fbbf24" />, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', label: t.powerUpLuckyMark, desc: t.powerUpLuckyMarkDesc },
                { icon: <Clock size={22} color="#34d399" />, color: '#34d399', bg: 'rgba(52,211,153,0.15)', label: t.powerUpSlowTime, desc: t.powerUpSlowTimeDesc },
            ]} />,
            ...parseBullets(t.rulesPage6Desc ?? ''),
        },
    ];

    const TOTAL = pages.length;
    const isFirst = currentPage === 0;
    const isLast = currentPage === TOTAL - 1;

    const goToPage = (next: number) => {
        if (next < 0 || next >= TOTAL) return;
        Haptics.selectionAsync().catch(() => { });

        const dir = next > currentPage ? 1 : -1;
        opacity.value = withTiming(0, { duration: 140 }, () => {
            runOnJS(setDisplayPage)(next);
            runOnJS(setCurrentPage)(next);
            slideX.value = dir * 30;
            slideX.value = withSpring(0, { damping: 18, stiffness: 280 });
            opacity.value = withTiming(1, { duration: 180 });
        });
    };

    const slideStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateX: slideX.value }],
    }));

    const page = pages[displayPage];

    const footer = (
        <View style={{ gap: SPACING.md }}>
            {/* Dot indicator */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center' }}>
                {pages.map((_, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => goToPage(i)}
                        hitSlop={8}
                        style={{
                            height: 7,
                            width: i === currentPage ? 22 : 7,
                            borderRadius: 4,
                            backgroundColor: i === currentPage ? '#ffd700' : '#3d2814',
                        }}
                    />
                ))}
            </View>

            {/* Navigation row */}
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <WoodenButton
                    size="md"
                    variant="secondary"
                    onPress={() => goToPage(currentPage - 1)}
                    disabled={isFirst}
                    style={{ flex: 1 }}
                >
                    {t.previous ?? '← Back'}
                </WoodenButton>
                <WoodenButton
                    size="md"
                    variant={isLast ? 'gold' : 'gold'}
                    onPress={() => (isLast ? onClose() : goToPage(currentPage + 1))}
                    style={{ flex: isLast ? 2 : 1 }}
                >
                    {isLast ? (t.gotIt ?? "Let's Play! 🎲") : (t.next ?? 'Next →')}
                </WoodenButton>
            </View>
        </View>
    );

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={t.rulesTitle ?? 'How to Play'}
            noScroll
            footer={footer}
            contentStyle={{ padding: SPACING.lg, gap: 0 }}
        >
            <Animated.View style={[slideStyle, { gap: SPACING.md }]}>
                {/* Page header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs }}>
                    <Text style={{ fontSize: 22 }}>{page.emoji}</Text>
                    <Text style={[TEXT_STYLES.h2, { color: page.color, flex: 1 }]} numberOfLines={1}>
                        {page.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#5a4025', fontWeight: '700' }}>
                        {currentPage + 1}/{TOTAL}
                    </Text>
                </View>

                {/* Visual illustration */}
                <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: SPACING.md,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: RADII.md,
                    borderWidth: 1,
                    borderColor: 'rgba(90,64,37,0.3)',
                    minHeight: 110,
                }}>
                    {page.visual}
                </View>

                {/* Bullet points */}
                <View style={{ gap: 8, paddingTop: SPACING.xs }}>
                    {page.bullets.map((b: string, i: number) => (
                        <Bullet key={i} text={b} />
                    ))}
                    {page.warningBullets?.map((b: string, i: number) => (
                        <Bullet key={`w${i}`} text={b} accent />
                    ))}
                </View>
            </Animated.View>
        </ModalShell>
    );
};
