import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon, Ghost } from 'lucide-react-native';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    iconColor?: string;
}

/**
 * EmptyState - Illustrated placeholder for empty lists
 */
export const EmptyState = ({
    title,
    description,
    icon: Icon = Ghost,
    iconColor = '#8b6b4a'
}: EmptyStateProps) => {
    return (
        <View className="items-center justify-center p-8 w-full opacity-80">
            <View className="mb-4 bg-black/10 p-4 rounded-full border border-[#5a4025]">
                <Icon size={48} color={iconColor} strokeWidth={1.5} />
            </View>
            <Text className="text-[#a6814c] font-black text-lg uppercase tracking-widest text-center mb-2">
                {title}
            </Text>
            <Text className="text-[#8b6b4a] text-sm text-center font-medium max-w-[250px] leading-5">
                {description}
            </Text>
        </View>
    );
};
