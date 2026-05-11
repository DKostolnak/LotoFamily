/**
 * useSocketStatus
 *
 * Reactive hook that mirrors the singleton `socketService` connection lifecycle
 * into React state, and overlays a polling "offline" detection from
 * `expo-network` (no permanent listener API in Expo SDK 54 — polling is the
 * supported approach).
 *
 * Returned status values:
 *  - 'connected'     — socket connected, network online
 *  - 'connecting'    — initial connection in progress
 *  - 'reconnecting'  — server-side disconnect, socket.io retry loop
 *  - 'disconnected'  — disconnected, no active retry
 *  - 'error'         — connect_error / server error event
 *  - 'offline'       — device has no network connectivity (polled)
 *
 * `retry()` re-issues `socketService.connect(serverUrl)` if a previous URL
 * is known. Caller is responsible for re-joining the room.
 */

import { useEffect, useRef, useState } from 'react';
import { socketService, type ConnectionStatus } from '@/lib/services';

// Lazy require — expo-network native module may not be present in Expo Go.
// If unavailable, offline detection is disabled and socket status is used as-is.
let Network: typeof import('expo-network') | null = null;
try {
    Network = require('expo-network');
} catch {
    console.warn('[useSocketStatus] expo-network unavailable — offline detection disabled');
}

export type SocketBannerStatus = ConnectionStatus | 'offline';

export interface UseSocketStatusResult {
    status: SocketBannerStatus;
    error: string | null;
    isOffline: boolean;
    retry: () => void;
}

const k_offlinePollMs = 5000;

export function useSocketStatus(): UseSocketStatusResult {
    const [status, setStatus] = useState<ConnectionStatus>(socketService.getStatus());
    const [error, setError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);

    // Track the latest socket-side status separately from the network-side
    // status so they can be combined without one stomping the other.
    const socketStatusRef = useRef<ConnectionStatus>(socketService.getStatus());

    useEffect(() => {
        const unsubConnection = socketService.subscribe('connection', (...args) => {
            const connected = args[0] as boolean;
            const next: ConnectionStatus = connected ? 'connected' : 'disconnected';
            socketStatusRef.current = next;
            setStatus(next);
            if (connected) {
                setError(null);
            }
        });

        const unsubError = socketService.subscribe('error', (...args) => {
            const msg = (args[0] as string) ?? null;
            socketStatusRef.current = 'error';
            setStatus('error');
            setError(msg);
        });

        return () => {
            unsubConnection();
            unsubError();
        };
    }, []);

    // Network polling. expo-network in SDK 54 exposes `getNetworkStateAsync()`
    // but no event listener — short-interval polling is the canonical approach
    // and is cheap (no permission, no native bridge per call beyond status).
    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            if (!Network) return; // Native module unavailable — skip offline check
            try {
                const state = await Network.getNetworkStateAsync();
                if (cancelled) return;
                const offline = !(state.isConnected && state.isInternetReachable !== false);
                setIsOffline(offline);
            } catch {
                // If the API itself fails, do not assume offline — leave state.
            }
        };

        check();
        const interval = setInterval(check, k_offlinePollMs);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    const retry = () => {
        const state = socketService.getState();
        if (state.serverUrl) {
            socketService.connect(state.serverUrl);
        }
    };

    // Offline overrides socket status — the device has no network so the
    // socket can't recover until that changes.
    const effective: SocketBannerStatus = isOffline ? 'offline' : status;

    return { status: effective, error, isOffline, retry };
}
