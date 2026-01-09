/**
 * useConnectionHealth Hook
 * 
 * Tracks WebSocket connection quality and provides status indicators.
 * Useful for showing connection state to users and detecting network issues.
 * 
 * Features:
 * - Round-trip time (latency) measurement
 * - Connection quality classification (good/fair/poor)
 * - Reconnection attempt tracking
 * - Network online/offline detection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Socket } from 'socket.io-client';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

export interface ConnectionHealth {
    /** Current connection quality */
    quality: ConnectionQuality;
    /** Latest measured round-trip time in ms */
    latency: number;
    /** Whether the socket is currently connected */
    isConnected: boolean;
    /** Whether the browser is online */
    isOnline: boolean;
    /** Number of reconnection attempts made */
    reconnectAttempts: number;
    /** Whether currently attempting to reconnect */
    isReconnecting: boolean;
}

const LATENCY_THRESHOLDS = {
    excellent: 50,   // < 50ms
    good: 150,       // < 150ms
    fair: 300,       // < 300ms
    // > 300ms = poor
};

const PING_INTERVAL_MS = 10000; // Ping every 10 seconds
const PING_TIMEOUT_MS = 5000;   // Consider ping failed after 5 seconds

/**
 * Hook to monitor WebSocket connection health
 */
export function useConnectionHealth(socket: Socket | null): ConnectionHealth {
    const [latency, setLatency] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [isReconnecting, setIsReconnecting] = useState(false);

    const pingStartRef = useRef<number>(0);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate connection quality from latency
    const quality: ConnectionQuality = (() => {
        if (!isOnline) return 'offline';
        if (!isConnected) return 'poor';
        if (latency < LATENCY_THRESHOLDS.excellent) return 'excellent';
        if (latency < LATENCY_THRESHOLDS.good) return 'good';
        if (latency < LATENCY_THRESHOLDS.fair) return 'fair';
        return 'poor';
    })();

    // Setup network online/offline listeners
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        // Initial state
        if (typeof navigator !== 'undefined') {
            setIsOnline(navigator.onLine);
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Setup socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            setIsConnected(true);
            setIsReconnecting(false);
            setReconnectAttempts(0);
        };

        const handleDisconnect = () => {
            setIsConnected(false);
        };

        const handleReconnectAttempt = (attemptNumber: number) => {
            setIsReconnecting(true);
            setReconnectAttempts(attemptNumber);
        };

        const handleReconnect = () => {
            setIsReconnecting(false);
            setReconnectAttempts(0);
        };

        // Pong response for latency measurement
        const handlePong = () => {
            // Clear timeout since we got a response
            if (pingTimeoutRef.current) {
                clearTimeout(pingTimeoutRef.current);
                pingTimeoutRef.current = null;
            }

            if (pingStartRef.current) {
                const rtt = Date.now() - pingStartRef.current;
                setLatency(rtt);
                pingStartRef.current = 0;
            }
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.io.on('reconnect_attempt', handleReconnectAttempt);
        socket.io.on('reconnect', handleReconnect);
        socket.on('pong', handlePong);

        // Set initial connected state
        setIsConnected(socket.connected);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.io.off('reconnect_attempt', handleReconnectAttempt);
            socket.io.off('reconnect', handleReconnect);
            socket.off('pong', handlePong);
        };
    }, [socket]);

    // Periodic ping for latency measurement
    useEffect(() => {
        if (!socket || !isConnected) {
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
            }
            return;
        }

        const sendPing = () => {
            if (socket.connected) {
                pingStartRef.current = Date.now();
                socket.emit('ping');

                // Set timeout - if no pong received, mark as poor connection
                pingTimeoutRef.current = setTimeout(() => {
                    if (pingStartRef.current !== 0) {
                        // No response received, set high latency
                        setLatency(PING_TIMEOUT_MS);
                        pingStartRef.current = 0;
                    }
                }, PING_TIMEOUT_MS);
            }
        };

        // Initial ping
        sendPing();

        // Setup interval
        pingIntervalRef.current = setInterval(sendPing, PING_INTERVAL_MS);

        return () => {
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
            }
            if (pingTimeoutRef.current) {
                clearTimeout(pingTimeoutRef.current);
                pingTimeoutRef.current = null;
            }
        };
    }, [socket, isConnected]);

    return {
        quality,
        latency,
        isConnected,
        isOnline,
        reconnectAttempts,
        isReconnecting,
    };
}

export default useConnectionHealth;
