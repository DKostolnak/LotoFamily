/**
 * Supabase Realtime Service — multiplayer komunikácia
 *
 * Nahradí socket.ts (Socket.io) cez Supabase Realtime Broadcast.
 *
 * Ako funguje Supabase Realtime:
 *   - Každá herná miestnosť = jeden Realtime "kanál"
 *   - Kanál má meno napr. "room:ABC123"
 *   - Hráči posielajú "broadcast" správy do kanálu
 *   - Všetci ostatní v kanáli ich okamžite dostanú (WebSocket)
 *   - Supabase server to nevaliduje — validácia je na tebe (alebo Edge Function)
 *
 * Architektúra (čo tu robíme):
 *   Host → pošle game:state do kanálu → všetci klienti dostanú update
 *
 * Rozdiel oproti Socket.io:
 *   Socket.io: klient ↔ tvoj server ↔ klient   (potrebuješ vlastný server)
 *   Supabase:  klient ↔ Supabase ↔ klient       (Supabase je ten server)
 *
 * Pre produkčnú hru s validáciou čísel, win-check atď. použiješ
 * Supabase Edge Functions (Deno) — tie sú "tvoj server" ale serverless.
 */

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameState, Player } from '@/lib/types';

// ============================================================================
// TYPY BROADCAST SPRÁV
// ============================================================================

/** Typy správ posielaných cez broadcast */
export type BroadcastEventType =
    | 'game:state'        // Kompletný update stavu hry
    | 'game:numberCalled' // Nové číslo zavolané
    | 'game:playerJoined' // Hráč sa pripojil
    | 'game:playerLeft'   // Hráč odišiel
    | 'game:markCell'     // Hráč označil políčko
    | 'game:claimWin'     // Hráč žiada bingo
    | 'game:claimFlat'    // Hráč žiada flat bonus
    | 'game:chat'         // Chat správa
    | 'game:winner'       // Hra má víťaza
    | 'game:flatClaimed'  // Flat bonus uplatnený
    | 'room:created'      // Miestnosť vytvorená (host dostane kód)
    | 'room:closed'       // Miestnosť zatvorená hostom
    | 'game:start'        // Hra začína
    | 'game:pause'        // Hra pauznúta
    | 'game:resume';      // Hra pokračuje

export interface BroadcastPayload<T = unknown> {
    type: BroadcastEventType;
    payload: T;
    senderId: string;
    timestamp: number;
}

// Callback typizácia pre každú udalosť
type EventCallback<T = unknown> = (payload: T, senderId: string) => void;

// ============================================================================
// REALTIME SERVICE CLASS
// ============================================================================

/**
 * RealtimeService — spravuje jeden Realtime kanál (hernú miestnosť).
 *
 * Použitie:
 *   const rt = realtimeService;
 *   await rt.joinRoom('ABC123', myUserId);
 *   rt.on('game:state', (state) => store.setGameState(state));
 *   rt.broadcast('game:numberCalled', { number: 42 });
 */
class RealtimeService {
    private static m_instance: RealtimeService;

    private m_channel: RealtimeChannel | null = null;
    private m_roomCode: string | null = null;
    private m_userId: string | null = null;
    private m_listeners: Map<string, Set<EventCallback>> = new Map();

    private constructor() {}

    public static getInstance(): RealtimeService {
        if (!RealtimeService.m_instance) {
            RealtimeService.m_instance = new RealtimeService();
        }
        return RealtimeService.m_instance;
    }

    // =========================================================================
    // PRIPOJENIE
    // =========================================================================

