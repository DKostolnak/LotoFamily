import React from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { WoodenCard, AnimatedModal } from '@/components/common';
import { useGameStore } from '@/lib/store';
import { Volume2, VolumeX, Globe, Zap, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ENV } from '@/lib/config';
import { translations, type Language } from '@/lib/translations';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'sk', label: 'SK', flag: '🇸🇰' },
    { code: 'uk', label: 'UK', flag: '🇺🇦' },
    { code: 'ru', label: 'RU', flag: '🇷🇺' },
];

export const SettingsModal = ({ visible, onClose }: SettingsModalProps) => {
    const {
        isMuted, setMuted,
        language, setLanguage,
        batterySaver, setBatterySaver
    } = useGameStore();

    const t = translations[language];

    const handleToggleMute = (value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setMuted(value);
    };

    const handleLanguageChange = (lang: Language) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLanguage(lang);
    };

    const handleBatterySaverChange = (value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setBatterySaver(value);
    };

    const SettingRow = ({ label, children, icon: Icon, description }: any) => (
        <View className="mb-6">
            <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center gap-2">
                    {Icon && <Icon size={20} color="#d4b075" />}
                    <Text className="text-[#f5e6c8] font-bold text-lg">{label}</Text>
                </View>
                {children}
            </View>
            {description && (
                <Text className="text-[#a6814c] text-xs ml-7">{description}</Text>
            )}
        </View>
    );

    return (
        <AnimatedModal visible={visible} onClose={onClose} animation="scale">
            <WoodenCard
                title={t.settings?.toUpperCase() || 'SETTINGS'}
                className="w-full"
                onClose={onClose}
            >
                <ScrollView className="mt-2" showsVerticalScrollIndicator={false}>

                    {/* Audio Setting */}
                    <SettingRow
                        label={t.audioSound}
                        icon={isMuted ? VolumeX : Volume2}
                        description={t.audioDesc}
                    >
                        <Switch
                            value={!isMuted}
                            onValueChange={(v) => handleToggleMute(!v)}
                            trackColor={{ false: '#3d2814', true: '#d4b075' }}
                            thumbColor={!isMuted ? '#ffd700' : '#8b7355'}
                        />
                    </SettingRow>

                    {/* Language Selection */}
                    <SettingRow
                        label={t.languageLabel}
                        icon={Globe}
                        description={t.languageDesc}
                    >
                        <View className="flex-row bg-black/40 rounded-lg p-1">
                            {LANGUAGES.map(({ code, label }) => (
                                <TouchableOpacity
                                    key={code}
                                    onPress={() => handleLanguageChange(code)}
                                    className={`px-3 py-1 rounded ${language === code ? 'bg-[#d4b075]' : ''}`}
                                >
                                    <Text className={`font-bold ${language === code ? 'text-[#3d2814]' : 'text-[#f5e6c8]'}`}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </SettingRow>

                    {/* Battery Saver */}
                    <SettingRow
                        label={t.batterySaver}
                        icon={Zap}
                        description={t.batterySaverDesc}
                    >
                        <Switch
                            value={batterySaver}
                            onValueChange={handleBatterySaverChange}
                            trackColor={{ false: '#3d2814', true: '#d4b075' }}
                            thumbColor={batterySaver ? '#ffd700' : '#8b7355'}
                        />
                    </SettingRow>

                    {/* Version Info */}
                    <View className="mt-4 pt-4 border-t border-[#d4b075]/20 flex-row items-center justify-between opacity-60">
                        <View className="flex-row items-center gap-2">
                            <Info size={14} color="#f5e6c8" />
                            <Text className="text-[#f5e6c8] text-xs">
                                v{ENV.app.version} ({ENV.app.buildNumber}){ENV.isDevelopment ? ' DEV' : ''}
                            </Text>
                        </View>
                        <Text className="text-[#f5e6c8] text-xs">© 2026 LOTO</Text>
                    </View>

                    <View className="h-4" />
                </ScrollView>
            </WoodenCard>
        </AnimatedModal>
    );
};
