import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LotoCard as LotoCardType } from '@/lib/types';
import { useResponsive } from '@/hooks';
import { getThemeColors } from '@/lib/config';
import { ChipMarker } from './common/ChipMarker';

import type { TranslationKeys } from '@/lib/i18n';

/** Translation prop type - partial for flexibility (test fixtures, partial dicts) */
type TranslationProp = Partial<TranslationKeys>;

interface LotoCardProps {
    card: LotoCardType;
    onCellPress?: (row: number, col: number) => void;
    compact?: boolean;
    showHeader?: boolean;
    playerName?: string;
    calledNumbers?: number[];
    t: TranslationProp; // Translation dictionary
    style?: ViewStyle;
    /** Active marker skin ID from shop */
    activeSkin?: string;
    /** Active card theme ID from shop */
    activeTheme?: string;
}

const LotoCell = memo(({
    value, isMarked, row, col, isCalled, isMissed, isMistake, onPress, fontSize = 18, activeSkin = 'skin_classic', t
}: {
    value: number | null,
    isMarked: boolean,
    row: number,
    col: number,
    isCalled: boolean,
    isMissed: boolean,
    isMistake: boolean,
    onPress: (r: number, c: number) => void,
    fontSize?: number,
    activeSkin?: string,
    t: TranslationProp
}) => {
    // Spring scale feedback on every tap
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const isEmpty = value === null;

    if (isEmpty) {
        return <View className="flex-1 h-full bg-transparent" accessibilityElementsHidden />;
    }

    // Base Styles
    let bgClass = "bg-cream-light";
    let textClass = "text-wood-dark";

    // State Styles
    if (isMissed) {
        bgClass = "bg-[#fee2e2]";
        textClass = "text-[#991b1b] opacity-50";
    }
    if (isMistake) {
        bgClass = "bg-danger";
        textClass = "text-white";
    }

    // Accessibility state description (localized with English fallback for test fixtures)
    const getAccessibilityState = () => {
        if (isMarked && isCalled) return t.a11yMarkedState ?? 'marked correctly';
        if (isMarked && !isCalled) return t.a11yMarkedIncorrect ?? 'marked incorrectly';
        if (isCalled && !isMarked) return t.a11yCalledTapToMark ?? 'called, tap to mark';
        return t.a11yNotCalledYet ?? 'not called yet';
    };

    const numberLabel = (t.a11yNumberLabel ?? 'Number {n}').replace('{n}', String(value));

    const handlePress = () => {
        // Squish then spring-bounce back
        scale.value = withSequence(
            withTiming(0.80, { duration: 65 }),
            withSpring(1, { damping: 7, stiffness: 380 }),
        );
        onPress(row, col);
    };

    return (
        <Animated.View style={[{ flex: 1, overflow: 'hidden' }, animStyle]}>
        <TouchableOpacity
            className={`w-full h-full items-center justify-center ${bgClass} relative overflow-hidden`}
            onPress={handlePress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${numberLabel}, ${getAccessibilityState()}`}
            accessibilityHint={isMarked ? undefined : (t.a11yMarkHint ?? 'Double tap to mark this number')}
            accessibilityState={{
                selected: isMarked,
                disabled: isMarked && isCalled
            }}
        >
            <Text
                className={`font-bold ${textClass} ${isMarked && 'opacity-0'} z-10`}
                style={{ fontSize }}
                accessibilityElementsHidden
                maxFontSizeMultiplier={1.1}
            >
                {value}
            </Text>

            {/* Animated wooden chip — only rendered when marked (perf).
                Sized generously so the wooden texture is clearly readable. */}
            {isMarked && value !== null && (
                <ChipMarker
                    marked
                    value={value}
                    variant={isCalled ? 'correct' : 'incorrect'}
                    size={Math.max(32, fontSize * 2.4)}
                    activeSkin={activeSkin}
                />
            )}
        </TouchableOpacity>
        </Animated.View>
    );
});
LotoCell.displayName = 'LotoCell';

const LotoCardComponent = ({
    card, onCellPress, compact, showHeader, playerName, calledNumbers = [], t, style, activeSkin = 'skin_classic', activeTheme = 'theme_classic'
}: LotoCardProps) => {
    const { scale, scaleFont } = useResponsive();
    const [mistakeCell, setMistakeCell] = useState<string | null>(null);

    // Get theme colors from config
    const theme = getThemeColors(activeTheme);

    // O(1) lookup map: number -> index in calledNumbers (avoids O(N²) per-cell scan)
    const calledMap = useMemo(() => {
        const map = new Map<number, number>();
        calledNumbers.forEach((n, idx) => map.set(n, idx));
        return map;
    }, [calledNumbers]);

    // Responsive sizing
    const cellFontSize = compact ? scaleFont(14, 12) : scaleFont(18, 14);
    const headerPadY = Math.max(2, scale(4));
    const headerPadX = Math.max(6, scale(10));
    const headerTextFontSize = scaleFont(10, 8);

    const handlePress = useCallback((row: number, col: number) => {
        const cell = card.grid[row][col];
        if (cell.value === null || !onCellPress) return;

        const isCalled = calledMap.has(cell.value);

        if (!isCalled) {
            setMistakeCell(`${row}-${col}`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setTimeout(() => setMistakeCell(null), 800);
            return;
        }

        if (cell.isMarked) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onCellPress(row, col);
    }, [card.grid, calledMap, onCellPress]);

    const remainingOnCard = card.grid.flat().filter(c => c.value !== null && !c.isMarked).length;

    return (
        <View
            className="w-full rounded-xl overflow-hidden shadow-md border-2"
            style={[{ elevation: 4, backgroundColor: theme.cardBg, borderColor: theme.border }, style]}
        >
            {/* Card Header Strip - Compact on small screens */}
            <View
                className="flex-row items-center justify-between border-b"
                style={{ paddingVertical: headerPadY, paddingHorizontal: headerPadX, backgroundColor: theme.headerBg, borderColor: theme.border + '80' }}
            >
                <Text
                    className="text-muted font-bold uppercase tracking-widest"
                    style={{ fontSize: headerTextFontSize }}
                >
                    CARD #{card.id.slice(-3)}
                </Text>
                <View className="bg-black/20 px-1.5 py-0.5 rounded-md border" style={{ borderColor: theme.border }}>
                    <Text
                        className={`font-bold uppercase tracking-widest ${remainingOnCard === 0 ? 'text-success' : 'text-cream'}`}
                        style={{ fontSize: headerTextFontSize }}
                    >
                        {remainingOnCard === 0 ? 'COMPLETE' : `${remainingOnCard} LEFT`}
                    </Text>
                </View>
            </View>

            {/* Grid - aspectRatio 9/3 = 3 keeps cells square regardless of parent height */}
            <View style={{ width: '100%', aspectRatio: 3, backgroundColor: theme.gridBg, padding: 2 }}>
                {card.grid.map((row, rIdx) => (
                    <View key={rIdx} style={{ flexDirection: 'row', flex: 1 }}>
                        {row.map((cell, cIdx) => {
                            const isCalled = cell.value !== null && calledMap.has(cell.value);
                            const calledIdx = isCalled ? calledMap.get(cell.value!)! : -1;
                            const isMissed = isCalled && !cell.isMarked && (calledNumbers.length - 1 - calledIdx >= 2);

                            // Custom Grid Borders
                            const borderRight = cIdx < 8 ? `border-r` : '';
                            const borderBottom = rIdx < 2 ? `border-b` : '';
                            const borderColor = { borderColor: theme.border + '40' };

                            return (
                                <View
                                    key={`${rIdx}-${cIdx}`}
                                    className={`flex-1 ${borderRight} ${borderBottom}`}
                                    style={borderColor}
                                >
                                    <LotoCell
                                        row={rIdx}
                                        col={cIdx}
                                        value={cell.value}
                                        isMarked={cell.isMarked}
                                        isCalled={isCalled}
                                        isMissed={isMissed}
                                        isMistake={mistakeCell === `${rIdx}-${cIdx}`}
                                        onPress={handlePress}
                                        fontSize={cellFontSize}
                                        activeSkin={activeSkin}
                                        t={t}
                                    />
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>
        </View>
    );
};

export const LotoCard = memo(LotoCardComponent);
LotoCard.displayName = 'LotoCard';
