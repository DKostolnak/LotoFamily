
import { createServer } from "node:http";
import os from "node:os";
import next from "next";

function getLocalIp() {
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

const localIp = getLocalIp();
const serverUrl = `http://${localIp}:3000`;
console.log(`\x1b[36m[Server] Running on: ${serverUrl}\x1b[0m`);
import { Server } from "socket.io";
import type { GameState, GameSettings, Player, ServerToClientEvents, ClientToServerEvents, LotoCard, LotoCardGrid } from "./src/lib/types.ts";
import {
    createGame,
    addPlayer,
    startGame as startGameEngine,
    callNextNumber,
    setWinner,
    checkForWinners,
    removePlayer,
    resetGame,
    pauseGame,
    resumeGame,
    claimFlat
} from "./src/engine/gameEngine.ts";
import { markCell } from "./src/engine/lotoCardGenerator.ts";
import { type SabotageType } from "./src/lib/types.ts";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

/**
 * Shuffle unmarked cell positions for Crazy Mode
 * Keeps marked cells in place, only shuffles positions of unmarked numbers
 */
function shuffleCardPositions(card: LotoCard): LotoCard {
    // Collect ALL cells (marked, unmarked, and empty)
    // We flatten the grid to treat it as a bag of 27 positions
    const allCells = card.grid.flat().map(cell => ({ ...cell }));

    // Shuffle the entire set of cells (Fisher-Yates)
    for (let i = allCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
    }

    // Reconstruct the 3x9 grid
    const newGrid: LotoCardGrid = [
        allCells.slice(0, 9),
        allCells.slice(9, 18),
        allCells.slice(18, 27)
    ] as any; // Type casting safely now that we have the type

    return { ...card, grid: newGrid };
}

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Game state storage (in-memory)
// Room code -> GameState
const games = new Map<string, GameState>();
// Room code -> Interval ID
const roomIntervals = new Map<string, NodeJS.Timeout>();

// Cleanup stale games every hour
setInterval(() => {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    for (const [roomCode, game] of games.entries()) {
        if (now - game.createdAt > DAY_MS) {
            console.log(`Cleaning up stale room: ${roomCode}`);
            // Clear any running interval
            if (roomIntervals.has(roomCode)) {
                clearInterval(roomIntervals.get(roomCode));
                roomIntervals.delete(roomCode);
            }
            games.delete(roomCode);
        }
    }
}, 60 * 60 * 1000);

function startAutoCall(roomCode: string, game: GameState, io: Server) {
    if (!game.settings.autoCallEnabled) return;

    // Clear existing if any
    stopAutoCall(roomCode);

    const interval = setInterval(() => {
        let currentGame = games.get(roomCode);
        if (!currentGame || currentGame.phase !== 'playing') {
            stopAutoCall(roomCode);
            return;
        }

        currentGame = callNextNumber(currentGame);

        // Check winners
        const winResult = checkForWinners(currentGame);
        if (winResult) {
            currentGame = setWinner(currentGame, winResult.winnerId);
            stopAutoCall(roomCode);
        }

        if (currentGame.remainingNumbers.length === 0) {
            stopAutoCall(roomCode);
        }

        games.set(roomCode, currentGame);
        io.to(roomCode).emit("game:state", currentGame);

        if (currentGame.currentNumber) {
            io.to(roomCode).emit("game:numberCalled", currentGame.currentNumber);
        }

        if (winResult) {
            const winner = currentGame.players.find(p => p.id === winResult.winnerId);
            io.to(roomCode).emit("game:winner", winResult.winnerId, winner?.name || "Unknown");
        }

    }, game.settings.autoCallIntervalMs);

    roomIntervals.set(roomCode, interval);
}

function stopAutoCall(roomCode: string) {
    const interval = roomIntervals.get(roomCode);
    if (interval) {
        clearInterval(interval);
        roomIntervals.delete(roomCode);
    }
}

app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);

    io.on("connection", (socket) => {
        // Send server info to client
        socket.emit("server:info", serverUrl);

        // Join a room (player must have already created/joined via UI and received room code)
        socket.on("room:create", (playerName, avatarUrl, settings, token) => {
            let roomCode: string;

            // HANDLE CUSTOM ROOM CODE
            if (settings.customRoomCode && typeof settings.customRoomCode === 'string') {
                const requestedCode = settings.customRoomCode.trim().toUpperCase();

                // Validate format (3-10 Alphanumeric)
                if (!/^[A-Z0-9]{3,10}$/.test(requestedCode)) {
                    socket.emit("game:error", "Invalid Room Code. Use 3-10 letters/numbers.");
                    return;
                }

                // Check availability
                if (games.has(requestedCode)) {
                    socket.emit("game:error", "Room Code already taken. Try another.");
                    return;
                }

                roomCode = requestedCode;
            } else {
                // Generate random code (6 chars)
                do {
                    roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                } while (games.has(roomCode));
            }

            const playerId = socket.id;

            const newGame = createGame(playerId, playerName, avatarUrl, {
                ...settings,
                // Force defaults if partial
                gameMode: settings.gameMode || 'classic',
                maxPlayers: settings.maxPlayers || 4,
                cardsPerPlayer: settings.cardsPerPlayer || 3, // Default to 3 cards
                autoCallEnabled: settings.autoCallEnabled || false,
                autoCallIntervalMs: settings.autoCallIntervalMs || 5000,
                language: settings.language || 'en',
                crazyMode: settings.crazyMode || false
            }, token);

            // Override the random ID from engine with our Room Code for easier typing
            newGame.roomId = roomCode;
            newGame.roomCode = roomCode;
            newGame.serverUrl = serverUrl;

            games.set(roomCode, newGame);
            socket.join(roomCode);

            socket.emit("room:created", roomCode);
            socket.emit("game:state", newGame);
            console.log(`Room created: ${roomCode} by ${playerName} (${playerId})`);
        });

        socket.on("room:join", (roomCode, playerName, avatarUrl, token) => {
            const upperRoomCode = roomCode.toUpperCase();
            const game = games.get(upperRoomCode);

            if (!game) {
                socket.emit("game:error", "Room not found");
                return;
            }

            // Check for reconnection
            const existingPlayerIndex = game.players.findIndex(p => p.token && p.token === token);

            if (existingPlayerIndex !== -1) {
                // RECONNECTION LOGIC
                const oldPlayerId = game.players[existingPlayerIndex].id;

                // Update player ID to new socket ID
                game.players[existingPlayerIndex].id = socket.id;
                game.players[existingPlayerIndex].isConnected = true;

                // Update references to player ID
                if (game.hostId === oldPlayerId) game.hostId = socket.id;
                if (game.winnerId === oldPlayerId) game.winnerId = socket.id;
                if (game.flatWinners.flat1 === oldPlayerId) game.flatWinners.flat1 = socket.id;
                if (game.flatWinners.flat2 === oldPlayerId) game.flatWinners.flat2 = socket.id;

                game.serverUrl = serverUrl;
                games.set(upperRoomCode, game);
                socket.join(upperRoomCode);

                io.to(upperRoomCode).emit("game:state", game);
                console.log(`Player reconnected: ${playerName} to ${upperRoomCode}`);
                return;
            }

            if (game.phase !== 'lobby') {
                socket.emit("game:error", "Game has already started");
                console.log(`Join failed: Game ${upperRoomCode} started`);
                return;
            }

            const updatedGame = addPlayer(game, socket.id, playerName, avatarUrl, token);
            if (!updatedGame) {
                socket.emit("game:error", "Could not join room (active or full)");
                console.log(`Join failed: ${upperRoomCode} full or error`);
                return;
            }

            games.set(upperRoomCode, updatedGame);
            socket.join(upperRoomCode);

            io.to(upperRoomCode).emit("game:state", updatedGame);
            console.log(`Player joined: ${playerName} (${socket.id}) to ${upperRoomCode}`);
        });

        socket.on("room:updateProfile", (name, avatarUrl) => {
            for (const [code, game] of games.entries()) {
                const playerIndex = game.players.findIndex(p => p.id === socket.id);
                if (playerIndex !== -1) {
                    game.players[playerIndex].name = name;
                    game.players[playerIndex].avatarUrl = avatarUrl;

                    games.set(code, game);
                    io.to(code).emit("game:state", game);
                    console.log(`Player ${socket.id} updated profile: ${name}`);
                    break;
                }
            }
        });

        socket.on("room:kickPlayer", (targetPlayerId) => {
            const roomCode = getRoomCode(socket);
            if (!roomCode) return;

            let game = games.get(roomCode);
            if (!game) return;

            // Verify host
            if (game.hostId !== socket.id) {
                console.log(`WARNING: Non-host ${socket.id} tried to kick ${targetPlayerId}`);
                return;
            }

            // Find target player
            const targetPlayer = game.players.find(p => p.id === targetPlayerId);
            if (!targetPlayer) return;

            console.log(`Host ${socket.id} kicking player ${targetPlayerId} from room ${roomCode}`);

            // 1. Emit kicked event to the specific socket
            io.to(targetPlayerId).emit("room:kicked");

            // 2. Remove player from game state
            const updatedGame = removePlayer(game, targetPlayerId);
            games.set(roomCode, updatedGame);

            // 3. Make the socket leave the room
            const targetSocket = io.sockets.sockets.get(targetPlayerId);
            if (targetSocket) {
                targetSocket.leave(roomCode);
            }

            // 4. Broadcast update to remaining players
            io.to(roomCode).emit("game:state", updatedGame);
            io.to(roomCode).emit("game:playerLeft", targetPlayerId);
        });

        socket.on("room:close", () => {
            const roomCode = getRoomCode(socket);
            if (!roomCode) return;

            let game = games.get(roomCode);
            if (!game) return;

            // Verify host
            if (game.hostId !== socket.id) {
                console.log(`WARNING: Non-host ${socket.id} tried to close room ${roomCode}`);
                return;
            }

            console.log(`Host ${socket.id} closing room ${roomCode}`);

            // 1. Notify all players
            io.to(roomCode).emit("room:closed");

            // 2. Disconnect/Leave all sockets
            const socketsInRoom = io.sockets.adapter.rooms.get(roomCode);
            if (socketsInRoom) {
                for (const socketId of socketsInRoom) {
                    const s = io.sockets.sockets.get(socketId);
                    if (s) s.leave(roomCode);
                }
            }

            // 3. Delete game state
            stopAutoCall(roomCode);
            games.delete(roomCode);
            console.log(`Room ${roomCode} closed by host`);
        });

        socket.on("room:leave", () => {
            // Find which room this socket is in
            // A socket can be in multiple rooms, but in our logic usually just one game room
            // We'll iterate games to find the player
            for (const [code, game] of games.entries()) {
                const player = game.players.find(p => p.id === socket.id);
                if (player) {
                    const updatedGame = removePlayer(game, socket.id);
                    socket.leave(code);

                    if (updatedGame.players.length === 0) {
                        stopAutoCall(code);
                        games.delete(code);
                        console.log(`Room ${code} deleted (empty)`);
                    } else {
                        // Start host migration if host left?
                        // For now, if host leaves, game might be stuck or we pick next player
                        if (game.hostId === socket.id && updatedGame.players.length > 0) {
                            updatedGame.hostId = updatedGame.players[0].id;
                            updatedGame.players[0].isHost = true; // Engine might need to handle this
                        }
                        games.set(code, updatedGame);
                        io.to(code).emit("game:state", updatedGame);
                    }
                    break; // localized to one room
                }
            }
        });

        socket.on("game:start", () => {
            const roomCode = getRoomCode(socket);
            if (!roomCode) return;

            let game = games.get(roomCode);
            if (game && game.hostId === socket.id) {
                game = startGameEngine(game);
                games.set(roomCode, game);
                io.to(roomCode).emit("game:state", game);

                // Start auto-call if enabled
                startAutoCall(roomCode, game, io);
            }
        });

        socket.on("game:callNumber", () => {
            const roomCode = getRoomCode(socket);
            if (!roomCode) return;

            let game = games.get(roomCode);
            if (game && game.hostId === socket.id) {
                // If auto-call is on, manual call might interfere or reset timer?
                // For now allow manual override but maybe reset timer
                if (game.settings.autoCallEnabled) {
                    stopAutoCall(roomCode);
                    startAutoCall(roomCode, game, io);
                }

                game = callNextNumber(game);

                // Check winners
                const winResult = checkForWinners(game);
                if (winResult) {
                    game = setWinner(game, winResult.winnerId);
                    stopAutoCall(roomCode);
                }

                games.set(roomCode, game);
                io.to(roomCode).emit("game:state", game);

                if (game.currentNumber) {
                    io.to(roomCode).emit("game:numberCalled", game.currentNumber);
                }

                if (winResult) {
                    const winner = game.players.find(p => p.id === winResult.winnerId);
                    io.to(roomCode).emit("game:winner", winResult.winnerId, winner?.name || "Unknown");
                }
            }
        });

        socket.on("game:markCell", (cardId, row, col) => {
            const roomCode = getRoomCode(socket);
            if (!roomCode) return;

            let game = games.get(roomCode);
            if (!game) return;

            const player = game.players.find(p => p.id === socket.id);
            if (!player) return;

            // Find card
            const cardIndex = player.cards.findIndex(c => c.id === cardId);
            if (cardIndex === -1) return;

            // VALIDATION: Can only mark cells while playing
            if (game.phase !== 'playing') {
                socket.emit("game:error", "Game is not in playing phase");
                return;
            }

            // Get the cell being marked
            const card = player.cards[cardIndex];
            const cellValue = card.grid[row][col].value;

            // Check if this is a "correct" mark (number was already called)
            const calledNumbers = game.calledNumbers.map(cn => cn.value);
            const isCorrectMark = cellValue !== null && calledNumbers.includes(cellValue);

            // Mark the cell
            let updatedCard = markCell(card, row, col);

            // Energy Logic: Reward quick reactions
            let energyChange = 0;
            if (isCorrectMark) {
                // Find when this number was called
                const calledInfo = game.calledNumbers.find(cn => cn.value === cellValue);
                if (calledInfo) {
                    const timeDiff = Date.now() - calledInfo.timestamp;
                    if (timeDiff < 2000) { // Under 2 seconds
                        energyChange = 15; // Speed Bonus
                    } else {
                        energyChange = 5; // Standard
                    }
                }
            } else {
                energyChange = -10; // Penalty
            }

            // Cap at 100, Floor at 0
            const newEnergy = Math.max(0, Math.min(100, (player.energy || 0) + energyChange));


            // Update players with the new card AND energy
            const safeGame = game!; // Capture for closure
            const updatedPlayers = game!.players.map(p => {
                if (p.id === socket.id) {
                    // Update the specific card that was marked
                    let newCards = p.cards.map(c => c.id === cardId ? updatedCard : c);

                    // If Crazy Mode & Correct Mark -> Shuffle ALL cards
                    if (safeGame.settings.crazyMode && isCorrectMark) {
                        newCards = newCards.map(c => shuffleCardPositions(c));
                    }

                    return {
                        ...p,
                        cards: newCards,
                        energy: newEnergy
                    };
                }
                return p;
            });

            game = { ...game, players: updatedPlayers };
            games.set(roomCode, game);

            io.to(roomCode).emit("game:state", game);
        });

        socket.on("game:claimWin", (cardId) => {
            const roomCode = getRoomCode(socket);
            if (!roomCode) return;

            let game = games.get(roomCode);
            if (!game) return;

            if (game.phase !== 'playing') return;

            const result = checkForWinners(game);
            if (result && result.winnerId === socket.id && result.winningCardId === cardId) {
                game = setWinner(game, socket.id);
                games.set(roomCode, game);

                // Stop auto-calling
                if (roomIntervals.has(roomCode)) {
                    clearInterval(roomIntervals.get(roomCode));
                    roomIntervals.delete(roomCode);
                }

                io.to(roomCode).emit("game:state", game);
            }
        });

        socket.on("game:claimFlat", (flatType) => {
            const roomCode = getRoomCode(socket);
            if (!roomCode) return;
            let game = games.get(roomCode);
            if (game) {
                const oldFlatWinners = { ...game.flatWinners };
                game = claimFlat(game, socket.id, flatType);
                games.set(roomCode, game);
                io.to(roomCode).emit("game:state", game);

                // Notify if a flat was successfully claimed and it was a new win
                const player = game.players.find(p => p.id === socket.id);
                if (player && player.collectedFlats.includes(flatType)) {
                    // Could broadcast a specific event for toast notifications
                    io.to(roomCode).emit("game:flatClaimed", socket.id, flatType);
                }
            }
        });



        socket.on("game:useSabotage", (targetId, type: SabotageType) => {
            const roomCode = getRoomCode(socket);
            if (!roomCode) return;
            let game = games.get(roomCode);
            if (!game) return;

            const attacker = game.players.find(p => p.id === socket.id);
            if (!attacker) return;

            // Define costs
            const COSTS: Record<SabotageType, number> = {
                'snowball': 40,
                'ink_splat': 60,
                'swap_hand': 90
            };

            const cost = COSTS[type];
            if ((attacker.energy || 0) < cost) {
                // Not enough energy - optionally notify client
                return;
            }

            // Pay the cost
            attacker.energy = (attacker.energy || 0) - cost;

            // Apply effect to target in state (if persistent) or just emit event
            const targetIndex = game.players.findIndex(p => p.id === targetId);
            if (targetIndex !== -1) {
                const target = game.players[targetIndex];

                // Update target state for persistence/reconnection
                if (!target.activeDebuffs) target.activeDebuffs = {}; // Safety check

                if (type === 'snowball') {
                    target.activeDebuffs.frozenUntil = Date.now() + 5000;
                } else if (type === 'ink_splat') {
                    // Add random ink splat
                    const splat = {
                        id: Math.random().toString(36).substring(7),
                        x: 20 + Math.random() * 60, // 20-80%
                        y: 20 + Math.random() * 60
                    };
                    target.activeDebuffs.inkSplats = [...(target.activeDebuffs.inkSplats || []), splat];
                }

                // Apply shuffling logic for swap/chaos if needed
                if (type === 'swap_hand') {
                    // For V1, we just do "Shuffle Unmarked" similar to Crazy Mode
                    target.cards = target.cards.map(card => shuffleCardPositions(card));
                }

                // Save state
                games.set(roomCode, game);

                // Broadcast state update (updates energy UI and debuff state)
                io.to(roomCode).emit("game:state", game);

                // Notify target specifically to trigger immediate VFX/Sound
                io.to(targetId).emit("game:sabotageEffect", targetId, type);
            }
        });

        socket.on("game:resume", () => {
            const roomCode = getRoomCode(socket);
            if (!roomCode) return;
            let game = games.get(roomCode);
            if (game && game.hostId === socket.id) {
                game = resumeGame(game);
                if (game.settings.autoCallEnabled) {
                    startAutoCall(roomCode, game, io);
                }
                games.set(roomCode, game);
                io.to(roomCode).emit("game:state", game);
            }
        });

        socket.on("game:restart", () => {
            const roomCode = getRoomCode(socket);
            if (!roomCode) return;
            let game = games.get(roomCode);
            if (game && game.hostId === socket.id) {
                stopAutoCall(roomCode);
                game = resetGame(game);
                games.set(roomCode, game);
                io.to(roomCode).emit("game:state", game);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected");
            // Optionally handle immediate leave or wait for reconnect
            // For this simple version, we treat disconnect as leave if we want, 
            // or we keep them in state for a bit?
            // Let's leave them in state but mark as disconnected?
            // For now, let's not auto-remove to allow refresh, but we don't have good reconnect logic yet without persistent ID tokens.
            // Current ID is socket.id, which changes on refresh.

            // So effectively, a refresh is a new player. 
            // We should probably trigger leave logic.
            // Re-using the leave logic from above:
            for (const [code, game] of games.entries()) {
                const player = game.players.find(p => p.id === socket.id);
                if (player) {
                    // If game is in progress, maybe don't remove?
                    // But since socket.id changes, they can't reconnect anyway without more complex auth.
                    // So remove them.
                    const updatedGame = removePlayer(game, socket.id);
                    if (updatedGame.players.length === 0) {
                        stopAutoCall(code);
                        games.delete(code);
                    } else {
                        if (game.hostId === socket.id && updatedGame.players.length > 0) {
                            updatedGame.hostId = updatedGame.players[0].id;
                            updatedGame.players[0].isHost = true;
                        }
                        games.set(code, updatedGame);
                        io.to(code).emit("game:state", updatedGame);
                    }
                }
            }
        });
    });

    // Helper to find room from socket
    function getRoomCode(socket: any): string | undefined {
        // In socket.io, socket.rooms is a Set. 
        // It contains socket.id and the rooms joined.
        for (const room of socket.rooms) {
            if (room.length === 6 && /^[A-Z0-9]+$/.test(room)) {
                return room;
            }
        }
        return undefined;
    }

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
