/**
 * HostCallerScreen - Host view for calling numbers and managing the game
 * 
 * Displays the current number prominently with controls to:
 * - Call the next number
 * - Pause/resume the game
 * - End the game
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NumberMedallion } from './NumberMedallion';
import { PlayerList } from './PlayerList';
import { WoodenButton } from './common';
import type { GameState, Player } from '@/lib/types';
import { translations } from '@/lib/translations';

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
    const calledNumberValues = gameState.calledNumbers.map(cn => cn.value);
    const isPaused = gameState.phase === 'paused';
    const t = translations[gameState.settings.language || 'en'];
    const canCallNumber = gameState.phase === 'playing' && gameState.remainingNumbers.length > 0;
    const remainingCount = gameState.remainingNumbers.length;
    const totalCalled = 90 - remainingCount;

    return (
        <View style={styles.container}>
            {/* Players Row */}
            <View style={styles.playersRow}>
                <PlayerList
                    players={gameState.players as Player[]}
                    currentPlayerId={gameState.hostId}
                    compact
                />
            </View>

            {/* Current Number Display */}
            <View style={styles.numberPanel}>
                <Text style={styles.label}>{t.currentNumber}</Text>

                {/* Large Medallion with Glow */}
                <View style={styles.medallionContainer}>
                    {/* Glow effect */}
                    <View style={styles.glow} />

                    {/* Gold frame */}
                    <LinearGradient
                        colors={['#FFD700', '#FFA500', '#FFD700']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.goldFrame}
                    >
                        <View style={styles.innerFrame}>
                            <NumberMedallion number={gameState.currentNumber} size="lg" />
                        </View>
                    </LinearGradient>
                </View>

                {/* History chips */}
                <View style={styles.historyRow}>
                    {calledNumberValues.slice(1, 6).map((num, i) => (
                        <View key={`${num}-${i}`} style={[styles.historyChip, { opacity: 1 - i * 0.15 }]}>
                            <Text style={styles.historyText}>{num}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Call Number Button - Big & Prominent */}
            <TouchableOpacity
                style={[styles.callButton, !canCallNumber && styles.callButtonDisabled]}
                onPress={onCallNumber}
                disabled={!canCallNumber}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={canCallNumber ? ['#4ade80', '#22c55e', '#16a34a'] : ['#6b7280', '#4b5563']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.callButtonGradient}
                >
                    <Text style={styles.callButtonText}>
                        {isPaused ? '⏸️ PAUSED' : '🎱 CALL NUMBER'}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Control Buttons Row */}
            <View style={styles.controlsRow}>
                {isPaused ? (
                    <WoodenButton variant="primary" onPress={onResume} style={styles.controlButton}>
                        ▶️ {t.resume}
                    </WoodenButton>
                ) : (
                    <WoodenButton variant="secondary" onPress={onPause} style={styles.controlButton}>
                        ⏸️ {t.pause}
                    </WoodenButton>
                )}

                <WoodenButton variant="danger" onPress={onEndGame} style={styles.controlButton}>
                    🛑 {t.endGame}
                </WoodenButton>
            </View>

            {/* Stats Footer */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalCalled}</Text>
                    <Text style={styles.statLabel}>Called</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{remainingCount}</Text>
                    <Text style={styles.statLabel}>{t.remaining}</Text>
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
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    playersRow: {
        alignItems: 'center',
        marginBottom: 16,
    },
    numberPanel: {
        backgroundColor: 'rgba(45, 31, 16, 0.8)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#5a4025',
    },
    label: {
        fontSize: 12,
        color: '#f5e6c8',
        opacity: 0.8,
        textTransform: 'uppercase',
        letterSpacing: 2,
        fontWeight: '600',
        marginBottom: 16,
    },
    medallionContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255, 193, 7, 0.3)',
    },
    goldFrame: {
        padding: 5,
        borderRadius: 80,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    innerFrame: {
        padding: 3,
        borderRadius: 80,
        backgroundColor: '#DEB887',
    },
    historyRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 20,
    },
    historyChip: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#8b6b4a',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#5a4025',
    },
    historyText: {
        color: '#f5e6c8',
        fontSize: 14,
        fontWeight: '700',
    },
    callButton: {
        marginTop: 24,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    callButtonDisabled: {
        shadowColor: '#6b7280',
        shadowOpacity: 0.2,
    },
    callButtonGradient: {
        paddingVertical: 20,
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    callButtonText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 2,
        letterSpacing: 2,
    },
    controlsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    controlButton: {
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#ffd700',
    },
    statLabel: {
        fontSize: 12,
        color: '#f5e6c8',
        opacity: 0.7,
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#5a4025',
    },
});
