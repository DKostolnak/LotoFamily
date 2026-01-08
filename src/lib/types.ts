/**
 * Core types for the Loto game engine
 * Organized by domain: Card, Player, Game, Socket
 */

// ============================================================================
// CARD TYPES
// ============================================================================

/**
 * Single cell on a Loto card
 * European Loto 90 format: 9 columns x 3 rows
 */
export interface LotoCell {
  value: number | null; // null = blank cell
  isMarked: boolean;
}

export type LotoCardRow = LotoCell[];
export type LotoCardGrid = LotoCardRow[]; // 3 rows x 9 columns

export interface LotoCard {
  id: string;
  grid: LotoCardGrid;
  playerId: string;
}

// ============================================================================
// PLAYER TYPES
// ============================================================================

export interface Player {
  id: string;
  name: string;
  token?: string; // For reconnection
  avatarUrl?: string;
  cards: LotoCard[];
  isHost: boolean;
  isConnected: boolean;
  collectedFlats: number[];
  score: number;
}

// ============================================================================
// GAME TYPES
// ============================================================================

export interface CalledNumber {
  value: number;
  timestamp: number;
}

export type GamePhase = 'lobby' | 'playing' | 'paused' | 'finished';
export type GameModeType = 'classic' | 'row' | 'pattern' | 'speed';
export type LanguageCode = 'en' | 'sk' | 'uk' | 'ru';

export interface GameSettings {
  gameMode: GameModeType;
  maxPlayers: number;
  cardsPerPlayer: number;
  autoCallEnabled: boolean;
  autoCallIntervalMs: number;
  language: LanguageCode;
  crazyMode: boolean;
  customRoomCode?: string;
}

export interface FlatWinners {
  flat1: string | null; // Player ID who won first flat
  flat2: string | null; // Player ID who won second flat
}

export interface GameState {
  roomId: string;
  roomCode: string;
  phase: GamePhase;
  settings: GameSettings;
  players: Player[];
  calledNumbers: CalledNumber[];
  currentNumber: number | null;
  remainingNumbers: number[];
  winnerId: string | null;
  hostId: string;
  createdAt: number;
  flatWinners: FlatWinners;
  serverUrl?: string;
}

// ============================================================================
// SOCKET EVENT TYPES
// ============================================================================

export type ServerToClientEvents = {
  'game:state': (state: GameState) => void;
  'game:numberCalled': (number: number) => void;
  'game:playerJoined': (player: Player) => void;
  'game:playerLeft': (playerId: string) => void;
  'game:winner': (playerId: string, playerName: string) => void;
  'game:flatClaimed': (playerId: string, flatType: number) => void;
  'game:error': (message: string) => void;
  'room:created': (roomCode: string) => void;
  'room:joined': (state: GameState) => void;
  'room:kicked': () => void;
  'room:closed': () => void;
  'server:info': (url: string) => void;
};

export type ClientToServerEvents = {
  'room:create': (playerName: string, avatarUrl: string, settings: Partial<GameSettings>, token?: string) => void;
  'room:join': (roomCode: string, playerName: string, avatarUrl: string, token?: string) => void;
  'room:updateProfile': (name: string, avatarUrl: string) => void;
  'room:leave': () => void;
  'room:kickPlayer': (playerId: string) => void;
  'room:close': () => void;
  'game:start': (options?: { autoCallIntervalMs: number }) => void;
  'game:callNumber': () => void;
  'game:markCell': (cardId: string, row: number, col: number) => void;
  'game:claimWin': (cardId: string) => void;
  'game:claimFlat': (flatType: number) => void;
  'game:pause': () => void;
  'game:resume': () => void;
  'game:restart': () => void;
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  gameMode: 'classic',
  maxPlayers: 4,
  cardsPerPlayer: 3,
  autoCallEnabled: false,
  autoCallIntervalMs: 5000,
  language: 'en',
  crazyMode: false,
};


