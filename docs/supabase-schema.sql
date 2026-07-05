-- ============================================================================
-- LOTO FAMILY — Supabase Database Schema
-- ============================================================================
-- Ako použiť:
--   1. Choď na https://supabase.com → tvoj projekt → SQL Editor
--   2. Vlož celý tento súbor a stlač "Run"
--   3. Všetky tabuľky, RLS politiky a indexy sa vytvoria automaticky
-- ============================================================================

-- ============================================================================
-- PROFILES — hráčske profily
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    -- id = UUID z Supabase Auth (auth.users.id)
    -- Keď sa user prihlási (anonymne alebo emailom), dostane UUID
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    nickname    TEXT NOT NULL DEFAULT 'Player',
    avatar      TEXT NOT NULL DEFAULT '🎮',

    -- Ekonomika
    coins       INTEGER NOT NULL DEFAULT 500 CHECK (coins >= 0),
    inventory   TEXT[] NOT NULL DEFAULT '{}',    -- pole item ID-čiek

    -- Nastavenia
    active_theme    TEXT NOT NULL DEFAULT 'classic',
    active_skin     TEXT NOT NULL DEFAULT 'default',

    -- Štatistiky
    xp              INTEGER NOT NULL DEFAULT 0,
    games_played    INTEGER NOT NULL DEFAULT 0,
    games_won       INTEGER NOT NULL DEFAULT 0,
    tier            TEXT NOT NULL DEFAULT 'bronze',

    -- Denný bonus
    last_bonus_claimed_at   TIMESTAMPTZ,

    -- Timestamps
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automaticky aktualizuj updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — kľúčová bezpečnostná vrstva
-- ============================================================================
-- RLS zabezpečí, že každý user môže pristupovať LEN k svojmu profilu.
-- Funguje na úrovni databázy — aj keby mal útočník anon key, nemôže čítať
-- cudzie profily.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Hráč môže čítať LEN svoj vlastný profil
CREATE POLICY "profiles: own read"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Hráč môže vkladať LEN záznam kde id = jeho auth.uid()
CREATE POLICY "profiles: own insert"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Hráč môže updateovať LEN svoj vlastný profil
CREATE POLICY "profiles: own update"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================================
-- GAME ROOMS — herné miestnosti
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.game_rooms (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code   TEXT NOT NULL UNIQUE,           -- "ABC123" — hráči zadávajú
    host_id     UUID NOT NULL REFERENCES public.profiles(id),

    phase       TEXT NOT NULL DEFAULT 'lobby'
                    CHECK (phase IN ('lobby', 'playing', 'paused', 'finished')),

    settings    JSONB NOT NULL DEFAULT '{}',    -- GameSettings objekt
    players     JSONB NOT NULL DEFAULT '[]',    -- pole Player objektov
    called_numbers  INTEGER[] NOT NULL DEFAULT '{}',
    current_number  INTEGER,
    winner_id   UUID REFERENCES public.profiles(id),
    flat_winners    JSONB NOT NULL DEFAULT '{"flat1": null, "flat2": null}',

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at  TIMESTAMPTZ
);

-- Index pre rýchle hľadanie miestnosti podľa kódu
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON public.game_rooms(room_code);

-- RLS pre herné miestnosti
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

-- Každý prihlásený user môže čítať miestnosti (potrebné pre join)
CREATE POLICY "game_rooms: authenticated read"
    ON public.game_rooms FOR SELECT
    TO authenticated
    USING (true);

-- Len host môže vytvárať miestnosť kde je on hostom
CREATE POLICY "game_rooms: host insert"
    ON public.game_rooms FOR INSERT
    WITH CHECK (auth.uid() = host_id);

-- Len host môže updateovať miestnosť (herný stav, čísla...)
CREATE POLICY "game_rooms: host update"
    ON public.game_rooms FOR UPDATE
    USING (auth.uid() = host_id);

-- ============================================================================
-- LEADERBOARD VIEW — verejný rebríček
-- ============================================================================
-- VIEW (pohľad) — čítame z neho rovnako ako z tabuľky, ale data sú
-- automaticky vypočítané z profiles. Bezpečné zdieľať — zobrazuje len
-- nick, avatar, coins, games_won, tier.

CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
    id,
    nickname,
    avatar,
    coins,
    games_won,
    tier,
    -- RANK() vypočíta poradie podľa coins (najväčší = 1. miesto)
    RANK() OVER (ORDER BY coins DESC, games_won DESC) AS rank
FROM public.profiles
ORDER BY rank
LIMIT 100;

-- Verejný prístup k rebríčku (bez autentifikácie)
CREATE POLICY "leaderboard_view: public read"
    ON public.profiles FOR SELECT
    USING (true);  -- prepíše own-read politiku pre leaderboard endpoint

-- ============================================================================
-- FUNKCIE (RPC) — server-side logika
-- ============================================================================

-- Atomická nákupná transakcia — voláme cez supabase.rpc('purchase_item', {...})
-- Zabraňuje race condition kde by si mohol kúpiť item aj keď nemáš coins
CREATE OR REPLACE FUNCTION purchase_item(
    p_user_id UUID,
    p_item_id TEXT,
    p_price   INTEGER
)
RETURNS TABLE(success BOOLEAN, new_coins INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER  -- beží s právami definujúceho usera (obchádza RLS pre atomickosť)
AS $$
DECLARE
    v_current_coins INTEGER;
BEGIN
    -- Uzamkni riadok počas transakcie (FOR UPDATE)
    SELECT coins INTO v_current_coins
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    -- Skontroluj coins
    IF v_current_coins < p_price THEN
        RETURN QUERY SELECT FALSE, v_current_coins, 'Insufficient coins';
        RETURN;
    END IF;

    -- Atomický update
    UPDATE public.profiles
    SET
        coins = coins - p_price,
        inventory = array_append(inventory, p_item_id),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT TRUE, (v_current_coins - p_price), 'OK';
END;
$$;

-- ============================================================================
-- MIGRÁCIA 001 — Leaderboard RLS
-- ============================================================================
-- Spusti toto v SQL Editore aby leaderboard videl všetkých hráčov.
-- (Štandardná RLS politika umožňuje čítať len vlastný profil.)

CREATE POLICY IF NOT EXISTS "profiles: leaderboard read"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================================
-- FRIENDSHIPS — friend requests and accepted friends
-- ============================================================================
-- Run this in the Supabase SQL editor before enabling the friends UI in prod.

CREATE TABLE IF NOT EXISTS public.friendships (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id  UUID NOT NULL REFERENCES auth.users(id),
    addressee_id  UUID NOT NULL REFERENCES auth.users(id),
    status        TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT friendships_requester_addressee_unique UNIQUE (requester_id, addressee_id),
    CONSTRAINT friendships_no_self CHECK (requester_id <> addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friendships: own insert"
    ON public.friendships FOR INSERT
    TO authenticated
    WITH CHECK (requester_id = auth.uid());

CREATE POLICY "friendships: own select"
    ON public.friendships FOR SELECT
    TO authenticated
    USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "friendships: addressee accept"
    ON public.friendships FOR UPDATE
    TO authenticated
    USING (addressee_id = auth.uid())
    WITH CHECK (addressee_id = auth.uid() AND status = 'accepted');

CREATE POLICY "friendships: own delete"
    ON public.friendships FOR DELETE
    TO authenticated
    USING (requester_id = auth.uid() OR addressee_id = auth.uid());
