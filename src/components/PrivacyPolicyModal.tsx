/**
 * PrivacyPolicyModal — in-app privacy policy.
 *
 * Required for App Store / Google Play submission. Surfaces the same
 * privacy disclosures the user can see at PRIVACY_POLICY_URL, but rendered
 * natively so the policy is reachable even offline.
 */

import React from 'react';
import { Text } from 'react-native';
import { ModalShell, Section } from '@/components/common';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { TEXT_STYLES } from '@/lib/config';

interface PrivacyPolicyModalProps {
    visible: boolean;
    onClose: () => void;
}

const BODY_COLOR = '#f5e6c8';

export function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
    const { language } = useGameStore();
    const t = translations[language];

    return (
        <ModalShell visible={visible} onClose={onClose} title={t.privacyPolicyTitle}>
            <Section title={t.privacyDataCollected}>
                <Text style={[TEXT_STYLES.body, { color: BODY_COLOR }]}>
                    {t.privacyDataCollectedBody}
                </Text>
            </Section>
            <Section title={t.privacyDataUsage}>
                <Text style={[TEXT_STYLES.body, { color: BODY_COLOR }]}>
                    {t.privacyDataUsageBody}
                </Text>
            </Section>
            <Section title={t.privacyThirdParty}>
                <Text style={[TEXT_STYLES.body, { color: BODY_COLOR }]}>
                    {t.privacyThirdPartyBody}
                </Text>
            </Section>
            <Section title={t.privacyRights}>
                <Text style={[TEXT_STYLES.body, { color: BODY_COLOR }]}>
                    {t.privacyRightsBody}
                </Text>
            </Section>
            <Section title={t.privacyContact}>
                <Text style={[TEXT_STYLES.body, { color: BODY_COLOR }]}>
                    {t.privacyContactBody}
                </Text>
            </Section>
        </ModalShell>
    );
}

export default PrivacyPolicyModal;
