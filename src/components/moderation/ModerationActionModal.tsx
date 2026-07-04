import React from 'react';
import { View } from 'react-native';
import { ModalShell, WoodenButton } from '@/components/common';
import { useToast } from '@/components/ToastProvider';
import { useGameStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { SPACING } from '@/lib/config';
import { reportPlayer, type ReportReason } from '@/lib/services/moderation';

type UiReportReason = Extract<ReportReason, 'name' | 'avatar' | 'chat' | 'other'>;

interface ModerationActionModalProps {
    visible: boolean;
    targetUserId: string | null;
    targetName?: string;
    roomCode?: string | null;
    message?: string | null;
    onClose: () => void;
}

const REPORT_REASONS: UiReportReason[] = ['name', 'avatar', 'chat', 'other'];

export function ModerationActionModal({
    visible,
    targetUserId,
    targetName,
    roomCode,
    message,
    onClose,
}: ModerationActionModalProps) {
    const language = useGameStore((state) => state.language);
    const blockUser = useGameStore((state) => state.blockUser);
    const t = translations[language];
    const { showToast } = useToast();

    const reasonLabel: Record<UiReportReason, string> = {
        name: t.reportReasonName,
        avatar: t.reportReasonAvatar,
        chat: t.reportReasonChat,
        other: t.reportReasonOther,
    };

    const handleReport = async (reason: UiReportReason) => {
        if (!targetUserId) return;

        await reportPlayer({
            reportedUserId: targetUserId,
            roomCode,
            reason,
            message,
        });
        showToast(t.reportThanks, 'success');
        onClose();
    };

    const handleBlock = () => {
        if (!targetUserId) return;
        blockUser(targetUserId);
        onClose();
    };

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={t.reportPlayer}
            subtitle={targetName}
            closeAccessibilityLabel={t.close}
            maxWidth={420}
        >
            <View style={{ gap: SPACING.sm }}>
                {REPORT_REASONS.map((reason) => (
                    <WoodenButton
                        key={reason}
                        size="md"
                        variant="secondary"
                        fullWidth
                        onPress={() => handleReport(reason)}
                        accessibilityLabel={reasonLabel[reason]}
                    >
                        {reasonLabel[reason]}
                    </WoodenButton>
                ))}
            </View>

            <WoodenButton
                size="md"
                variant="danger"
                fullWidth
                onPress={handleBlock}
                accessibilityLabel={t.blockPlayer}
            >
                {t.blockPlayer}
            </WoodenButton>
        </ModalShell>
    );
}

export default ModerationActionModal;
