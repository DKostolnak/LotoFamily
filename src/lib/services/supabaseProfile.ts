/**
 * Supabase Profile Service
 *
 * Spravuje hráčsky profil v Supabase PostgreSQL.
 * Nahradí starý REST endpoint `${ENV.server.url}/profile`.
 *
 * Vzory ktoré sa tu naučíš:
 *   1. upsert() — vlož alebo aktualizuj v jednom volaní
 *   2. RLS (Row Level Security) — každý user vidí len svoje dáta
 *   3. .single() — vráti jeden objekt namiesto poľa
 *   4. select() s explicitnými stĺpcami — efektívnejšie ako SELECT *
 */

import { supabase, signInAnonymously, getSession } from './supabase';
import type { ProfileRow, ProfileInsert, ProfileUpdate } from './supabase.types';

// Type-safe skratka — pretypujeme cez any pretože manuálny Database typ
// nemá rovnakú štruktúru ako generovaný Supabase CLI typ
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const profileTable = () => supabase.from('profiles') as any;

// ============================================================================
// TYPY
// ============================================================================

/** Profil normalizovaný na frontend konvencie (camelCase) */
export interface NormalizedProfile {
    userId: string;
    nickname: string;
    avatar: string;
    coins: number;
    inventory: string[];
    activeTheme: string;
    activeSkin: string;
    xp: number;
    gamesPlayed: number;
    gamesWon: number;
    tier: string;
    lastBonusClaimedAt: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Konvertuje DB row (snake_case) na frontend objekt (camelCase) */
const normalizeProfile = (row: ProfileRow): NormalizedProfile => ({
    userId: row.id,
    nickname: row.nickname,
    avatar: row.avatar,
    coins: row.coins,
    inventory: row.inventory ?? [],
    activeTheme: row.active_theme,
    activeSkin: row.active_skin,
    xp: row.xp,
    gamesPlayed: row.games_played,
    gamesWon: row.games_won,
    tier: row.tier,
    lastBonusClaimedAt: row.last_bonus_claimed_at,
});

// ============================================================================
// AUTENTIFIKÁCIA
// ============================================================================

/**
 * Zaistí aktívnu Supabase session — anonymne ak neexistuje žiadna.
 *
 * Tok:
 *   1. Skontroluj AsyncStorage — ak session existuje, vráť jej userId
 *   2. Ak nie, zavolaj signInAnonymously() → Supabase vytvorí UUID usera
 *   3. Uloží token do AsyncStorage (automaticky cez Supabase klient)
 *
 * Výsledok: každý hráč má unique userId bez toho aby musel zadávať email.
 */
export async function ensureSession(): Promise<string> {
    const { data: { session } } = await getSession();

    if (session?.user?.id) {
        return session.user.id;
    }

    // Anonymné prihlásenie — žiadna registrácia, žiadny email
    const { data, error } = await signInAnonymously();
    if (error || !data.user) {
        throw new Error(`[SupabaseProfile] Auth failed: ${error?.message}`);
    }

    return data.user.id;
}

// ============================================================================
// CRUD OPERÁCIE
// ============================================================================

/**
 * Načíta profil hráča z Supabase.
 * Ak profil neexistuje, vráti null — zavolaj createProfile() potom.
 */
export async function fetchProfile(userId: string): Promise<NormalizedProfile | null> {
    const { data, error } = await profileTable()
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        // PGRST116 = "no rows returned" — profil ešte neexistuje
        if (error.code === 'PGRST116') return null;
        throw new Error(`[SupabaseProfile] Fetch failed: ${error.message}`);
    }

    return normalizeProfile(data);
}

/**
 * Vytvorí nový profil pre hráča (prvé spustenie).
 *
 * Supabase RLS politika zaistí, že user môže insertovať IBA
 * záznam kde id = auth.uid() (jeho vlastné UUID).
 */
