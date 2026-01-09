
import { Socket, Server } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents, GameState } from '../../lib/types';
import * as store from '../store';
import { generatePlayerId } from '../../engine/gameEngine';
import { generateCards } from '../../engine/lotoCardGenerator';
import { roomLog } from '../../lib/logger';

type Context = {
    io: Server<ClientToServerEvents, ServerToClientEvents>;
    socket: Socket<ClientToServerEvents, ServerToClientEvents>;
};

const BOT_NAMES = ['Bot Alice', 'Bot Bob', 'Bot Charlie', 'Bot Dave', 'Bot Eve'];
const BOT_AVATARS = ['🐻', '🦊', '🐱', '🐼', '🦁'];

export function handleAddBots(context: Context, getRoomCode: (s: Socket) => string | undefined) {
    const { io, socket } = context;
    const roomCode = getRoomCode(socket);

    if (!roomCode) return;

    const game = store.getGame(roomCode);
    if (!game) return;

    // Only allow in development or if explicitly enabled
    if (process.env.NODE_ENV === 'production') {
        return;
    }

    const currentCount = game.players.length;
    const botsToAdd = 3; // Add enough to reach 4 total usually

    // Limit total players
    if (currentCount + botsToAdd > game.settings.maxPlayers) {
        return;
    }

    const newBots = Array.from({ length: botsToAdd }).map((_, i) => {
        const botId = `bot_${Date.now()}_${i}`;
        const nameIdx = (currentCount + i) % BOT_NAMES.length;

        return {
            id: botId,
            name: BOT_NAMES[nameIdx],
            avatarUrl: BOT_AVATARS[nameIdx],
            token: `bot_token_${botId}`,
            cards: generateCards(botId, game.settings.cardsPerPlayer),
            isHost: false,
            isConnected: true, // Bots are always connected
            collectedFlats: [],
            score: 0,
            isBot: true
        };
    });

    const updatedGame: GameState = {
        ...game,
        players: [...game.players, ...newBots]
    };

    store.setGame(roomCode, updatedGame);
    io.to(roomCode).emit('game:state', updatedGame);
    roomLog.info(`${roomCode}: Added ${botsToAdd} debug bots`);
}
