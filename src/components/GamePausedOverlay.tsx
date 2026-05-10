/**
 * GamePausedOverlay - Full-screen overlay shown when game is paused.
 *
 * Cozy "drevený stôl" design:
 *  - Dark overlay over the game table
 *  - PAUZA hero (display, gold)
 *  - Resume (gold lg) — host only, otherwise waiting message
 *  - Restart (md secondary) — host only, optional
 *  - Quit / Exit (md danger) — always shown
 *  - Optional room code chip (tap to copy) for quick re-share
 */

import React, { memo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { WoodenButton } from '@/components/common';
import { useHapticFeedback } from '@/hooks';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

// ============================================================================
// TYPES
// ============================================================================

interface GamePausedOverlayProps {
    /** Room code to display (optional — pass when in online mode). */
    roomCode?: string;
    /** Whether the current user is the host. */
    isHost: boolean;
    /** Resume callback (host only). */
    onResume: () => void;
    /** Optional restart callback (host only). */
    onRestart?: () => void;
    /** Optional quit / leave callback. */
    onQuit?: () => void;
    /** Translation strings. */
    t: {
        paused: string;
        pausedByHost?: string;
        roomCodeLabel?: string;
        resume: string;
        restart?: string;
        exitGame?: string;
        waitingForHost: string;
        tapToCopy?: string;
        copied?: string;
    };
}

// ============================================================================
// COMPONENT
// ============================================================================

const GamePausedOverlay = memo(function GamePausedOverlay({
    roomCode,
    isHost,
    onResume,
    onRestart,
    onQuit,
    t,
}: GamePausedOverlayProps) {
    const { triggerHaptic } = useHapticFeedback();
    const [isCopied, setIsCopied] = useState(false);

    // Subtle pulse on hero
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.04, { duration: 1100 }),
                withTiming(1, { duration: 1100 })
            ),
            -1,
            true
        );
    }, [pulseScale]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const handleCopyCode = async () => {
        if (!roomCode) return;
        await Clipboard.setStringAsync(roomCode);
        triggerHaptic('light');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1800);
    };

    const handleResume = () => {
        triggerHaptic('medium');
        onResume();
    };

    const handleRestart = () => {
        triggerHaptic('medium');
        onRestart?.();
    };

    const handleQuit = () => {
        triggerHaptic('medium');
        onQuit?.();
    };

    return (
        <Modal
            visible
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => {
                if (isHost) onResume();
            }}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: SPACING.xxxl,
                }}
            >
                <View
                    style={{
                        width: '100%',
                        maxWidth: 380,
                        backgroundColor: 'rgba(26, 17, 9, 0.98)',
                        borderWidth: 4,
                        borderColor: '#8b6b4a',
                        borderRadius: RADII.xl,
                        paddingVertical: SPACING.xxl,
                        paddingHorizontal: SPACING.xl,
                        alignItems: 'center',
                        gap: SPACING.xl,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 20 },
                        shadowOpacity: 0.8,
                        shadowRadius: 50,
                        elevation: 24,
                    }}
                >
                    {/* Hero PAUZA title */}
                    <Animated.View style={[pulseStyle, { alignItems: 'center' }]}>
                        <Text
                            style={[
                                TEXT_STYLES.display,
                                {
                                    color: '#ffd700',
                                    textTransform: 'uppercase',
                                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                                    textShadowOffset: { width: 0, height: 2 },
                                    textShadowRadius: 4,
                                },
                            ]}
                        >
                            {t.paused ?? 'PAUSED'}
                        </Text>
                        {t.pausedByHost && (
                            <Text
                                style={[
                                    TEXT_STYLES.body,
                                    { color: '#d4b896', marginTop: SPACING.xs, textAlign: 'center' },
                                ]}
                            >
                                {t.pausedByHost}
                            </Text>
                        )}
                    </Animated.View>

                    {/* Optional room code chip */}
                    {roomCode && (
                        <TouchableOpacity
                            onPress={handleCopyCode}
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityLabel={`${t.roomCodeLabel ?? 'Room code'}: ${roomCode}`}
                            style={{
                                width: '100%',
                                backgroundColor: '#2d1f10',
                                borderWidth: 2,
                                borderColor: '#5a4025',
                                borderRadius: RADII.lg,
                                paddingVertical: SPACING.md,
                                paddingHorizontal: SPACING.lg,
                                alignItems: 'center',
                                gap: SPACING.xs,
                            }}
                        >
                            <Text style={[TEXT_STYLES.captionUpper, { color: '#d4b896' }]}>
                                {t.roomCodeLabel ?? 'ROOM CODE'}
                            </Text>
                            <Text
                                style={[
                                    TEXT_STYLES.h1,
                                    {
                                        color: '#f5e6c8',
                                        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                                        letterSpacing: 4,
                                    },
                                ]}
                            >
                                {roomCode}
                            </Text>
                            <Text style={[TEXT_STYLES.caption, { color: '#d4b896' }]}>
                                {isCopied ? (t.copied ?? 'Copied') : (t.tapToCopy ?? 'Tap to copy')}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Action buttons */}
                    <View style={{ width: '100%', gap: SPACING.md }}>
                        {isHost ? (
                            <WoodenButton
                                variant="gold"
                                size="lg"
                                onPress={handleResume}
                                fullWidth
                                accessibilityLabel={t.resume ?? 'Resume'}
                            >
                                {t.resume ?? 'RESUME'}
                            </WoodenButton>
                        ) : (
                            <View
                                style={{
                                    width: '100%',
                                    padding: SPACING.lg,
                                    borderRadius: RADII.lg,
                                    backgroundColor: 'rgba(139, 107, 74, 0.2)',
                                    borderWidth: 1,
                                    borderColor: '#5a4025',
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={[
                                        TEXT_STYLES.body,
                                        { color: '#d4b896', fontStyle: 'italic', textAlign: 'center' },
                                    ]}
                                >
                                    {t.waitingForHost ?? 'Waiting for host…'}
                                </Text>
                            </View>
                        )}

                        {isHost && onRestart && (
                            <WoodenButton
                                variant="secondary"
                                size="md"
                                onPress={handleRestart}
                                fullWidth
                            >
                                {t.restart ?? 'RESTART'}
                            </WoodenButton>
                        )}

                        {onQuit && (
                            <WoodenButton
                                variant="danger"
                                size="md"
                                onPress={handleQuit}
                                fullWidth
                            >
                                {t.exitGame ?? 'EXIT'}
                            </WoodenButton>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
});

export default GamePausedOverlay;
