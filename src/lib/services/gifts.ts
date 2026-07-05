import { ANALYTICS_EVENTS, analytics } from './analytics';
import { supabase } from './supabase';

export type GiftAmount = 50 | 100 | 500;

interface GiftResult {
    success: boolean;
    newBalance?: number;
    error?: string;
}

const transferCoins = supabase.rpc as unknown as (
    fn: 'transfer_coins',
    args: { recipient: string; amount: number }
) => Promise<{ data: number | null; error: { message: string } | null }>;

export async function sendGift(recipientId: string, amount: GiftAmount): Promise<GiftResult> {
    try {
        const { data, error } = await transferCoins('transfer_coins', {
            recipient: recipientId,
            amount,
        });

        if (error) {
            analytics.logEvent(ANALYTICS_EVENTS.GIFT_FAILED, {
                amount,
                recipient_id: recipientId,
                error: error.message,
            });
            return { success: false, error: error.message };
        }

        analytics.logEvent(ANALYTICS_EVENTS.GIFT_SENT, {
            amount,
            recipient_id: recipientId,
        });
        return { success: true, newBalance: data ?? undefined };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        analytics.logEvent(ANALYTICS_EVENTS.GIFT_FAILED, {
            amount,
            recipient_id: recipientId,
            error: message,
        });
        return { success: false, error: message };
    }
}
