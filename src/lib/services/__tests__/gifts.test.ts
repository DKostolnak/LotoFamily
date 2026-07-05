jest.mock('../supabase', () => ({
    supabase: {
        rpc: jest.fn(),
    },
}));

jest.mock('../analytics', () => ({
    ANALYTICS_EVENTS: {
        GIFT_SENT: 'gift_sent',
        GIFT_FAILED: 'gift_failed',
    },
    analytics: {
        logEvent: jest.fn(),
    },
}));

// eslint-disable-next-line import/first
import { analytics } from '../analytics';
// eslint-disable-next-line import/first
import { supabase } from '../supabase';
// eslint-disable-next-line import/first
import { sendGift } from '../gifts';

const rpcMock = supabase.rpc as jest.Mock;
const logEventMock = analytics.logEvent as jest.Mock;

describe('sendGift', () => {
    beforeEach(() => {
        rpcMock.mockReset();
        logEventMock.mockReset();
    });

    it('calls transfer_coins and returns the new sender balance on success', async () => {
        rpcMock.mockResolvedValue({ data: 950, error: null });

        await expect(sendGift('recipient-1', 50)).resolves.toEqual({
            success: true,
            newBalance: 950,
        });

        expect(rpcMock).toHaveBeenCalledWith('transfer_coins', {
            recipient: 'recipient-1',
            amount: 50,
        });
        expect(logEventMock).toHaveBeenCalledWith('gift_sent', {
            amount: 50,
            recipient_id: 'recipient-1',
        });
    });

    it('returns an insufficient funds error without throwing', async () => {
        rpcMock.mockResolvedValue({
            data: null,
            error: { message: 'insufficient_funds' },
        });

        await expect(sendGift('recipient-1', 500)).resolves.toEqual({
            success: false,
            error: 'insufficient_funds',
        });
        expect(logEventMock).toHaveBeenCalledWith('gift_failed', {
            amount: 500,
            recipient_id: 'recipient-1',
            error: 'insufficient_funds',
        });
    });

    it('returns a rate limit error without throwing', async () => {
        rpcMock.mockResolvedValue({
            data: null,
            error: { message: 'gift_limit_reached' },
        });

        await expect(sendGift('recipient-1', 100)).resolves.toEqual({
            success: false,
            error: 'gift_limit_reached',
        });
        expect(logEventMock).toHaveBeenCalledWith('gift_failed', {
            amount: 100,
            recipient_id: 'recipient-1',
            error: 'gift_limit_reached',
        });
    });
});
