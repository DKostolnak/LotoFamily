/**
 * Supabase Database Types
 *
 * Toto sú TypeScript typy ktoré odpovedajú tvojim Supabase tabuľkám.
 *
 * V produkcii ich generuješ automaticky pomocou CLI:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/services/supabase.types.ts
 *
 * Tým dostaneš 100% presné typy pre každú tabuľku, stĺpec a funkciu.
 * Zatiaľ ich definujeme manuálne podľa nášho schema.sql.
 */

// ============================================================================
// PROFIL — persistentné dáta hráča
// ============================================================================

export interface ProfileRow {
    /** UUID z Supabase Auth — primárny kľúč */
    id: string;
    /** Zobrazovaný nick hráča */
    nickname: string;
    /** Emoji alebo URL avatara */
    avatar: string;
    /** Aktuálny počet Loto coinov */
    coins: number;
    /** Pole ID zakúpených/odomknutých itemov */
    inventory: string[];
    /** ID aktívnej tématiky (theme) */
    active_theme: string;
    /** ID aktívneho skinu markera */
    active_skin: string;
    /** XP body */
    xp: number;
    /** Celkový počet odohraných hier */
    games_played: number;
    /** Celkový počet vyhraných hier */
    games_won: number;
    /** Tier reťazec (bronze/silver/gold/...) */
    tier: string;
    /** Čas posledného denného bonusu (ISO string) */
    last_bonus_claimed_at: string | null;
    /** Kedy bol profil vytvorený */
    created_at: string;
    /** Kedy bol profil naposledy aktualizovaný */
    updated_at: string;
}

/**
 * Dáta pre vytvorenie nového profilu.
 * Polia s DB defaultmi (coins, inventory, tier...) sú optional.
 */
export interface ProfileInsert {
    id: string;
    nickname: string;
    avatar: string;
    coins?: number;
    inventory?: string[];
    active_theme?: string;
    active_skin?: string;
    xp?: number;
    games_played?: number;
    games_won?: number;
    tier?: string;
    last_bonus_claimed_at?: string | null;
}

/** Dáta pre aktualizáciu profilu — všetko optional okrem id */
export type ProfileUpdate = Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>>;

// ============================================================================
// GAME ROOM — stav hernej miestnosti
// ============================================================================

export interface GameRoomRow {
    /** Unikátne UUID miestnosti */
    id: string;
    /** Krátky kód na zdieľanie (napr. "ABC123") */
    room_code: string;
    /** UUID hostiteľa miestnosti */
    host_id: string;
    /** Aktuálna fáza hry */
    phase: 'lobby' | 'playing' | 'paused' | 'finished';
    /** JSON konfigurácia hry (GameSettings) */
    settings: Record<string, unknown>;
    /** JSON pole hráčov */
    players: Record<string, unknown>[];
    /** Čísla ktoré už boli zavolané */
    called_numbers: number[];
    /** Posledné zavolané číslo */
    current_number: number | null;
    /** UUID víťaza (null kým hra neskončí) */
    winner_id: string | null;
    /** Flat winners JSON */
    flat_winners: { flat1: string | null; flat2: string | null };
    /** Kedy bola miestnosť vytvorená */
    created_at: string;
    /** Kedy sa hra začala */
    started_at: string | null;
}

// ============================================================================
// REPORTS — user-generated content moderation
// ============================================================================

export type ReportReason = 'name' | 'avatar' | 'chat' | 'cheating' | 'other';

export interface ReportRow {
    id: string;
    reporter_id: string;
    reported_user_id: string;
    room_code: string | null;
    reason: ReportReason;
    message: string | null;
    created_at: string;
}

export interface ReportInsert {
    reporter_id: string;
    reported_user_id: string;
    room_code?: string | null;
    reason: ReportReason;
    message?: string | null;
}

// ============================================================================
// DATABASE — hlavný typ pre createClient<Database>()
// ============================================================================

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: ProfileRow;
                Insert: ProfileInsert;
                Update: ProfileUpdate;
            };
            game_rooms: {
                Row: GameRoomRow;
                Insert: Omit<GameRoomRow, 'id' | 'created_at'>;
                Update: Partial<Omit<GameRoomRow, 'id' | 'created_at'>>;
            };
            reports: {
                Row: ReportRow;
                Insert: ReportInsert;
                Update: never;
            };
        };
        Views: {
            leaderboard_view: {
                Row: {
                    id: string;
                    nickname: string;
                    avatar: string;
                    coins: number;
                    games_won: number;
                    tier: string;
                    rank: number;
                };
            };
        };
        Functions: {
            purchase_item: {
                Args: { p_user_id: string; p_item_id: string; p_price: number };
                Returns: ProfileRow[];
            };
        };
        Enums: Record<string, never>;
    };
}
