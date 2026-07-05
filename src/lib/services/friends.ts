import { getSession, supabase } from './supabase';

type ServiceResult<T = undefined> = T extends undefined
    ? { success: true } | { success: false; error: string }
    : { success: true; data: T } | { success: false; error: string };

export type FriendshipStatus = 'pending' | 'accepted';

export interface FriendProfile {
    id: string;
    nickname: string;
    avatar: string;
}

interface FriendshipRow {
    id: string;
    requester_id: string;
    addressee_id: string;
    status: FriendshipStatus;
    created_at: string;
}

interface ProfileSummaryRow {
    id: string;
    nickname: string;
    avatar: string;
}

export interface FriendRecord {
    id: string;
    requesterId: string;
    addresseeId: string;
    status: FriendshipStatus;
    createdAt: string;
    friend: FriendProfile;
}

export interface PendingFriendRequest {
    id: string;
    requesterId: string;
    addresseeId: string;
    status: 'pending';
    createdAt: string;
    requester: FriendProfile;
}

// Manual Supabase types are intentionally narrow in this repo. These helpers
// keep the service readable without leaking `any` through the public API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const friendshipsTable = () => supabase.from('friendships') as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const profilesTable = () => supabase.from('profiles') as any;

const errorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string') return message;
    }
    return 'unknown_error';
};

async function currentUserId(): Promise<string | null> {
    const { data } = await getSession();
    return data.session?.user?.id ?? null;
}

async function fetchProfiles(ids: string[]): Promise<Map<string, FriendProfile>> {
    if (ids.length === 0) return new Map();

    const { data, error } = await profilesTable()
        .select('id,nickname,avatar')
        .in('id', ids);

    if (error) throw new Error(errorMessage(error));

    const rows = (data ?? []) as ProfileSummaryRow[];
    return new Map(
        rows.map((profile) => [
            profile.id,
            {
                id: profile.id,
                nickname: profile.nickname,
                avatar: profile.avatar,
            },
        ])
    );
}

export async function sendFriendRequest(userId: string): Promise<ServiceResult> {
    try {
        const requesterId = await currentUserId();
        if (!requesterId) return { success: false, error: 'no_session' };

        const { error } = await friendshipsTable().insert({
            requester_id: requesterId,
            addressee_id: userId,
        });

        if (error) return { success: false, error: errorMessage(error) };
        return { success: true };
    } catch (error) {
        return { success: false, error: errorMessage(error) };
    }
}

export async function acceptFriendRequest(id: string): Promise<ServiceResult> {
    try {
        const userId = await currentUserId();
        if (!userId) return { success: false, error: 'no_session' };

        const { error } = await friendshipsTable()
            .update({ status: 'accepted' })
            .eq('id', id);

        if (error) return { success: false, error: errorMessage(error) };
        return { success: true };
    } catch (error) {
        return { success: false, error: errorMessage(error) };
    }
}

export async function removeFriend(id: string): Promise<ServiceResult> {
    try {
        const userId = await currentUserId();
        if (!userId) return { success: false, error: 'no_session' };

        const { error } = await friendshipsTable()
            .delete()
            .eq('id', id);

        if (error) return { success: false, error: errorMessage(error) };
        return { success: true };
    } catch (error) {
        return { success: false, error: errorMessage(error) };
    }
}

export async function fetchFriends(): Promise<ServiceResult<FriendRecord[]>> {
    try {
        const userId = await currentUserId();
        if (!userId) return { success: false, error: 'no_session' };

        const { data, error } = await friendshipsTable()
            .select('id,requester_id,addressee_id,status,created_at')
            .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
            .eq('status', 'accepted');

        if (error) return { success: false, error: errorMessage(error) };

        const rows = (data ?? []) as FriendshipRow[];
        const friendIds = rows.map((row) =>
            row.requester_id === userId ? row.addressee_id : row.requester_id
        );
        const profiles = await fetchProfiles([...new Set(friendIds)]);

        return {
            success: true,
            data: rows.map((row) => {
                const friendId = row.requester_id === userId ? row.addressee_id : row.requester_id;
                return {
                    id: row.id,
                    requesterId: row.requester_id,
                    addresseeId: row.addressee_id,
                    status: row.status,
                    createdAt: row.created_at,
                    friend: profiles.get(friendId) ?? {
                        id: friendId,
                        nickname: friendId,
                        avatar: '🙂',
                    },
                };
            }),
        };
    } catch (error) {
        return { success: false, error: errorMessage(error) };
    }
}

export async function fetchSentFriendRequests(): Promise<ServiceResult<FriendRecord[]>> {
    try {
        const userId = await currentUserId();
        if (!userId) return { success: false, error: 'no_session' };

        const { data, error } = await friendshipsTable()
            .select('id,requester_id,addressee_id,status,created_at')
            .eq('requester_id', userId)
            .eq('status', 'pending');

        if (error) return { success: false, error: errorMessage(error) };

        const rows = (data ?? []) as FriendshipRow[];
        const profiles = await fetchProfiles([...new Set(rows.map((row) => row.addressee_id))]);

        return {
            success: true,
            data: rows.map((row) => ({
                id: row.id,
                requesterId: row.requester_id,
                addresseeId: row.addressee_id,
                status: 'pending',
                createdAt: row.created_at,
                friend: profiles.get(row.addressee_id) ?? {
                    id: row.addressee_id,
                    nickname: row.addressee_id,
                    avatar: '🙂',
                },
            })),
        };
    } catch (error) {
        return { success: false, error: errorMessage(error) };
    }
}

export async function fetchPendingRequests(): Promise<ServiceResult<PendingFriendRequest[]>> {
    try {
        const userId = await currentUserId();
        if (!userId) return { success: false, error: 'no_session' };

        const { data, error } = await friendshipsTable()
            .select('id,requester_id,addressee_id,status,created_at')
            .eq('addressee_id', userId)
            .eq('status', 'pending');

        if (error) return { success: false, error: errorMessage(error) };

        const rows = (data ?? []) as FriendshipRow[];
        const profiles = await fetchProfiles([...new Set(rows.map((row) => row.requester_id))]);

        return {
            success: true,
            data: rows.map((row) => ({
                id: row.id,
                requesterId: row.requester_id,
                addresseeId: row.addressee_id,
                status: 'pending',
                createdAt: row.created_at,
                requester: profiles.get(row.requester_id) ?? {
                    id: row.requester_id,
                    nickname: row.requester_id,
                    avatar: '🙂',
                },
            })),
        };
    } catch (error) {
        return { success: false, error: errorMessage(error) };
    }
}
