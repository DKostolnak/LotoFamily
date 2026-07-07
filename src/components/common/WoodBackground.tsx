/**
 * WoodBackground - Shared wood texture background component
 *
 * Provides consistent wood texture background across all screens
 * with optional overlay for different scenarios.
 */

import React, { memo, ReactNode } from 'react';
import { ImageBackground, View, StyleSheet, ViewStyle, Image } from 'react-native';
import { StatusBar, StatusBarStyle } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const WOOD_TEXTURE = require('../../../assets/wood-seamless.png');
const FOLK_PATTERN = require('../../../assets/folk-background.png');

interface WoodBackgroundProps {
    children: ReactNode;
    /** Overlay darkness (0-1), default 0.3 */
    overlayOpacity?: number;
    /** Custom overlay color, default black */
    overlayColor?: string;
    /** Status bar style, default 'light' */
    statusBarStyle?: StatusBarStyle;
    /** Additional styles for the container */
    style?: ViewStyle;
    /** Whether to show the overlay at all */
    showOverlay?: boolean;
    /** Whether to render the folk pattern background overlay */
    useFolkPattern?: boolean;
    /** Darkened top/bottom vignette for depth (default true) */
    vignette?: boolean;
    /**
     * Warm "tavern lamp" light — a soft radial glow from the upper center,
     * as if a lamp hangs above the table. Gives the home screen a cozy
     * focal point without a busy pattern image.
     */
    warmGlow?: boolean;
}

export const WoodBackground = memo(({
    children,
    overlayOpacity = 0.3,
    overlayColor = '#000000',
    statusBarStyle = 'light',
    style,
    showOverlay = true,
    useFolkPattern = false,
    vignette = true,
    warmGlow = false,
}: WoodBackgroundProps) => {
    return (
        <ImageBackground
            source={WOOD_TEXTURE}
            style={[styles.background, style]}
            // Explicit 100% size: on web the repeat-mode image otherwise
            // falls back to its intrinsic 512px size and only covers part
            // of the screen.
            imageStyle={styles.textureFill}
            resizeMode="repeat"
        >
            <StatusBar style={statusBarStyle} />

            {useFolkPattern && (
                <Image
                    source={FOLK_PATTERN}
                    style={styles.folkPattern}
                    resizeMode="cover"
                />
            )}

            {showOverlay && (
                <View
                    style={[
                        styles.overlay,
                        { backgroundColor: overlayColor, opacity: overlayOpacity }
                    ]}
                    pointerEvents="none"
                />
            )}

            {/* Warm lamp light from above — radial gold glow fading into the
                dark wood. Rendered after the dark overlay so the light sits
                on top of it. */}
            {warmGlow && (
                <View style={styles.overlay} pointerEvents="none">
                    <Svg width="100%" height="100%">
                        <Defs>
                            <RadialGradient id="lamp" cx="50%" cy="24%" rx="75%" ry="48%">
                                <Stop offset="0%" stopColor="#ffca5f" stopOpacity={0.26} />
                                <Stop offset="45%" stopColor="#ff9d2e" stopOpacity={0.10} />
                                <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
                            </RadialGradient>
                        </Defs>
                        <Rect x="0" y="0" width="100%" height="100%" fill="url(#lamp)" />
                    </Svg>
                </View>
            )}

            {/* Vignette — darkened top/bottom edges give the flat texture depth */}
            {vignette && (
                <LinearGradient
                    pointerEvents="none"
                    colors={[
                        'rgba(0, 0, 0, 0.38)',
                        'rgba(0, 0, 0, 0)',
                        'rgba(0, 0, 0, 0)',
                        'rgba(0, 0, 0, 0.45)',
                    ]}
                    locations={[0, 0.22, 0.68, 1]}
                    style={styles.overlay}
                />
            )}

            {children}
        </ImageBackground>
    );
});

WoodBackground.displayName = 'WoodBackground';

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    folkPattern: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    textureFill: {
        width: '100%',
        height: '100%',
    },
});
