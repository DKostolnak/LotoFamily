/**
 * WoodBackground - Shared wood texture background component
 * 
 * Provides consistent wood texture background across all screens
 * with optional overlay for different scenarios.
 */

import React, { memo, ReactNode } from 'react';
import { ImageBackground, View, StyleSheet, ViewStyle } from 'react-native';
import { StatusBar, StatusBarStyle } from 'expo-status-bar';

const WOOD_TEXTURE = require('../../../assets/wood-seamless.png');

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
}

export const WoodBackground = memo(({
    children,
    overlayOpacity = 0.3,
    overlayColor = '#000000',
    statusBarStyle = 'light',
    style,
    showOverlay = true,
}: WoodBackgroundProps) => {
    return (
        <ImageBackground 
            source={WOOD_TEXTURE} 
            style={[styles.background, style]} 
            resizeMode="repeat"
        >
            <StatusBar style={statusBarStyle} />
            
            {showOverlay && (
                <View 
                    style={[
                        styles.overlay, 
                        { backgroundColor: overlayColor, opacity: overlayOpacity }
                    ]} 
                    pointerEvents="none" 
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
});
