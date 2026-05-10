/**
 * HostCallerScreen — Host view for calling numbers and managing the game.
 *
 * Cozy "drevený stôl" design language:
 *  - PlayerList compact roster on top
 *  - Hero current-number medallion (xl) framed in gold
 *  - History strip below the hero (handled via NumberMedallion chips)
 *  - Big "Call Next Number" CTA (WoodenButton xl)
 *  - Pause/Resume + End game in a control row
 *  - Stats footer using design tokens
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NumberMedallion } from './NumberMedallion';
import { PlayerList } from './PlayerList';
import { WoodenButton } from './common';
import type { GameState, Player } from '@/lib/types';
import { translations } from '@/lib/i18n';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

// ============================================================================
// TYPES
// ============================================================================

interface HostCallerScreenProps {
    gameState: GameState;
    onCallNumber: () => void;
    onPause: () => void;
    onResume: () => void;
    onEndGame: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function HostCallerScreen({
    gameState,
    onCallNumber,
    onPause,
    onResume,
    onEndGame,
}: HostCallerScreenProps) {
    const calledNumberValues = gameState.calledNumbers.map((cn) => cn.value);
    const isPaused = gameState.phase === 'paused';
    const t = translations[gameState.settings.language || 'en'];
    const canCallNumber = gameState.phase === 'playing' && gameState.remainingNumbers.length > 0;
    const remainingCount = gameState.remainingNumbers.length;
    const totalCalled = 90 - remainingCount;

    // History excluding the current value (newest-first → reverse for display).
    const historyChips = calledNumberValues.slice(1, 6).reverse();

    return (
        <View style={styles.container}>
            {/* Players Row */}
            <View style={styles.playersRow}>
                <PlayerList
                    players={gameState.players as Player[]}
                    currentPlayerId={gameState.hostId}
                />
            </View>

            {/* Current Number Display */}
            <View style={styles.numberPanel}>
                <Text style={[TEXT_STYLES.captionUpper, styles.label]}>
                    {t.currentNumber ?? 'CURRENT NUMBER'}
                </Text>

                {/* Hero medallion in gold frame */}
                <View style={styles.medallionContainer}>
                    <LinearGradient
                        colors={['#FFD700', '#FFA500', '#FFD700']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.goldFrame}
                    >
                        <View style={styles.innerFrame}>
                            <NumberMedallion number={gameState.currentNumber} size="xl" />
                        </View>
                    </LinearGradient>
                </View>

                {/* History chips */}
                {historyChips.length > 0 && (
                    <View style={styles.historyRow}>
                        {historyChips.map((num, i) => {
                            const ageFromNewest = historyChips.length - 1 - i;
                            const opacity = Math.max(0.4, 1 - ageFromNewest * 0.18);
                            return (
                                <View key={`${num}-${i}`} style={{ opacity }}>
                                    <NumberMedallion number={num} size="sm" />
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Call Number Button — primary CTA */}
            <WoodenButton
                variant="success"
                size="xl"
                fullWidth
                onPress={onCallNumber}
                disabled={!canCallNumber}
                accessibilityLabel={t.callNext ?? 'Call next number'}
            >
                {isPaused ? (t.paused ?? 'PAUSED') : (t.callNext ?? 'CALL NEXT NUMBER')}
            </WoodenButton>

            {/* Control Buttons Row */}
            <View style={styles.controlsRow}>
                {isPaused ? (
                    <WoodenButton variant="primary" size="md" onPress={onResume} style={styles.controlButton}>
                        {t.resume ?? 'RESUME'}
                    </WoodenButton>
                ) : (
                    <WoodenButton variant="secondary" size="md" onPress={onPause} style={styles.controlButton}>
                        {t.pause ?? 'PAUSE'}
                    </WoodenButton>
                )}
                <WoodenButton variant="danger" size="md" onPress={onEndGame} style={styles.controlButton}>
                    {t.endGame ?? 'END GAME'}
                </WoodenButton>
            </View>

            {/* Stats Footer */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={[TEXT_STYLES.h1, styles.statValue]}>{totalCalled}</Text>
                    <Text style={[TEXT_STYLES.captionUpper, styles.statLabel]}>
                        {t.called ?? 'CALLED'}
                    </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[TEXT_STYLES.h1, styles.statValue]}>{remainingCount}</Text>
                    <Text style={[TEXT_STYLES.captionUpper, styles.statLabel]}>
                        {t.remaining ?? 'REMAINING'}
                    </Text>
                </View>
            </View>
        </View>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        gap: SPACING.lg,
    },
    playersRow: {
        alignItems: 'stretch',
    },
    numberPanel: {
        backgroundColor: 'rgba(45, 31, 16, 0.85)',
        borderRadius: RADII.xl,
        paddingVertical: SPACING.xl,
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#5a4025',
        gap: SPACING.lg,
    },
    label: {
        color: '#d4b896',
    },
    medallionContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    goldFrame: {
        padding: 5,
        borderRadius: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    innerFrame: {
        padding: 3,
        borderRadius: 999,
        backgroundColor: '#3d2814',
    },
    historyRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    controlsRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    controlButton: {
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.xl,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        color: '#ffd700',
    },
    statLabel: {
        color: '#d4b896',
        marginTop: SPACING.xs,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#5a4025',
    },
});
