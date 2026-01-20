/**
 * Core Types for Loto Game
 * 
 * Organized by domain:
 * 1. Card Types - LotoCell, LotoCard, LotoCardGrid
 * 2. Player Types - Player, PlayerStats
 * 3. Game Types - GameState, GameSettings, GamePhase
 * 4. Socket Types - Event definitions for client-server communication
 * 5. Constants - Default values
 */

// ============================================================================
// CARD TYPES
// ============================================================================

/**
 * Single cell on a Loto card.
 * European Loto 90 format uses 9 columns x 3 rows.
 */
export interface LotoCell {
  /** Cell value (1-90) or null for blank cells */
  value: number | null;
  /** Whether this cell has been marked by the player */
  isMarked: boolean;
}

/** A single row of cells (9 cells per row) */
export type LotoCardRow = LotoCell[];

/** Complete card grid (3 rows x 9 columns) */
export type LotoCardGrid = LotoCardRow[];

/**
 * A complete Loto card belonging to a player.
 */
export interface LotoCard {
  /** Unique identifier for this card */
  id: string;
  /** The 3x9 grid of cells */
  grid: LotoCardGrid;
  /** ID of the player who owns this card */
  playerId: string;
}

// ============================================================================
// PLAYER TYPES
// ============================================================================

/**
 * Player in a game room.
 */
export interface Player {
  /** Unique socket ID */
  id: string;
  /** Display name */
  name: string;
  /** Token for reconnection (persistent across sessions) */
  token?: string;
  /** Avatar emoji or URL */
  avatar: string;
  /** Player's cards for this game */
  cards: LotoCard[];
  /** Whether this player created the room */
  isHost: boolean;
  /** Whether currently connected to socket */
  isConnected: boolean;
  /** Flat numbers (1 or 2) this player has claimed */
  collectedFlats: number[];
  /** Total points scored */
  score: number;
  /** Rank Tier */
  tier?: string;
  /** Whether this player is a bot */
  isBot?: boolean;
  /** Current coin balance (Loto Coins) */
  coins?: number;
  /** IDs of unlocked items */
  /** ID of unlocked items */
  inventory?: string[];
  /** Active marker skin ID */
  activeSkin?: string;
}

// ============================================================================
// GAME TYPES
// ============================================================================

/**
 * Record of a called number with timestamp.
 */
export interface CalledNumber {
  /** The number that was called (1-90) */
  value: number;
  /** When the number was called (Unix timestamp) */
  timestamp: number;
}

/**
 * Current phase of the game.
 * - lobby: Waiting for players to join
 * - playing: Game in progress
 * - paused: Game paused by host
 * - finished: Game complete, winner declared
 */
export type GamePhase = 'lobby' | 'playing' | 'paused' | 'finished';

/**
 * Available game modes.
 * - classic: First to complete full card
 * - row: First to complete any row
 * - pattern: Match specific pattern
 * - speed: Time-limited mode
 */
export type GameModeType = 'classic' | 'row' | 'pattern' | 'speed';

/**
 * Supported languages for UI and speech synthesis.
 */
export type LanguageCode = 'en' | 'sk' | 'uk' | 'ru';

/**
 * Game configuration options.
 */
export interface GameSettings {
  /** Selected game mode */
  gameMode: GameModeType;
  /** Maximum players allowed in room */
  maxPlayers: number;
  /** Number of cards per player */
  cardsPerPlayer: number;
  /** Whether numbers are called automatically */
  autoCallEnabled: boolean;
  /** Interval between auto-calls (milliseconds) */
  autoCallIntervalMs: number;
  /** UI language */
  language: LanguageCode;
  /** Whether Crazy Mode is enabled (shuffles cards on correct mark) */
  crazyMode: boolean;
  /** Custom room code (optional, auto-generated if not provided) */
  customRoomCode?: string;
  /** Whether the room is public (discoverable in main menu) */
  isPublic: boolean;
}

/**
 * Tracks which players have won flat bonuses.
 * Flats are awarded for completing rows.
 */
export interface FlatWinners {
  /** Player ID who won first flat (null if unclaimed) */
  flat1: string | null;
  /** Player ID who won second flat (null if unclaimed) */
  flat2: string | null;
}

/**
 * Complete game state shared between server and clients.
 */