    /**
     * Pripoj sa k hernej miestnosti.
     *
     * Čo sa stane:
     *   1. Supabase vytvorí WebSocket kanál s menom "room:{roomCode}"
     *   2. subscribe() čaká kým je pripojenie aktívne
     *   3. Všetky broadcast správy v tomto kanáli prídu cez onBroadcast()
     */
    public async joinRoom(roomCode: string, userId: string): Promise<void> {
        // Odpoj sa od predchádzajúcej miestnosti ak existuje
        await this.leaveRoom();

        this.m_roomCode = roomCode;
        this.m_userId = userId;

        // Vytvor kanál — každá miestnosť má unikátny názov
        this.m_channel = supabase.channel(`room:${roomCode}`, {
            config: {
                // broadcast: self = false → nedostanem vlastné správy späť
                broadcast: { self: false },
                // presence: sledovanie kto je online v kanáli
                presence: { key: userId },
            },
        });

        // Poslúchaj na všetky broadcast správy v kanáli
        this.m_channel.on('broadcast', { event: '*' }, (msg) => {
            // Supabase broadcast payload je dynamický — pretypujeme cez unknown
            this.handleBroadcast(msg as unknown as { event: string; payload: BroadcastPayload });
        });

        // Čaká kým je WebSocket pripojenie aktívne
        await new Promise<void>((resolve, reject) => {
            this.m_channel!.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime] Joined room: ${roomCode}`);
                    resolve();
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    reject(new Error(`[Realtime] Subscribe failed: ${status}`));
                }
            });
        });
    }

    /**
     * Odíď z hernej miestnosti — zatvorí WebSocket kanál.
     */
    public async leaveRoom(): Promise<void> {
        if (this.m_channel) {
            await supabase.removeChannel(this.m_channel);
            this.m_channel = null;
            this.m_roomCode = null;
            console.log('[Realtime] Left room');
        }
    }

    // =========================================================================
    // POSIELANIE SPRÁV
    // =========================================================================

    /**
     * Pošli broadcast správu všetkým hráčom v miestnosti.
     *
     * Príklad:
     *   rt.broadcast('game:numberCalled', { number: 42 });
     *   rt.broadcast('game:state', fullGameState);
     */
    public broadcast<T>(event: BroadcastEventType, payload: T): void {
        if (!this.m_channel || !this.m_userId) {
            console.warn('[Realtime] Cannot broadcast — not in a room');
            return;
        }

        const message: BroadcastPayload<T> = {
            type: event,
            payload,
            senderId: this.m_userId,
            timestamp: Date.now(),
        };

        this.m_channel.send({
            type: 'broadcast',
            event,
            payload: message,
        }).catch((err) => {
            console.error('[Realtime] Broadcast failed:', err);
        });
    }

    // =========================================================================
    // PRÍJEM SPRÁV
    // =========================================================================

    /**
     * Zaregistruj callback pre typ udalosti.
     *
     * Použitie:
     *   const unsub = rt.on('game:numberCalled', ({ number }) => {
     *     setCurrentNumber(number);
     *   });
     *   // Pri unmount:
     *   unsub();
     */
    public on<T = unknown>(event: BroadcastEventType, callback: EventCallback<T>): () => void {
        if (!this.m_listeners.has(event)) {
            this.m_listeners.set(event, new Set());
        }
        this.m_listeners.get(event)!.add(callback as EventCallback);

        // Vráti unsubscribe funkciu
        return () => {
            this.m_listeners.get(event)?.delete(callback as EventCallback);
        };
    }

    private handleBroadcast(msg: { event: string; payload: BroadcastPayload }): void {
        const { event, payload } = msg;
        const callbacks = this.m_listeners.get(event);
        if (callbacks) {
            callbacks.forEach((cb) => cb(payload.payload, payload.senderId));
        }
    }

    // =========================================================================
    // SKRATKY PRE HERNÉ AKCIE
    // =========================================================================

    /** Odošle kompletný stav hry všetkým hráčom (host volá po každej zmene) */
    public sendGameState(state: GameState): void {
        this.broadcast('game:state', state);
    }

    /** Oznámi zavolanie čísla */
    public sendNumberCalled(number: number): void {
        this.broadcast('game:numberCalled', { number });
    }

    /** Oznámi nového hráča */
    public sendPlayerJoined(player: Player): void {
        this.broadcast('game:playerJoined', player);
    }

    /** Oznámi odchod hráča */
    public sendPlayerLeft(playerId: string): void {
        this.broadcast('game:playerLeft', { playerId });
    }

    /** Oznámi víťaza */
    public sendWinner(playerId: string, playerName: string): void {
        this.broadcast('game:winner', { playerId, playerName });
    }

    // =========================================================================
    // STAV
    // =========================================================================

    public isConnected(): boolean {
        return this.m_channel !== null;
    }

    public getRoomCode(): string | null {
        return this.m_roomCode;
    }
}

export const realtimeService = RealtimeService.getInstance();
export { RealtimeService };
