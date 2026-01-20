import React from 'react';
import { View, Text, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import { Trophy, Medal, Star, Crown } from 'lucide-react-native';

// Corrected path to assets (2 levels up from src/components)
const WOOD_TEXTURE = require('../../assets/wood-seamless.png');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VictoryCardProps {
    playerName: string;
    playerAvatar: string;
    prize: number;
    level: number;
    date: string;
}

export const VictoryCard = ({ playerName, playerAvatar, prize, level, date }: VictoryCardProps) => {
    return (
        <View style={styles.container}>
            <ImageBackground source={WOOD_TEXTURE} style={styles.card} resizeMode="repeat">
                <View style={styles.overlay} />

                {/* Border Frame */}
                <View style={styles.frame}>
                    <View style={styles.innerFrame}>

                        {/* Header Decoration */}
                        <View style={styles.crownContainer}>
                            <Crown size={40} color="#ffd700" fill="#ffd700" />
                        </View>

                        {/* Title Section */}
                        <View style={styles.header}>
                            <View style={styles.line} />
                            <Text style={styles.title}>VICTORY</Text>
                            <View style={styles.line} />
                        </View>
                        <Text style={styles.subtitle}>BINGO MASTER</Text>

                        {/* Avatar & Level */}
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarGlow} />
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarText}>{playerAvatar}</Text>
                            </View>
                            <View style={styles.levelBadge}>
                                <Text style={styles.levelText}>LVL {level}</Text>
                            </View>
                        </View>

                        {/* Player Name */}
                        <View style={styles.nameSection}>
                            <Text style={styles.nameLabel}>PLAYER</Text>
                            <Text style={styles.nameText}>{playerName.toUpperCase()}</Text>
                        </View>

                        {/* Space */}
                        <View style={{ flex: 1 }} />

                        {/* Prize Section with high emphasis */}
                        <View style={styles.prizeContainer}>
                            <View style={styles.prizeHeader}>
                                <Trophy size={20} color="#ffd700" />
                                <Text style={styles.prizeLabel}>CLAIMED PRIZE</Text>
                                <Trophy size={20} color="#ffd700" />
                            </View>
                            <View style={styles.prizeValueBox}>
                                <Text style={styles.prizeSymbol}>💰</Text>
                                <Text style={styles.prizeValue}>{prize.toLocaleString()}</Text>
                                <Text style={styles.prizeUnit}>LCOINS</Text>
                            </View>
                        </View>

                        {/* Footer Info */}
                        <View style={styles.footer}>
                            <View style={styles.starRow}>
                                <Star size={12} color="#ffd700" fill="#ffd700" />
                                <Star size={12} color="#ffd700" fill="#ffd700" />
                                <Star size={12} color="#ffd700" fill="#ffd700" />
                                <Star size={12} color="#ffd700" fill="#ffd700" />
                                <Star size={12} color="#ffd700" fill="#ffd700" />
                            </View>
                            <Text style={styles.dateText}>{date}</Text>
                        </View>

                        {/* Branding */}
                        <View style={styles.branding}>
                            <Text style={styles.gameTitle}>LOTO MULTIPLAYER</Text>
                            <Text style={styles.version}>PREMIUM EDITION</Text>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 340,
        height: 520,
        backgroundColor: '#000',
        borderRadius: 32,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    card: {
        flex: 1,
        padding: 12,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26, 17, 9, 0.75)',
    },
    frame: {
        flex: 1,
        borderWidth: 6,
        borderColor: '#a6814c',
        borderRadius: 24,
        padding: 4,
    },
    innerFrame: {
        flex: 1,
        borderWidth: 2,
        borderColor: '#ffd700',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    crownContainer: {
        marginBottom: -10,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginTop: 5,
    },
    line: {
        height: 2,
        width: 40,
        backgroundColor: '#ffd700',
        opacity: 0.5,
    },
    title: {
        color: '#ffd700',
        fontSize: 36,
        fontWeight: '900',
        letterSpacing: 4,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        color: '#a6814c',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 6,
        marginTop: -5,
        marginBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarGlow: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
    },
    avatarCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#3d2814',
        borderWidth: 4,
        borderColor: '#ffd700',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ffd700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    avatarText: {
        fontSize: 55,
    },
    levelBadge: {
        position: 'absolute',
        bottom: -8,
        backgroundColor: '#ffd700',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#3d2814',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    levelText: {
        color: '#3d2814',
        fontWeight: '900',
        fontSize: 12,
    },
    nameSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    nameLabel: {
        color: '#8b6b4a',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 3,
        marginBottom: 4,
    },
    nameText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    prizeContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 25,
    },
    prizeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    prizeLabel: {
        color: '#ffd700',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
    prizeValueBox: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: '100%',
        paddingVertical: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    prizeSymbol: {
        fontSize: 24,
    },
    prizeValue: {
        color: '#ffd700',
        fontSize: 34,
        fontWeight: '900',
        textShadowColor: 'rgba(184, 134, 11, 0.5)',
        textShadowRadius: 10,
    },
    prizeUnit: {
        color: '#ffd700',
        fontSize: 12,
        fontWeight: 'bold',
        opacity: 0.7,
        marginTop: 8,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        gap: 8,
    },
    starRow: {
        flexDirection: 'row',
        gap: 8,
    },
    dateText: {
        color: '#8b6b4a',
        fontSize: 11,
        fontWeight: 'bold',
        opacity: 0.8,
    },
    branding: {
        alignItems: 'center',
        marginTop: 15,
        opacity: 0.4,
    },
    gameTitle: {
        color: '#ffd700',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    version: {
        color: '#8b6b4a',
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