export interface GameState {
  /** Unique room identifier (internal) */
  roomId: string;
  /** Human-readable room code for joining */
  roomCode: string;
  /** Current game phase */
  phase: GamePhase;
  /** Game configuration */
  settings: GameSettings;
  /** All players in the room */
  players: Player[];
  /** History of called numbers */
  calledNumbers: CalledNumber[];
  /** Most recently called number (null before first call) */
  currentNumber: number | null;
  /** Numbers not yet called */
  remainingNumbers: number[];
  /** ID of winning player (null until game ends) */
  winnerId: string | null;
  /** ID of the room host */
  hostId: string;
  /** Room creation timestamp */
  createdAt: number;
  /** Game start timestamp (for duration tracking) */
  startedAt?: number;
  /** Flat bonus winners */
  flatWinners: FlatWinners;
  /** Server URL for reconnection */
  serverUrl?: string;
}

// ============================================================================
// SOCKET EVENT TYPES
// ============================================================================

/**
 * Events sent from server to client.
 */
export type ServerToClientEvents = {
  /** Full game state update */
  'game:state': (state: GameState) => void;
  /** New number called */
  'game:numberCalled': (number: number) => void;
  /** Player joined the room */
  'game:playerJoined': (player: Player) => void;
  /** Player left the room */
  'game:playerLeft': (playerId: string) => void;
  /** Game won (with winner details) */
  'game:winner': (playerId: string, playerName: string) => void;
  /** Flat claimed by player */
  'game:flatClaimed': (playerId: string, flatType: number) => void;
  /** Error message */
  'game:error': (message: string) => void;
  /** Room created (returns code) */
  'room:created': (roomCode: string) => void;
  /** Successfully joined room */
  'room:joined': (state: GameState) => void;
  /** Kicked from room */
  'room:kicked': () => void;
  /** Room closed by host */
  'room:closed': () => void;
  /** Server info (URL for reconnection) */
  'server:info': (url: string) => void;
  /** Economy Update (coins, inventory) */
  'economy:update': (data: { coins: number; rp: number; tier: string; inventory: string[] }) => void;
  /** Achievement unlocked notification */
  'achievement:unlocked': (data: { id: string; name: string; icon: string; description: string }) => void;
  /** Generic Error */
  'error': (error: { message: string }) => void;
};

/**
 * Events sent from client to server.
 */
export type ClientToServerEvents = {
  /** Create a new room */
  'room:create': (data: {
    playerName: string;
    avatar: string;
    settings: Partial<GameSettings>;
    token?: string;
  }) => void;
  /** Join existing room */
  'room:join': (data: {
    roomCode: string;
    playerName: string;
    avatar: string;
    token?: string;
  }) => void;
  /** Update player profile */
  'room:updateProfile': (name: string, avatarUrl: string) => void;
  /** Leave current room */
  'room:leave': () => void;
  /** Kick a player (host only) */
  'room:kickPlayer': (playerId: string) => void;
  /** Close room (host only) */
  'room:close': () => void;
  /** Start the game (host only) */
  'game:start': (options?: { autoCallIntervalMs: number }) => void;
  /** Call next number (host only) */
  'game:callNumber': () => void;
  /** Mark a cell on player's card */
  'game:markCell': (cardId: string, row: number, col: number) => void;
  /** Claim win (full card) */
  'game:claimWin': (cardId: string) => void;
  /** Claim flat bonus */
  'game:claimFlat': (flatType: number) => void;
  /** Pause game (host only) */
  'game:pause': () => void;
  /** Resume game (host only) */
  'game:resume': () => void;
  /** Restart game (host only) */
  'game:restart': () => void;
  /** Debug: Add bots */
  'room:addBots': () => void;
  /** Purchase Item */
  'economy:purchase': (token: string, itemId: string, cost: number) => void;
  /** Sync Economy State */
  'economy:sync': (token: string) => void;
  /** Claim Daily Bonus */
  'economy:claimBonus': (token: string) => void;
};

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default game settings for new rooms.
 */
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  gameMode: 'classic',
  maxPlayers: 4,
  cardsPerPlayer: 3,
  autoCallEnabled: false,
  autoCallIntervalMs: 5000,
  language: 'en',
  crazyMode: false,
  isPublic: true,
};

/**
 * Total numbers in European Loto (1-90).
 */
export const LOTO_MAX_NUMBER = 90;

/**
 * Grid dimensions for European Loto cards.
 */
export const CARD_ROWS = 3;
export const CARD_COLUMNS = 9;
export const NUMBERS_PER_ROW = 5;
