/**
 * Supabase Client — singleton pre celú aplikáciu
 *
 * Supabase je open-source Firebase alternatíva postavená na PostgreSQL.
 * Tento súbor exportuje jeden klient, ktorý používame všade:
 *   - Auth (prihlásenie, registrácia, anonymné session)
 *   - Database (čítanie/zápis do PostgreSQL tabuliek)
 *   - Realtime (WebSocket broadcast pre multiplayer)
 *   - Storage (súbory, obrázky)
 *
 * Ako to funguje:
 *   1. createClient() vytvorí WebSocket + HTTP klienta smerujúceho na tvoj Supabase projekt
 *   2. Supabase automaticky uloží session token do AsyncStorage (React Native)
 *   3. Každý volajúci import { supabase } má tú istú inštanciu (singleton)
 *
 * Setup:
 *   1. Choď na https://supabase.com → New project
 *   2. Settings → API → skopíruj Project URL + anon public key
 *   3. Pridaj do .env.local:
 *        EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *        EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './supabase.types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/config/env.config';

// ============================================================================
// CLIENT
// ============================================================================

/**
 * Supabase klient — používaj toto všade v app
 *
 * Typový parameter `Database` ti dá autocompletion pre všetky tabuľky.
 * (Vygenerovaný z `supabase gen types typescript ...`)
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        // React Native potrebuje AsyncStorage namiesto localStorage
        storage: AsyncStorage,
        // Automaticky obnov token pred expirovaním
        autoRefreshToken: true,
        // Pri štarte app skontroluj uloženú session
        persistSession: true,
        // Vypni detekciu OAuth callbackov cez URL (nie je potrebná pre native)
        detectSessionInUrl: false,
    },
    realtime: {
        // Heartbeat každých 30s — udržuje WebSocket živý cez mobilné siete
        heartbeatIntervalMs: 30_000,
    },
    global: {
        headers: {
            // Identifikácia klienta pre Supabase dashboard analytics
            'x-client-info': 'loto-family/rn',
        },
    },
});

// ============================================================================
// AUTH HELPERS
// ============================================================================

/**
 * Vráti aktuálne prihlásenú session alebo null
 * Použitie: const { session } = await getSession();
 */
export const getSession = () => supabase.auth.getSession();

/**
 * Vráti aktuálneho usera alebo null
 * Použitie: const { data: { user } } = await supabase.auth.getUser();
 */
export const getCurrentUser = () => supabase.auth.getUser();

/**
 * Anonymné prihlásenie — ideálne pre hry kde nechceš nútiť registráciu.
 * Hráč dostane unikátne UUID, môže hrať hneď. Neskôr môže "upgradnúť"
 * na email/Google účet a zachovajú sa mu všetky dáta (coins, inventory...).
 *
 * Supabase automaticky uloží token do AsyncStorage — pri reštarte app
 * sa session obnoví bez opätovného prihlasovania.
 */
export const signInAnonymously = () => supabase.auth.signInAnonymously();

/**
 * Odhlásenie — zmaže token z AsyncStorage
 */
export const signOut = () => supabase.auth.signOut();

// ============================================================================
// DATABASE HELPERS (type-safe skratky)
// ============================================================================

/**
 * Skratka pre prístup k tabuľke `profiles`
 * Použitie: await db.profiles().select('*').eq('id', userId)
 */
export const db = {
    profiles: () => supabase.from('profiles'),
    gameRooms: () => supabase.from('game_rooms'),
    leaderboard: () => supabase.from('leaderboard_view'),
} as const;

export default supabase;
