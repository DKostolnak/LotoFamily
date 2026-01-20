import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { ChevronLeft, X } from 'lucide-react-native';
import { useResponsive } from '@/hooks';


export interface WoodenCardProps {
    children: React.ReactNode;
    title?: string;
    showBackArrow?: boolean;
    onBack?: () => void;
    onClose?: () => void;
    style?: ViewStyle;
    className?: string; // For NativeWind
}

export function WoodenCard({
    children,
    title,
    showBackArrow,
    onBack,
    onClose,
    style,
    className,
}: WoodenCardProps) {
    const { screenWidth, scale, scaleFont, scaleIcon, isTablet } = useResponsive();

    const horizontalMargin = scale(16);
    const maxWidth = isTablet ? 560 : 520;
    const containerMaxWidth = Math.min(maxWidth, Math.max(320, screenWidth - horizontalMargin * 2));
    const padding = scale(16);
    const paddingTop = scale(20);
    const radius = scale(24);

    const chromeButtonSize = Math.max(44, scale(40));
    const chromeIconSize = scaleIcon(24, 20);
    const titleFontSize = scaleFont(24, 18);

    return (
        <View
            className={className}
            style={{
                width: '100%',
                backgroundColor: 'rgba(26, 17, 9, 0.95)',
                borderWidth: 4,
                borderColor: '#8b6b4a',
                alignItems: 'center',
                gap: 16,
                maxWidth: containerMaxWidth,
                borderRadius: radius,
                paddingHorizontal: padding,
                paddingBottom: padding,
                paddingTop,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.8,
                shadowRadius: 50,
                elevation: 10,
                ...style,
            }}
        >
            {/* Back Arrow */}
            {showBackArrow && onBack && (
                <TouchableOpacity
                    onPress={onBack}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    style={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        backgroundColor: '#c9a66b',
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: '#5a4025',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20,
                        width: chromeButtonSize,
                        height: chromeButtonSize,
                        shadowColor: '#3d2814',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                    }}
                >
                    <ChevronLeft color="#3d2814" size={chromeIconSize} strokeWidth={2.5} />
                </TouchableOpacity>
            )}

            {/* Close Button */}
            {onClose && (
                <TouchableOpacity
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        backgroundColor: '#c9a66b',
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: '#5a4025',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20,
                        width: chromeButtonSize,
                        height: chromeButtonSize,
                        shadowColor: '#3d2814',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                    }}
                >
                    <X color="#3d2814" size={chromeIconSize} strokeWidth={2.5} />
                </TouchableOpacity>
            )}

            {/* Title */}
            {title && (
                <View style={{ marginBottom: 8, width: '100%', alignItems: 'center' }}>
                    <Text
                        style={{
                            fontWeight: '900',
                            color: '#ffd700',
                            textTransform: 'uppercase',
                            textAlign: 'center',
                            fontSize: titleFontSize,
                            textShadowColor: 'rgba(0,0,0,0.5)',
                            textShadowOffset: { width: 0, height: 2 },
                            textShadowRadius: 4,
                        }}
                    >
                        {title}
                    </Text>
                </View>
            )}

            {children}
        </View>
    );
}
