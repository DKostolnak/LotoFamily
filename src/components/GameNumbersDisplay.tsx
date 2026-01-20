import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { NumberMedallion } from './NumberMedallion';
import Animated, { FadeInRight, FadeOutRight, Layout } from 'react-native-reanimated';

interface GameNumbersDisplayProps {
    currentNumber: number | null;
    history: number[];
    compact?: boolean;
}

const GameNumbersDisplayComponent = ({ currentNumber, history, compact = false }: GameNumbersDisplayProps) => {
    // Responsive sizes based on compact mode
    const dentSize = compact ? 64 : 84;
    const historyHeight = compact ? 38 : 50;
    const historyPaddingLeft = compact ? 28 : 36;

    return (
        <View style={styles.container}>
            {/* Main Number Dent/Inset */}
            <View style={styles.mainWrapper}>
                <View style={[
                    styles.dent,
                    { width: dentSize, height: dentSize, borderRadius: dentSize / 2 }
                ]}>
                    <NumberMedallion number={currentNumber} size={compact ? 'md' : 'lg'} />
                </View>
            </View>

            {/* History Strip - Animated chips sliding in */}
            {history.length > 0 && (
                <View style={styles.historyWrapper}>
                    <View style={[
                        styles.historyTrack,
                        { height: historyHeight, paddingLeft: historyPaddingLeft, gap: compact ? 4 : 6 }
                    ]}>
                        {history.slice(0, compact ? 2 : 4).map((num, idx) => (
                            <Animated.View
                                key={`${num}-${history.length}-${idx}`}
                                entering={FadeInRight.delay(idx * 50).duration(300)}
                                exiting={FadeOutRight.duration(200)}
                                layout={Layout.springify().damping(15)}
                                style={{ opacity: 1 - idx * 0.15 }}
                            >
                                <NumberMedallion number={num} size="sm" />
                            </Animated.View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
};

export const GameNumbersDisplay = memo(GameNumbersDisplayComponent);
GameNumbersDisplay.displayName = 'GameNumbersDisplay';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        width: '80%',
        position: 'relative',
    },
    mainWrapper: {
        position: 'absolute',
        left: '25%',
        zIndex: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyWrapper: {
        position: 'absolute',
        left: '42%',
        zIndex: 10,
    },
    dent: {
        backgroundColor: '#1a1109',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderTopWidth: 3,
        borderTopColor: 'rgba(0,0,0,0.8)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 8,
    },
    historyTrack: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#261b12',
        padding: 4,
        paddingRight: 8,
        borderRadius: 20,
        borderTopWidth: 2,
        borderTopColor: 'rgba(0,0,0,0.5)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        zIndex: 10,
    }
});
