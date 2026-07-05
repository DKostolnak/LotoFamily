-- ============================================================================
-- LOTO FAMILY - Supabase Database Schema
-- ============================================================================
-- Apply this to a fresh Supabase project SQL editor, or through the Supabase
-- MCP execute_sql tool. The schema is intentionally explicit about GRANTs
-- because new Supabase projects may not expose SQL-created tables to the Data
-- API automatically.
-- ============================================================================

begin;

create schema if not exists private;
revoke all on schema private from public;

grant usage on schema public to anon, authenticated, service_role;

-- ============================================================================
-- TABLES
-- ============================================================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nickname text not null default 'Player',
    avatar text not null default 'gamepad',
    coins integer not null default 500 check (coins >= 0),
    inventory text[] not null default '{}',
    active_theme text not null default 'classic',
    active_skin text not null default 'default',
    xp integer not null default 0 check (xp >= 0),
    games_played integer not null default 0 check (games_played >= 0),
    games_won integer not null default 0 check (games_won >= 0),
    tier text not null default 'bronze',
    last_bonus_claimed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.public_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nickname text not null,
    avatar text not null,
    coins integer not null default 0,
    games_won integer not null default 0,
    tier text not null default 'bronze',
    updated_at timestamptz not null default now()
);

create table if not exists public.game_rooms (
    id uuid primary key default gen_random_uuid(),
    room_code text not null unique,
    host_id uuid not null references public.profiles(id) on delete cascade,
    phase text not null default 'lobby'
        check (phase in ('lobby', 'playing', 'paused', 'finished')),
    is_public boolean not null default true,
    settings jsonb not null default '{}',
    players jsonb not null default '[]',
    called_numbers integer[] not null default '{}',
    current_number integer,
    winner_id uuid references public.profiles(id),
    flat_winners jsonb not null default '{"flat1": null, "flat2": null}',
    created_at timestamptz not null default now(),
    started_at timestamptz
);

create table if not exists public.friendships (
    id uuid primary key default gen_random_uuid(),
    requester_id uuid not null references public.profiles(id) on delete cascade,
    addressee_id uuid not null references public.profiles(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'accepted')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint friendships_requester_addressee_unique unique (requester_id, addressee_id),
    constraint friendships_no_self check (requester_id <> addressee_id)
);

create table if not exists public.coin_gifts (
    id uuid primary key default gen_random_uuid(),
    sender_id uuid not null references public.profiles(id) on delete cascade,
    recipient_id uuid not null references public.profiles(id) on delete cascade,
    amount integer not null check (amount in (50, 100, 500)),
    created_at timestamptz not null default now()
);

create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid not null references public.profiles(id) on delete cascade,
    reported_user_id uuid not null references public.profiles(id) on delete cascade,
    room_code text,
    reason text not null check (reason in ('name', 'avatar', 'chat', 'cheating', 'other')),
    message text,
    created_at timestamptz not null default now()
);

