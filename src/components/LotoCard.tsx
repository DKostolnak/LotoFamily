import React, { memo, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LotoCard as LotoCardType } from '@/lib/types';
import { useResponsive } from '@/hooks';
import { getThemeColors, getSkinColors } from '@/lib/config';

/** 
 * Translation interface - accepts both new TranslationKeys type 
 * and legacy Record<string, string> for backward compatibility 
 */
type TranslationProp = Record<string, string>;

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
    value, isMarked, row, col, isCalled, isMissed, isMistake, onPress, fontSize = 18, activeSkin = 'skin_classic'
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
    activeSkin?: string
}) => {
    const isEmpty = value === null;

    if (isEmpty) {
        return <View className="flex-1 h-full bg-transparent" accessibilityElementsHidden />;
    }

    // Base Styles
    let bgClass = "bg-[#fffaf0]";
    let textClass = "text-[#3d2814]";

    // State Styles
    if (isMissed) {
        bgClass = "bg-[#fee2e2]";
        textClass = "text-[#991b1b] opacity-50";
    }
    if (isMistake) {
        bgClass = "bg-[#ef4444]";
        textClass = "text-white";
    }

    // Accessibility state description
    const getAccessibilityState = () => {
        if (isMarked && isCalled) return 'marked correctly';
        if (isMarked && !isCalled) return 'marked incorrectly';
        if (isCalled && !isMarked) return 'called, tap to mark';
        return 'not called yet';
    };

    return (
        <TouchableOpacity
            className={`w-full h-full items-center justify-center ${bgClass} relative overflow-hidden`}
            onPress={() => onPress(row, col)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Number ${value}, ${getAccessibilityState()}`}
            accessibilityHint={isMarked ? undefined : 'Double tap to mark this number'}
            accessibilityState={{
                selected: isMarked,
                disabled: isMarked && isCalled
            }}
        >
            <Text
                className={`font-bold ${textClass} ${isMarked && 'opacity-0'} z-10`}
                style={{ fontSize }}
                accessibilityElementsHidden
            >
                {value}
            </Text>

            {/* 3D Chip Overlay */}
            {isMarked && (
                <View className="absolute inset-0 items-center justify-center">
                    {/* Shadow */}
                    <View className="absolute w-[85%] h-[85%] rounded-full bg-black/30 top-1" />

                    {/* Main Chip Body - Uses skin colors when correctly marked */}
                    <View
                        style={{
                            width: '85%',
                            height: '85%',
                            borderRadius: 999,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 2,
                            backgroundColor: isCalled
                                ? getSkinColors(activeSkin).bg
                                : getSkinColors(activeSkin).incorrectBg,
                            borderColor: isCalled
                                ? getSkinColors(activeSkin).border
                                : getSkinColors(activeSkin).incorrectBorder,
                        }}
                    >
                        {/* Inner Ring (Detail) */}
                        <View className="w-[70%] h-[70%] rounded-full border border-white/20 items-center justify-center">
                            {/* Number on Chip */}
                            <Text className="font-black text-white shadow-sm" style={{ fontSize: fontSize * 0.8 }}>
                                {value}
                            </Text>
                        </View>

                        {/* Shine Highlight */}
                        <View className="absolute top-1 left-2 w-[40%] h-[20%] rounded-full bg-white/30 transform -rotate-12" />
                    </View>
                </View>
            )}
        </TouchableOpacity>
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

    // Responsive sizing
    const cellFontSize = compact ? scaleFont(14, 12) : scaleFont(18, 14);
    const headerPadY = Math.max(2, scale(4));
    const headerPadX = Math.max(6, scale(10));
    const headerTextFontSize = scaleFont(10, 8);

    const handlePress = useCallback((row: number, col: number) => {
        const cell = card.grid[row][col];
        if (cell.value === null || !onCellPress) return;

        const isCalled = calledNumbers.includes(cell.value);

        if (!isCalled) {
            setMistakeCell(`${row}-${col}`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setTimeout(() => setMistakeCell(null), 800);
            return;
        }

        if (cell.isMarked) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onCellPress(row, col);
    }, [card.grid, calledNumbers, onCellPress]);

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
                    className="text-[#8b6b4a] font-bold uppercase tracking-widest"
                    style={{ fontSize: headerTextFontSize }}
                >
                    CARD #{card.id.slice(-3)}
                </Text>
                <View className="bg-black/20 px-1.5 py-0.5 rounded-md border" style={{ borderColor: theme.border }}>
                    <Text
                        className={`font-bold uppercase tracking-widest ${remainingOnCard === 0 ? 'text-[#4ade80]' : 'text-[#f5e6c8]'}`}
                        style={{ fontSize: headerTextFontSize }}
                    >
                        {remainingOnCard === 0 ? 'COMPLETE' : `${remainingOnCard} LEFT`}
                    </Text>
                </View>
            </View>

            {/* Grid - Uses flex to fill available height */}
            <View className="flex-1 p-0.5" style={{ backgroundColor: theme.gridBg }}>
                {card.grid.map((row, rIdx) => (
                    <View key={rIdx} className="flex-row flex-1">
                        {row.map((cell, cIdx) => {
                            const isCalled = cell.value !== null && calledNumbers.includes(cell.value);
                            const isMissed = isCalled && !cell.isMarked && (calledNumbers.length - 1 - calledNumbers.indexOf(cell.value!) >= 2);

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
