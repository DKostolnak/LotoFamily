import { sendFriendRequest, fetchFriends } from '../friends';
import { getSession, supabase } from '../supabase';

jest.mock('../supabase', () => ({
    getSession: jest.fn(),
    supabase: {
        from: jest.fn(),
    },
}));

const getSessionMock = getSession as jest.Mock;
const fromMock = supabase.from as jest.Mock;

describe('friends service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSessionMock.mockResolvedValue({
            data: { session: { user: { id: 'user-1' } } },
            error: null,
        });
    });

    it('sends a friend request for the current session user', async () => {
        const insert = jest.fn().mockResolvedValue({ error: null });
        fromMock.mockReturnValue({ insert });

        const result = await sendFriendRequest('user-2');

        expect(result).toEqual({ success: true });
        expect(fromMock).toHaveBeenCalledWith('friendships');
        expect(insert).toHaveBeenCalledWith({
            requester_id: 'user-1',
            addressee_id: 'user-2',
        });
    });

    it('returns an RLS error without throwing', async () => {
        const insert = jest.fn().mockResolvedValue({
            error: { message: 'new row violates row-level security policy' },
        });
        fromMock.mockReturnValue({ insert });

        await expect(sendFriendRequest('user-2')).resolves.toEqual({
            success: false,
            error: 'new row violates row-level security policy',
        });
    });

    it('normalizes accepted friendships with profile data', async () => {
        const friendshipsEq = jest.fn().mockResolvedValue({
            data: [
                {
                    id: 'friendship-1',
                    requester_id: 'user-1',
                    addressee_id: 'user-2',
                    status: 'accepted',
                    created_at: '2026-07-05T10:00:00Z',
                },
            ],
            error: null,
        });
        const friendshipsOr = jest.fn().mockReturnValue({ eq: friendshipsEq });
        const friendshipsSelect = jest.fn().mockReturnValue({ or: friendshipsOr });
        const profilesIn = jest.fn().mockResolvedValue({
            data: [{ id: 'user-2', nickname: 'Mila', avatar: '🎲' }],
            error: null,
        });
        const profilesSelect = jest.fn().mockReturnValue({ in: profilesIn });

        fromMock.mockImplementation((table: string) => {
            if (table === 'friendships') {
                return { select: friendshipsSelect };
            }
            return { select: profilesSelect };
        });

        const result = await fetchFriends();

        expect(result).toEqual({
            success: true,
            data: [
                {
                    id: 'friendship-1',
                    requesterId: 'user-1',
                    addresseeId: 'user-2',
                    status: 'accepted',
                    createdAt: '2026-07-05T10:00:00Z',
                    friend: {
                        id: 'user-2',
                        nickname: 'Mila',
                        avatar: '🎲',
                    },
                },
            ],
        });
        expect(friendshipsOr).toHaveBeenCalledWith('requester_id.eq.user-1,addressee_id.eq.user-1');
        expect(friendshipsEq).toHaveBeenCalledWith('status', 'accepted');
        expect(profilesIn).toHaveBeenCalledWith('id', ['user-2']);
    });
});
