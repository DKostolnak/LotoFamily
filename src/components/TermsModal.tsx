/**
 * TermsModal — in-app terms of service.
 *
 * Required for App Store / Google Play submission. Mirrors the
 * TERMS_OF_SERVICE_URL content so the user can read terms inside the app.
 */

import React from 'react';
import { Text } from 'react-native';
import { ModalShell, Section } from '@/components/common';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { TEXT_STYLES } from '@/lib/config';

interface TermsModalProps {
    visible: boolean;
    onClose: () => void;
}

const BODY_COLOR = '#f5e6c8';

export function TermsModal({ visible, onClose }: TermsModalProps) {
    const { language } = useGameStore();
    const t = translations[language];

    return (
        <ModalShell visible={visible} onClose={onClose} title={t.termsTitle}>
            <Section title={t.termsUseTitle}>
                <Text style={[TEXT_STYLES.body, { color: BODY_COLOR }]}>
                    {t.termsUseBody}
                </Text>
            </Section>
            <Section title={t.termsPaymentsTitle}>
                <Text style={[TEXT_STYLES.body, { color: BODY_COLOR }]}>
                    {t.termsPaymentsBody}
                </Text>
            </Section>
            <Section title={t.termsConductTitle}>
                <Text style={[TEXT_STYLES.body, { color: BODY_COLOR }]}>
                    {t.termsConductBody}
                </Text>
            </Section>
            <Section title={t.termsAccountTitle}>
                <Text style={[TEXT_STYLES.body, { color: BODY_COLOR }]}>
                    {t.termsAccountBody}
                </Text>
            </Section>
            <Section title={t.termsLiabilityTitle}>
                <Text style={[TEXT_STYLES.body, { color: BODY_COLOR }]}>
                    {t.termsLiabilityBody}
                </Text>
            </Section>
            <Section title={t.termsChangesTitle}>
                <Text style={[TEXT_STYLES.body, { color: BODY_COLOR }]}>
                    {t.termsChangesBody}
                </Text>
            </Section>
        </ModalShell>
    );
}

export default TermsModal;
