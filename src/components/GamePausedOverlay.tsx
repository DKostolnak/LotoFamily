/**
 * GamePausedOverlay - Full-screen overlay shown when game is paused
 *
 * Features:
 * - Blurred dark background overlay
 * - Pulse animation on pause icon
 * - Room code display (no QR code in mobile - use clipboard instead)
 * - Resume button for host, waiting message for players
 */

import React, { memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { WoodenButton } from '@/components/common';
import * as Clipboard from 'expo-clipboard';
import { useHapticFeedback } from '@/hooks';

// ============================================================================
// TYPES
// ============================================================================

interface GamePausedOverlayProps {
    /** Room code to display */
    roomCode: string;
    /** Whether current user is the host */
    isHost: boolean;
    /** Callback when host resumes game */
    onResume: () => void;
    /** Translation strings */
    t: {
        paused: string;
        pausedByHost: string;
        roomCodeLabel: string;
        resume: string;
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
    t,
}: GamePausedOverlayProps) {
    const { triggerHaptic } = useHapticFeedback();
    const [isCopied, setIsCopied] = React.useState(false);

    // Pulse animation for pause icon
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            true
        );
    }, [pulseScale]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const handleCopyCode = async () => {
        await Clipboard.setStringAsync(roomCode);
        triggerHaptic('light');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleResume = () => {
        triggerHaptic('medium');
        onResume();
    };

    return (
        <Modal
            visible
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => {
                // Android back button: host can resume; players cannot dismiss.
                if (isHost) {
                    onResume();
                }
            }}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Pause Icon */}
                    <Animated.View style={[styles.iconContainer, pulseStyle]}>
                        <Text style={styles.pauseIcon}>⏸️</Text>
                    </Animated.View>

                    {/* Title */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{t.paused}</Text>
                        <Text style={styles.subtitle}>{t.pausedByHost}</Text>
                    </View>

                    {/* Room Code */}
                    <TouchableOpacity
                        style={styles.roomCodeContainer}
                        onPress={handleCopyCode}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.roomCodeLabel}>
                            {t.roomCodeLabel}
                        </Text>
                        <Text style={styles.roomCode}>{roomCode}</Text>
                        <Text style={styles.tapToCopy}>
                            {isCopied ? (t.copied || '✓ Copied!') : (t.tapToCopy || 'Tap to copy')}
                        </Text>
                    </TouchableOpacity>

                    {/* Resume Button (Host only) or Waiting message */}
                    {isHost ? (
                        <WoodenButton
                            variant="success"
                            size="lg"
                            onPress={handleResume}
                            style={styles.resumeButton}
                        >
                            ▶️ {t.resume}
                        </WoodenButton>
                    ) : (
                        <View style={styles.waitingContainer}>
                            <Text style={styles.waitingText}>
                                {t.waitingForHost}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
});

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: 'rgba(26, 17, 9, 0.98)',
        borderWidth: 4,
        borderColor: '#8b6b4a',
        borderRadius: 24,
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        gap: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.8,
        shadowRadius: 50,
        elevation: 24,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ffd700',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ffd700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 10,
    },
    pauseIcon: {
        fontSize: 48,
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#ffd700',
        textTransform: 'uppercase',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        color: '#a0937e',
        fontSize: 16,
        marginTop: 8,
    },
    roomCodeContainer: {
        backgroundColor: '#2d1f10',
        borderWidth: 2,
        borderColor: '#5a4025',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        alignItems: 'center',
        gap: 8,
    },
    roomCodeLabel: {
        color: '#8b6b4a',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    roomCode: {
        fontSize: 32,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 6,
        textShadowColor: 'rgba(255, 215, 0, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    tapToCopy: {
        color: '#6b5b4a',
        fontSize: 12,
        marginTop: 4,
    },
    resumeButton: {
        width: '100%',
    },
    waitingContainer: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(139, 107, 74, 0.2)',
        borderWidth: 1,
        borderColor: '#5a4025',
        alignItems: 'center',
    },
    waitingText: {
        color: '#8b6b4a',
        fontSize: 15,
        fontStyle: 'italic',
    },
});

export default GamePausedOverlay;
