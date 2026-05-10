import React, { forwardRef } from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks';

export interface WoodenInputProps extends TextInputProps {
    label?: string;
    fullWidth?: boolean;
    containerStyle?: ViewStyle;
}

export const WoodenInput = forwardRef<TextInput, WoodenInputProps>(
    function WoodenInput({ label, fullWidth = true, containerStyle, style, ...props }, ref) {
        const { scale, scaleFont } = useResponsive();

        const labelFontSize = scaleFont(12, 10);
        const inputFontSize = scaleFont(18, 14);
        const padding = scale(16);

        return (
            <View style={[fullWidth ? { width: '100%' } : {}, containerStyle]}>
                {label && (
                    <Text
                        className="text-muted font-bold mb-2 uppercase"
                        style={{ fontSize: labelFontSize }}
                    >
                        {label}
                    </Text>
                )}
                <TextInput
                    ref={ref}
                    className="bg-wood-darkest border-[2px] border-wood-medium rounded-xl p-4 text-gold font-bold text-lg"
                    placeholderTextColor="#5a4025"
                    accessibilityLabel={props.accessibilityLabel || label}
                    style={[
                        label ? { marginTop: 0 } : null,
                        { fontSize: inputFontSize, paddingHorizontal: padding, paddingVertical: padding },
                        style,
                    ]}
                    {...props}
                />
            </View>
        );
    }
);
