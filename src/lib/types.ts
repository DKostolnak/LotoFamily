/**
 * Core types for the Loto game engine
 */

// European Loto 90 card format: 9 columns x 3 rows
// Each row has exactly 5 numbers and 4 blank cells
// Numbers 1-9 in column 1, 10-19 in column 2, ..., 80-90 in column 9

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

// ...

export type SabotageType = 'snowball' | 'ink_splat' | 'swap_hand';

export interface Player {
  id: string;
  name: string;
  token?: string; // For reconnection
  avatarUrl?: string;
  cards: LotoCard[];
  isHost: boolean;
  isConnected: boolean;
  collectedFlats: number[];



  // Sabotage
  energy: number;
  score: number; // Persistent score across rounds
  activeDebuffs: {
    frozenUntil?: number; // Timestamp
    inkSplats?: { x: number; y: number; id: string }[];
  };
}
// ...

// ...

export interface CalledNumber {
  value: number;
  timestamp: number;
}

export type GamePhase = 'lobby' | 'playing' | 'paused' | 'finished';

export interface GameSettings {
  gameMode: GameModeType;
  maxPlayers: number;
  cardsPerPlayer: number;
  autoCallEnabled: boolean;
  autoCallIntervalMs: number;
  language: 'en' | 'sk' | 'uk' | 'ru';
  crazyMode: boolean;
}

export type GameModeType = 'classic' | 'row' | 'pattern' | 'speed';

// Track who won which flat first
export interface FlatWinners {
  flat1: string | null; // Player ID
  flat2: string | null;
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
  serverUrl?: string; // Local network URL for others to join
}

// Socket events
export type ServerToClientEvents = {
  'game:state': (state: GameState) => void;
  'game:numberCalled': (number: number) => void;
  'game:playerJoined': (player: Player) => void;
  'game:playerLeft': (playerId: string) => void;
  'game:winner': (playerId: string, playerName: string) => void;
  'game:flatClaimed': (playerId: string, flatType: number) => void; // New event for notification
  'game:error': (message: string) => void;
  'room:created': (roomCode: string) => void;
  'room:joined': (state: GameState) => void;
  'room:kicked': () => void;
  'room:closed': () => void; // New event
  'game:sabotageEffect': (targetId: string, type: SabotageType) => void;
  'server:info': (url: string) => void;
};

export type ClientToServerEvents = {
  'room:create': (playerName: string, avatarUrl: string, settings: Partial<GameSettings>, token?: string) => void;
  'room:join': (roomCode: string, playerName: string, avatarUrl: string, token?: string) => void;
  'room:updateProfile': (name: string, avatarUrl: string) => void;
  'room:leave': () => void;
  'game:start': () => void;
  'game:callNumber': () => void;
  'game:markCell': (cardId: string, row: number, col: number) => void;
  'game:claimWin': (cardId: string) => void;
  'game:claimFlat': (flatType: number) => void;

  'game:pause': () => void;
  'game:resume': () => void;
  'game:restart': () => void;
  'room:kickPlayer': (playerId: string) => void;
  'room:close': () => void; // New event
  'game:useSabotage': (targetId: string, type: SabotageType) => void;
};

// Default game settings
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  gameMode: 'classic',
  maxPlayers: 4,
  cardsPerPlayer: 3,
  autoCallEnabled: false,
  autoCallIntervalMs: 5000,
  language: 'en',
  crazyMode: false,
};
