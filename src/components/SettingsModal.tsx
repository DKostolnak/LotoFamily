import React, { useState } from 'react';
import { View, Text, Switch } from 'react-native';
import { ModalShell, Section, ListRow, WoodenButton } from '@/components/common';
import { useGameStore } from '@/lib/store';
import { Volume2, VolumeX, Zap, Info, Check, BookOpen, Bell, Shield, FileText, Megaphone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ENV, TEXT_STYLES, SPACING } from '@/lib/config';
import { translations, type Language } from '@/lib/i18n';
import { notificationsService } from '@/lib/services/notifications';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { TermsModal } from './TermsModal';

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
        notificationsEnabled, setNotificationsEnabled,
        announcerMode, setAnnouncerMode,
    } = useGameStore();

    const t = translations[language];

    const [privacyVisible, setPrivacyVisible] = useState(false);
    const [termsVisible, setTermsVisible] = useState(false);

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

    const handleToggleNotifications = async (value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setNotificationsEnabled(value);
        if (value) {
            // Re-init in case user previously denied — request permission again
            // and surface OS prompt if not yet granted.
            await notificationsService.init();
        } else {
            // Cancel everything currently scheduled so the user is no longer nagged.
            await notificationsService.cancelAll();
        }
    };

    const handleToggleAnnouncer = (value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAnnouncerMode(value ? 'nicknames' : 'numbers');
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
        <>
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
                <ListRow
                    icon={<Megaphone size={20} color={announcerMode === 'nicknames' ? '#ffd700' : '#d4b896'} />}
                    title={(t as any).announcerMode ?? 'Folk Nicknames'}
                    subtitle={(t as any).announcerModeDesc ?? 'Add traditional folk callouts'}
                    right={
                        <Switch
                            value={announcerMode === 'nicknames'}
                            onValueChange={handleToggleAnnouncer}
                            trackColor={{ false: '#3d2814', true: '#d4b075' }}
                            thumbColor={announcerMode === 'nicknames' ? '#ffd700' : '#8b7355'}
                        />
                    }
                />
            </Section>

            <Section title={(t as any).notificationsLabel ?? 'Notifications'}>
                <ListRow
                    icon={<Bell size={20} color={notificationsEnabled ? '#ffd700' : '#d4b896'} />}
                    title={(t as any).notificationsLabel ?? 'Notifications'}
                    subtitle={(t as any).notificationsDesc ?? 'Daily bonus reminders, friend invites'}
                    right={
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={handleToggleNotifications}
                            trackColor={{ false: '#3d2814', true: '#d4b075' }}
                            thumbColor={notificationsEnabled ? '#ffd700' : '#8b7355'}
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

            <Section title={t.legalSection}>
                <ListRow
                    icon={<Shield size={20} color="#ffd700" />}
                    title={t.privacyPolicy}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPrivacyVisible(true);
                    }}
                />
                <ListRow
                    icon={<FileText size={20} color="#ffd700" />}
                    title={t.termsOfService}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setTermsVisible(true);
                    }}
                />
            </Section>
        </ModalShell>

        <PrivacyPolicyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
        <TermsModal visible={termsVisible} onClose={() => setTermsVisible(false)} />
        </>
    );
};
