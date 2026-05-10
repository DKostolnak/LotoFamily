import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { NumberMedallion } from './NumberMedallion';
import { WoodenBarrel } from './common/WoodenBarrel';
import Animated, { FadeInRight, FadeOutLeft, Layout } from 'react-native-reanimated';
import { SPACING, RADII } from '@/lib/config';

interface GameNumbersDisplayProps {
    currentNumber: number | null;
    history: number[];
    /** Compact mode for smaller screens / header embedding. */
    compact?: boolean;
}

/**
 * Volané čísla — kľúčový element hry.
 *
 * - Current number HERO vpravo (xl 120pt / lg 80pt v compact)
 * - History strip vľavo: posledných 5 čísel, najnovšie napravo, najstaršie naľavo s opacity fade
 * - Atmosféra: čísla "zostarnú" smerom doľava
 *
 * Pozn.: `history` je očakávané ako "newest first" (rovnaký kontrakt ako predtým),
 * takže `history[0]` = predchádzajúce volané, `history[1]` = staršie atď.
 */
const GameNumbersDisplayComponent = ({
    currentNumber,
    history,
    compact = false,
}: GameNumbersDisplayProps) => {
    const barrelSize: 'md' | 'lg' = compact ? 'md' : 'lg';
    const chipSize = compact ? 'sm' : 'sm';
    const chipCount = compact ? 4 : 5;

    // Engine appends to end → last in `history` is newest. Drop the very
    // last one (it's already shown in the barrel as the current call) and
    // take the previous N. Result: newest-on-the-right, oldest-on-the-left.
    const lastIdx = history.length;
    const skipCurrent =
        currentNumber !== null && history[lastIdx - 1] === currentNumber ? 1 : 0;
    const start = Math.max(0, lastIdx - skipCurrent - chipCount);
    const end = lastIdx - skipCurrent;
    const historyChips = history.slice(start, end);

    return (
        <View style={[styles.container, { gap: compact ? SPACING.sm : SPACING.md }]}>
            {/* History strip — older numbers fade out left */}
            <View style={[styles.historyTrack, { gap: compact ? SPACING.xs : SPACING.sm }]}>
                {historyChips.map((num, idx) => {
                    // idx 0 = oldest (leftmost), last idx = newest (rightmost)
                    const ageFromNewest = historyChips.length - 1 - idx;
                    const opacity = Math.max(0.35, 1 - ageFromNewest * 0.18);
                    return (
                        <Animated.View
                            key={`history-${num}`}
                            entering={FadeInRight.duration(280)}
                            exiting={FadeOutLeft.duration(180)}
                            layout={Layout.springify().damping(15)}
                            style={{ opacity }}
                        >
                            <NumberMedallion number={num} size={chipSize} />
                        </Animated.View>
                    );
                })}
            </View>

            {/* Current number — wooden barrel hero (rolls + reveals number) */}
            <View style={[styles.heroWrapper, { paddingHorizontal: compact ? SPACING.md : SPACING.xl }]}>
                <WoodenBarrel
                    number={currentNumber}
                    rollKey={history.length}
                    size={barrelSize}
                />
            </View>
        </View>
    );
};

export const GameNumbersDisplay = memo(GameNumbersDisplayComponent);
GameNumbersDisplay.displayName = 'GameNumbersDisplay';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyTrack: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(26, 17, 9, 0.55)',
        borderRadius: RADII.pill,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderWidth: 1,
        borderColor: 'rgba(90, 64, 37, 0.6)',
    },
    heroWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
