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
// PUBLIC PROFILE — safe profile projection for leaderboard/friends
// ============================================================================

export interface PublicProfileRow {
    id: string;
    nickname: string;
    avatar: string;
    coins: number;
    games_won: number;
    tier: string;
    updated_at: string;
}

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
    /** Whether the room is discoverable in public room lists */
    is_public: boolean;
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
// FRIENDSHIPS — social graph
// ============================================================================

export interface FriendshipRow {
    id: string;
    requester_id: string;
    addressee_id: string;
    status: 'pending' | 'accepted';
    created_at: string;
}

export interface FriendshipInsert {
    requester_id: string;
    addressee_id: string;
    status?: 'pending' | 'accepted';
}

export type FriendshipUpdate = Partial<Pick<FriendshipRow, 'status'>>;

// ============================================================================
// SEASON PROGRESS — persisted Battle Pass state
// ============================================================================

export interface SeasonProgressRow {
    user_id: string;
    season_id: string;
    season_xp: number;
    season_level: number;
    has_premium: boolean;
    claimed_free: number[];
    claimed_premium: number[];
    created_at: string;
    updated_at: string;
}

export type SeasonProgressInsert = Omit<SeasonProgressRow, 'created_at' | 'updated_at'>;
export type SeasonProgressUpdate = Partial<Omit<SeasonProgressRow, 'user_id' | 'season_id' | 'created_at' | 'updated_at'>>;

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
            public_profiles: {
                Row: PublicProfileRow;
                Insert: never;
                Update: never;
            };
            game_rooms: {
                Row: GameRoomRow;
                Insert: Omit<GameRoomRow, 'id' | 'created_at'>;
                Update: Partial<Omit<GameRoomRow, 'id' | 'created_at'>>;
            };
            friendships: {
                Row: FriendshipRow;
                Insert: FriendshipInsert;
                Update: FriendshipUpdate;
            };
            season_progress: {
                Row: SeasonProgressRow;
                Insert: SeasonProgressInsert;
                Update: SeasonProgressUpdate;
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