export async function createProfile(
    userId: string,
    nickname: string,
    avatar: string
): Promise<NormalizedProfile> {
    const newProfile: ProfileInsert = {
        id: userId,
        nickname,
        avatar,
        coins: 500,           // Uvítací bonus
        inventory: [],
        active_theme: 'classic',
        active_skin: 'default',
        xp: 0,
        games_played: 0,
        games_won: 0,
        tier: 'bronze',
        last_bonus_claimed_at: null,
    };

    const { data, error } = await profileTable()
        .insert(newProfile)
        .select()
        .single();

    if (error) {
        throw new Error(`[SupabaseProfile] Create failed: ${error.message}`);
    }

    return normalizeProfile(data);
}

/**
 * Aktualizuje profil hráča.
 *
 * Príklad:
 *   await updateProfile(userId, { coins: 1200, active_theme: 'dark' });
 *
 * RLS zaistí, že user môže updatovať IBA svoj vlastný profil.
 */
export async function updateProfile(
    userId: string,
    updates: ProfileUpdate
): Promise<NormalizedProfile> {
    const { data, error } = await profileTable()
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        throw new Error(`[SupabaseProfile] Update failed: ${error.message}`);
    }

    return normalizeProfile(data);
}

/**
 * Upsert — vytvor ALEBO aktualizuj profil.
 * Bezpečné pre concurrent volania (race condition safe).
 *
 * onConflict: 'id' — ak záznam s týmto id existuje, updatuj ho.
 */
export async function upsertProfile(
    userId: string,
    profile: Partial<ProfileInsert> & { id: string }
): Promise<NormalizedProfile> {
    const { data, error } = await profileTable()
        .upsert(profile, { onConflict: 'id' })
        .select()
        .single();

    if (error) {
        throw new Error(`[SupabaseProfile] Upsert failed: ${error.message}`);
    }

    return normalizeProfile(data);
}

// ============================================================================
// INICIALIZÁCIA — hlavná funkcia volaná z appSlice
// ============================================================================

/**
 * Kompletná inicializácia profilu pri štarte app.
 *
 * Tok:
 *   1. ensureSession() → získaj userId (anonymne ak prvýkrát)
 *   2. fetchProfile(userId) → načítaj profil z DB
 *   3. Ak profil neexistuje → createProfile() s defaultmi
 *   4. Vráť profil na sync do Zustand store
 *
 * Nahradí: fetch(`${ENV.server.url}/profile`) v appSlice.ts
 */
export async function initializeProfile(
    defaultNickname: string,
    defaultAvatar: string
): Promise<{ userId: string; profile: NormalizedProfile }> {
    // 1. Session (anonymná pri prvom spustení)
    const userId = await ensureSession();

    // 2. Načítaj existujúci profil
    let profile = await fetchProfile(userId);

    // 3. Prvé spustenie — vytvor profil
    if (!profile) {
        profile = await createProfile(userId, defaultNickname, defaultAvatar);
        console.log('[SupabaseProfile] New player created:', userId);
    } else {
        console.log('[SupabaseProfile] Existing player loaded:', userId);
    }

    return { userId, profile };
}

// ============================================================================
// EKONOMIKA (coins, inventory)
// ============================================================================

/**
 * Atomicky odečíta coins a pridá item do inventory.
 * Používa Supabase RPC (PostgreSQL funkciu) pre atomic transakciu.
 *
 * TODO: implementuj `purchase_item` funkciu v Supabase Edge Function.
 * Zatiaľ robíme optimistic update priamo z klienta.
 */
export async function purchaseItemRemote(
    userId: string,
    itemId: string,
    price: number
): Promise<NormalizedProfile> {
    // Načítaj aktuálne coins
    const profile = await fetchProfile(userId);
    if (!profile) throw new Error('Profile not found');
    if (profile.coins < price) throw new Error('Insufficient coins');

    return updateProfile(userId, {
        coins: profile.coins - price,
        inventory: [...profile.inventory, itemId],
    });
}

/**
 * Synchronizuje lokálnu ekonomiku (Zustand) so Supabase po hre.
 */
export async function syncEconomy(
    userId: string,
    coins: number,
    xp: number,
    gamesPlayed: number,
    gamesWon: number
): Promise<void> {
    await updateProfile(userId, {
        coins,
        xp,
        games_played: gamesPlayed,
        games_won: gamesWon,
    });
}
