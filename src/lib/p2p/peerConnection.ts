/**
 * Loto P2P Connection Wrapper
 * Uses the modular P2PProvider to handle Loto-specific logic.
 */

import { P2PProvider } from '../core/network/P2PProvider';
import { NetworkPlayer } from '../core/network/types';

class LotoP2PConnection extends P2PProvider {
    constructor() {
        super('loto-mobile'); // Namespace for this game
    }

    /**
     * Generate a random 4-character room code (similar to legacy)
     */
    static generateRoomCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Specialized join sequence for Loto
     */
    async joinLotoRoom(player: NetworkPlayer, roomCode: string) {
        return this.connect({
            player,
            roomCode: roomCode.toUpperCase(),
            isHost: false
        });
    }

    /**
     * Specialized host sequence for Loto
     */
    async hostLotoRoom(player: NetworkPlayer, roomCode?: string) {
        const code = roomCode || LotoP2PConnection.generateRoomCode();
        await this.connect({
            player,
            roomCode: code,
            isHost: true
        });
        return code;
    }
}

export const lotoP2PConnection = new LotoP2PConnection();
export { NetworkPlayer as P2PPlayer }; // Export for compatibility with existing components
