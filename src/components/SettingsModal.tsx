import React from 'react';
import { View, Text, Switch } from 'react-native';
import { ModalShell, Section, ListRow, WoodenButton } from '@/components/common';
import { useGameStore } from '@/lib/store';
import { Volume2, VolumeX, Zap, Info, Check, BookOpen } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ENV, TEXT_STYLES, SPACING } from '@/lib/config';
import { translations, type Language } from '@/lib/i18n';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'uk', label: 'Українська', flag: '🇺🇦' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export const SettingsModal = ({ visible, onClose }: SettingsModalProps) => {
    const {
        isMuted, setMuted,
        language, setLanguage,
        batterySaver, setBatterySaver,
        tutorialCompleted, setTutorialCompleted,
    } = useGameStore();

    const t = translations[language];

    const handleToggleMute = (value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setMuted(!value);
    };

    const handleLanguageChange = (lang: Language) => {
        if (lang === language) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLanguage(lang);
    };

    const handleBatterySaverChange = (value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setBatterySaver(value);
    };

    const handleResetTutorial = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTutorialCompleted(false);
        onClose();
    };

    const footer = (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: 0.7,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <Info size={14} color="#d4b896" />
                <Text style={[TEXT_STYLES.caption, { color: '#d4b896' }]}>
                    v{ENV.app.version} ({ENV.app.buildNumber}){ENV.isDevelopment ? ' DEV' : ''}
                </Text>
            </View>
            <Text style={[TEXT_STYLES.caption, { color: '#d4b896' }]}>© 2026 LOTO</Text>
        </View>
    );

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={t.settings}
            footer={footer}
        >
            <Section title={(t as any).audioSection ?? t.settings}>
                <ListRow
                    icon={
                        isMuted ? (
                            <VolumeX size={20} color="#d4b896" />
                        ) : (
                            <Volume2 size={20} color="#ffd700" />
                        )
                    }
                    title={t.audioSound}
                    subtitle={t.audioDesc}
                    right={
                        <Switch
                            value={!isMuted}
                            onValueChange={handleToggleMute}
                            trackColor={{ false: '#3d2814', true: '#d4b075' }}
                            thumbColor={!isMuted ? '#ffd700' : '#8b7355'}
                        />
                    }
                />
                <ListRow
                    icon={<Zap size={20} color="#ffd700" />}
                    title={t.batterySaver}
                    subtitle={t.batterySaverDesc}
                    right={
                        <Switch
                            value={batterySaver}
                            onValueChange={handleBatterySaverChange}
                            trackColor={{ false: '#3d2814', true: '#d4b075' }}
                            thumbColor={batterySaver ? '#ffd700' : '#8b7355'}
                        />
                    }
                />
            </Section>

            <Section title={t.howToPlay}>
                <ListRow
                    icon={<BookOpen size={20} color="#ffd700" />}
                    title={t.resetTutorial}
                    subtitle={t.resetTutorialDesc}
                    right={
                        <WoodenButton
                            size="sm"
                            variant={tutorialCompleted ? 'gold' : 'secondary'}
                            onPress={handleResetTutorial}
                            disabled={!tutorialCompleted}
                            accessibilityLabel={t.resetTutorial}
                        >
                            {t.reset}
                        </WoodenButton>
                    }
                />
            </Section>

            <Section title={t.languageLabel}>
                {LANGUAGES.map(({ code, label, flag }) => {
                    const isActive = language === code;
                    return (
                        <ListRow
                            key={code}
                            icon={<Text style={{ fontSize: 22 }}>{flag}</Text>}
                            title={label}
                            selected={isActive}
                            onPress={() => handleLanguageChange(code)}
                            right={
                                isActive ? (
                                    <Check size={20} color="#ffd700" strokeWidth={3} />
                                ) : null
                            }
                        />
                    );
                })}
            </Section>
        </ModalShell>
    );
};
