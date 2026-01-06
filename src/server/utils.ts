import os from 'node:os';

/**
 * Get local network IP address for LAN access
 */
export function getLocalIp(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

/**
 * Generate random room code
 */
export function generateRoomCode(length: number = 6): string {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code: string): boolean {
    return /^[A-Z0-9]{3,10}$/.test(code);
}

/**
 * Get formatted server URL
 */
export function getServerUrl(port: number = 3000): string {
    const localIp = getLocalIp();
    return `http://${localIp}:${port}`;
}
