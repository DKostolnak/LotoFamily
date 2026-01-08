# Loto Game Refactoring Plan

## Executive Summary

After auditing the codebase, I've identified several areas that need improvement to align with SOLID principles, clean code standards, and industry best practices. This document outlines the refactoring plan with prioritized phases.

---

## Current State Analysis

### Strengths ✅
1. **Clear domain separation** - Types are well-organized in `types.ts`
2. **Component memoization** - Good use of `memo()` for performance
3. **Internationalization** - Proper translation system in place
4. **Socket architecture** - Clean event-based communication

### Issues Identified 🔴

#### 1. **Single Responsibility Principle (SRP) Violations**
- `GameHeader.tsx` (322 lines) - Handles header UI, modal rendering, sound toggle, leave confirmation
- `GameContext.tsx` (438 lines) - Manages socket, state, storage, reconnection, ALL game actions
- `MainMenu.tsx` (337 lines) - Form validation, language handling, room code logic, avatar picking

#### 2. **Open/Closed Principle Violations**
- Game mode logic hardcoded in multiple places
- Crazy mode shuffle logic embedded in `handleMarkCell`

#### 3. **Dependency Inversion Violations**
- Direct `localStorage` access scattered across components
- `socket.io` tightly coupled to `GameContext`

#### 4. **Code Duplication**
- Audio playback logic duplicated between `GameAudioPlayer.tsx` and `audio.ts`
- Leave game confirmation copied across components
- Wooden button styling repeated in multiple places

#### 5. **Naming Inconsistencies**
- Mixed casing: `playClickSound` vs `playCellMarkSound`
- Unclear names: `t` for translations, `cn` for called numbers
- Inconsistent file naming: some use camelCase, some PascalCase

#### 6. **Component Organization**
- 27 components in a flat directory structure
- No clear grouping by feature/domain

---

## Refactoring Phases

### Phase 1: Directory Restructuring (Low Risk, High Impact)
Reorganize components by domain:

```
src/
├── components/
│   ├── common/           # Shared UI primitives
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Avatar/
│   │   └── Card/
│   ├── game/             # Game-specific components
│   │   ├── GameHeader/
│   │   ├── GameCard/
│   │   ├── GameProgress/
│   │   └── NumberDisplay/
│   ├── lobby/            # Pre-game screens
│   │   ├── MainMenu/
│   │   ├── WaitingLobby/
│   │   └── PlayerList/
│   └── modals/           # All modal components
│       ├── LeaderboardModal/
│       ├── PlayerStatsModal/
│       └── ConfirmModal/
├── hooks/                # Custom hooks
├── services/             # External service integrations
│   ├── audio/
│   ├── storage/
│   └── socket/
├── state/                # State management
│   ├── gameReducer.ts
│   └── GameProvider.tsx
├── types/                # Type definitions
│   ├── game.types.ts
│   ├── player.types.ts
│   └── socket.types.ts
└── utils/                # Pure utility functions
```

### Phase 2: Extract Shared Components (Medium Risk)

#### 2.1 Create `ConfirmModal` component
Extract the leave confirmation modal into a reusable component:
```typescript
interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}
```

#### 2.2 Create `WoodenButton` component
Extract the repeated wooden-themed button styling:
```typescript
interface WoodenButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'secondary' | 'danger';
    icon?: React.ReactNode;
}
```

### Phase 3: Split Large Files (Medium Risk)

#### 3.1 Split `GameContext.tsx`
Break into:
- `GameProvider.tsx` - Context provider with minimal logic
- `useGameActions.ts` - Hook for game actions (start, pause, etc.)
- `useGameSocket.ts` - Socket connection management
- `useGameStorage.ts` - Local storage operations

#### 3.2 Split `GameHeader.tsx`
Break into:
- `GameHeader.tsx` - Layout and composition only
- `HeaderControls.tsx` - Back/Sound buttons
- `LeaveConfirmModal.tsx` - Leave confirmation logic

### Phase 4: Service Layer Extraction (High Impact)

#### 4.1 Audio Service
```typescript
// services/audio/AudioService.ts
interface IAudioService {
    playClick(): void;
    playCellMark(): void;
    playBonus(): void;
    playError(): void;
    playWin(): void;
    setMuted(muted: boolean): void;
    isMuted(): boolean;
}

class AudioService implements IAudioService {
    private static instance: AudioService;
    private m_isMuted: boolean = false;
    private m_audioContext: AudioContext | null = null;
    
    // ... implementation
}
```

#### 4.2 Storage Service
```typescript
// services/storage/StorageService.ts
interface IStorageService {
    get<T>(key: string): T | null;
    set<T>(key: string, value: T): void;
    remove(key: string): void;
    clear(): void;
}
```

### Phase 5: Type System Improvements

#### 5.1 Separate type files by domain
```
types/
├── card.types.ts      # LotoCell, LotoCard, LotoCardGrid
├── player.types.ts    # Player, PlayerStats
├── game.types.ts      # GameState, GameSettings, GamePhase
├── socket.types.ts    # Socket events
└── index.ts           # Re-exports
```

#### 5.2 Add branded types for IDs
```typescript
type PlayerId = string & { readonly brand: unique symbol };
type RoomId = string & { readonly brand: unique symbol };
type CardId = string & { readonly brand: unique symbol };
```

### Phase 6: Naming Standardization

#### 6.1 Function naming conventions
- Event handlers: `handleXxx` (e.g., `handleCellClick`)
- State setters: `setXxx` (e.g., `setGameState`)
- Boolean getters: `isXxx`, `hasXxx`, `canXxx`
- Async operations: `xxxAsync` suffix optional for clarity

#### 6.2 Variable naming conventions
- Use full words: `translations` not `t`
- Descriptive arrays: `calledNumberValues` ✓ (already good)
- Avoid abbreviations unless universally understood

---

## Implementation Priority

| Phase | Risk | Impact | Time Est. | Dependencies |
|-------|------|--------|-----------|--------------|
| 1. Directory Restructuring | Low | High | 2 hours | None |
| 2. Extract Shared Components | Medium | Medium | 3 hours | Phase 1 |
| 3. Split Large Files | Medium | High | 4 hours | Phase 2 |
| 4. Service Layer | Medium | High | 3 hours | Phase 3 |
| 5. Type System | Low | Medium | 1 hour | None |
| 6. Naming Standards | Low | Medium | 2 hours | All |

**Total Estimated Time: 15 hours**

---

## Immediate Quick Wins (Can Do Now)

1. ✅ Rename `t` to `translations` throughout components
2. ✅ Create `ConfirmModal` component and use in GameHeader
3. ✅ Create `WoodenButton` component for consistent styling
4. ✅ Move audio logic to a proper service with interface
5. ✅ Add JSDoc comments to public functions
6. ✅ Clean up unused imports

---

## Testing Strategy

- Ensure existing tests pass after each phase
- Add tests for extracted services
- Visual regression testing for UI components

---

## Notes

This refactoring should be done incrementally, one phase at a time, with testing between each phase. The game should remain fully functional throughout the process.