create table if not exists public.season_progress (
    user_id uuid not null references public.profiles(id) on delete cascade,
    season_id text not null,
    season_xp integer not null default 0 check (season_xp >= 0),
    season_level integer not null default 1 check (season_level >= 1),
    has_premium boolean not null default false,
    claimed_free integer[] not null default '{}',
    claimed_premium integer[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, season_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists idx_public_profiles_leaderboard
    on public.public_profiles (coins desc, games_won desc);

create index if not exists idx_game_rooms_public_lobby_created
    on public.game_rooms (is_public, phase, created_at desc);

create index if not exists idx_game_rooms_winner_id
    on public.game_rooms (winner_id);

create index if not exists idx_friendships_requester
    on public.friendships (requester_id, status);

create index if not exists idx_friendships_addressee
    on public.friendships (addressee_id, status);

create index if not exists idx_coin_gifts_sender_created
    on public.coin_gifts (sender_id, created_at desc);

create index if not exists idx_reports_created
    on public.reports (created_at desc);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function private.sync_public_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if tg_op = 'DELETE' then
        delete from public.public_profiles where id = old.id;
        return old;
    end if;

    insert into public.public_profiles (
        id,
        nickname,
        avatar,
        coins,
        games_won,
        tier,
        updated_at
    )
    values (
        new.id,
        new.nickname,
        new.avatar,
        new.coins,
        new.games_won,
        new.tier,
        now()
    )
    on conflict (id) do update set
        nickname = excluded.nickname,
        avatar = excluded.avatar,
        coins = excluded.coins,
        games_won = excluded.games_won,
        tier = excluded.tier,
        updated_at = now();

    return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
    before update on public.profiles
    for each row execute function private.set_updated_at();

drop trigger if exists friendships_updated_at on public.friendships;
create trigger friendships_updated_at
    before update on public.friendships
    for each row execute function private.set_updated_at();

drop trigger if exists season_progress_updated_at on public.season_progress;
create trigger season_progress_updated_at
    before update on public.season_progress
    for each row execute function private.set_updated_at();

drop trigger if exists profiles_sync_public_profile on public.profiles;
create trigger profiles_sync_public_profile
    after insert or update or delete on public.profiles
    for each row execute function private.sync_public_profile();

-- ============================================================================
-- VIEWS
-- ============================================================================

create or replace view public.leaderboard_view
with (security_invoker = true)
as
select
    id,
    nickname,
    avatar,
    coins,
    games_won,
    tier,
    rank() over (order by coins desc, games_won desc) as rank
from public.public_profiles
order by rank
limit 100;

-- ============================================================================
-- RPC
-- ============================================================================

create or replace function public.purchase_item(
    p_user_id uuid,
    p_item_id text,
    p_price integer
)
returns setof public.profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
    v_profile public.profiles%rowtype;
begin
    if (select auth.uid()) is null or (select auth.uid()) <> p_user_id then
        raise exception 'Not authorized to purchase for this user' using errcode = '42501';
    end if;

    if p_price <= 0 then
        raise exception 'Price must be positive' using errcode = '22023';
    end if;

    if p_item_id is null or btrim(p_item_id) = '' then
        raise exception 'Item id is required' using errcode = '22023';
    end if;

    select *
    into v_profile
    from public.profiles
    where id = p_user_id
    for update;

    if not found then
        raise exception 'Profile not found' using errcode = 'P0002';
    end if;

    if v_profile.coins < p_price then
        raise exception 'Insufficient coins' using errcode = 'P0001';
    end if;

    if p_item_id = any(v_profile.inventory) then
        return query select * from public.profiles where id = p_user_id;
        return;
    end if;

    update public.profiles
    set
        coins = coins - p_price,
        inventory = array_append(inventory, p_item_id),
        updated_at = now()
    where id = p_user_id
    returning * into v_profile;

    return next v_profile;
end;
$$;

create or replace function public.transfer_coins(
    recipient uuid,
    amount integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    sender uuid := (select auth.uid());
    sender_balance integer;
    gifts_last_hour integer;
begin
    if sender is null then
        raise exception 'not_authenticated';
    end if;

    if amount not in (50, 100, 500) then
        raise exception 'invalid_gift_amount';
    end if;

    if recipient = sender then
        raise exception 'cannot_gift_self';
    end if;

    select count(*)
    into gifts_last_hour
    from public.coin_gifts
    where sender_id = sender
      and created_at > now() - interval '1 hour';

    if gifts_last_hour >= 10 then
        raise exception 'gift_limit_reached';
    end if;

    select coins
    into sender_balance
    from public.profiles
    where id = sender
    for update;

    if sender_balance is null then
        raise exception 'sender_profile_missing';
    end if;

    if sender_balance < amount then
        raise exception 'insufficient_funds';
    end if;

    update public.profiles
    set
        coins = coins - amount,
        updated_at = now()
    where id = sender;

    update public.profiles
    set
        coins = coins + amount,
        updated_at = now()
    where id = recipient;

    if not found then
        raise exception 'recipient_profile_missing';
    end if;

    insert into public.coin_gifts (sender_id, recipient_id, amount)
    values (sender, recipient, amount);

    return sender_balance - amount;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.public_profiles enable row level security;
alter table public.game_rooms enable row level security;
alter table public.friendships enable row level security;
alter table public.coin_gifts enable row level security;
alter table public.reports enable row level security;
alter table public.season_progress enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
    on public.profiles for select
    to authenticated
    using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
    on public.profiles for insert
    to authenticated
    with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
    on public.profiles for update
    to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

drop policy if exists "public_profiles_read" on public.public_profiles;
create policy "public_profiles_read"
    on public.public_profiles for select
    to anon, authenticated
    using (true);

drop policy if exists "game_rooms_authenticated_read" on public.game_rooms;
create policy "game_rooms_authenticated_read"
    on public.game_rooms for select
    to authenticated
    using (true);

drop policy if exists "game_rooms_host_insert" on public.game_rooms;
create policy "game_rooms_host_insert"
    on public.game_rooms for insert
    to authenticated
    with check ((select auth.uid()) = host_id);

drop policy if exists "game_rooms_host_update" on public.game_rooms;
create policy "game_rooms_host_update"
    on public.game_rooms for update
    to authenticated
    using ((select auth.uid()) = host_id)
    with check ((select auth.uid()) = host_id);

drop policy if exists "game_rooms_host_delete" on public.game_rooms;
create policy "game_rooms_host_delete"
    on public.game_rooms for delete
    to authenticated
    using ((select auth.uid()) = host_id);

drop policy if exists "friendships_insert_own" on public.friendships;
create policy "friendships_insert_own"
    on public.friendships for insert
    to authenticated
    with check ((select auth.uid()) = requester_id);

drop policy if exists "friendships_select_involved" on public.friendships;
create policy "friendships_select_involved"
    on public.friendships for select
    to authenticated
    using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);

drop policy if exists "friendships_accept_addressee" on public.friendships;
create policy "friendships_accept_addressee"
    on public.friendships for update
    to authenticated
    using ((select auth.uid()) = addressee_id)
    with check ((select auth.uid()) = addressee_id and status = 'accepted');

drop policy if exists "friendships_delete_involved" on public.friendships;
create policy "friendships_delete_involved"
    on public.friendships for delete
    to authenticated
    using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);

drop policy if exists "coin_gifts_select_involved" on public.coin_gifts;
create policy "coin_gifts_select_involved"
    on public.coin_gifts for select
    to authenticated
    using ((select auth.uid()) = sender_id or (select auth.uid()) = recipient_id);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
    on public.reports for insert
    to authenticated
    with check ((select auth.uid()) = reporter_id);

drop policy if exists "season_progress_select_own" on public.season_progress;
create policy "season_progress_select_own"
    on public.season_progress for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "season_progress_insert_own" on public.season_progress;
create policy "season_progress_insert_own"
    on public.season_progress for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "season_progress_update_own" on public.season_progress;
create policy "season_progress_update_own"
    on public.season_progress for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

-- ============================================================================
-- DATA API GRANTS
-- ============================================================================

revoke all on all tables in schema public from anon, authenticated;
revoke all on all routines in schema public from public, anon, authenticated;
revoke all on all routines in schema private from public, anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select on table public.public_profiles to anon, authenticated;
grant select on table public.leaderboard_view to anon, authenticated;
grant select, insert, update, delete on table public.game_rooms to authenticated;
grant select, insert, update, delete on table public.friendships to authenticated;
grant select on table public.coin_gifts to authenticated;
grant insert on table public.reports to authenticated;
grant select, insert, update on table public.season_progress to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.public_profiles to service_role;
grant all on table public.leaderboard_view to service_role;
grant all on table public.game_rooms to service_role;
grant all on table public.friendships to service_role;
grant all on table public.coin_gifts to service_role;
grant all on table public.reports to service_role;
grant all on table public.season_progress to service_role;

grant execute on function public.purchase_item(uuid, text, integer) to authenticated, service_role;
grant execute on function public.transfer_coins(uuid, integer) to authenticated, service_role;

commit;
