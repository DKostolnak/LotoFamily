import { ANALYTICS_EVENTS, analytics } from './analytics';
import { getSession, supabase } from './supabase';
import type { ReportInsert, ReportReason } from './supabase.types';

export type { ReportReason };

interface ReportPlayerInput {
    reportedUserId: string;
    roomCode?: string | null;
    reason: ReportReason;
    message?: string | null;
}

interface ModerationResult {
    success: boolean;
    error?: string;
}

const reportsTable = () => supabase.from('reports') as unknown as {
    insert: (values: ReportInsert) => Promise<{ error: { message: string } | null }>;
};

export async function reportPlayer({
    reportedUserId,
    roomCode,
    reason,
    message,
}: ReportPlayerInput): Promise<ModerationResult> {
    try {
        const { data } = await getSession();
        const reporterId = data.session?.user.id;

        if (!reporterId) {
            analytics.logEvent(ANALYTICS_EVENTS.PLAYER_REPORTED, {
                reason,
                has_message: Boolean(message),
                room_code: roomCode ?? null,
                success: false,
            });
            return { success: false, error: 'No active session' };
        }

        const { error } = await reportsTable().insert({
            reporter_id: reporterId,
            reported_user_id: reportedUserId,
            room_code: roomCode ?? null,
            reason,
            message: message ?? null,
        });

        analytics.logEvent(ANALYTICS_EVENTS.PLAYER_REPORTED, {
            reason,
            has_message: Boolean(message),
            room_code: roomCode ?? null,
            success: !error,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        analytics.logEvent(ANALYTICS_EVENTS.PLAYER_REPORTED, {
            reason,
            has_message: Boolean(message),
            room_code: roomCode ?? null,
            success: false,
        });

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
