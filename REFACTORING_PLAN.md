# Loto Game Refactoring Plan

## Status: ✅ PHASES 1-5 COMPLETE

---

## Completed Changes

### Phase 1: Component Extraction ✅
- Created `ConfirmModal` - Reusable confirmation dialog with wooden theme
- Created `WoodenButton` - Configurable button component with size/variant support
- Refactored `GameHeader` - Clean structure, extracted sub-components, proper JSDoc
- Exported components via barrel file in `components/common/index.ts`

### Phase 2: Service Layer ✅
- Created `StorageService` (`lib/services/storage.ts`)
  - Type-safe localStorage wrapper
  - Centralized `STORAGE_KEYS` constant
  - Player profile helpers (getPlayerAvatar, setPlayerName, etc.)
  - `ensurePlayerToken()` for session management
- Created service barrel export (`lib/services/index.ts`)

### Phase 3: Type System Improvements ✅
- Enhanced `lib/types.ts` with comprehensive JSDoc
- Added game constants (LOTO_MAX_NUMBER, CARD_ROWS, CARD_COLUMNS)
- Better organization by domain (Card, Player, Game, Socket)

### Phase 4: State Management Improvements ✅
- Enhanced `gameReducer.ts` with:
  - Proper TypeScript types
  - Selector functions (selectIsHost, selectIsConnected, etc.)
  - Better organization with section comments
- Refactored `GameContext.tsx`:
  - Uses new storage service
  - Cleaner section organization  
  - Proper JSDoc documentation
  - Removed deprecated patterns

### Phase 5: Hook Extraction ✅
- Created `useGameSocket` hook for future modularization
- Separated socket connection logic (ready for further decoupling)

### Additional Improvements ✅
- Updated `MainMenu.tsx` to use storage service
- Updated `LotoCard.tsx` with proper JSDoc and direct audio imports
- Cleaned up audio imports across components

---

## Architecture Overview

```
src/
├── app/                    # Next.js app router
│   ├── page.tsx           # Main app entry
│   └── globals.css        # Global styles
│
├── components/
│   ├── common/            # Shared UI components
│   │   ├── index.ts       # Barrel export
│   │   ├── Button.tsx
│   │   ├── WoodenButton.tsx
│   │   ├── Modal.tsx
│   │   ├── ConfirmModal.tsx
│   │   └── Skeleton.tsx
│   ├── GameHeader.tsx     # Game HUD
│   ├── LotoCard.tsx       # Card display
│   ├── MainMenu.tsx       # Entry screen
│   ├── PlayerGameScreen.tsx
│   ├── WaitingLobby.tsx
│   └── ...
│
├── hooks/
│   ├── useGameSocket.ts   # Socket management hook
│   ├── useHaptics.ts
│   ├── useWakeLock.ts
│   └── ...
│
├── lib/
│   ├── types.ts           # All TypeScript types
│   ├── translations.ts    # i18n
│   ├── audio.ts           # Audio service
│   ├── GameContext.tsx    # Game state provider
│   ├── services/
│   │   ├── index.ts       # Barrel export
│   │   └── storage.ts     # Storage service
│   └── state/
│       └── gameReducer.ts # Client state reducer
│
├── engine/                 # Game logic
│   ├── gameEngine.ts
│   ├── gameModes.ts
│   └── lotoCardGenerator.ts
│
├── server/                 # Socket.io server
│   ├── handlers/
│   │   ├── gameHandlers.ts
│   │   └── roomHandlers.ts
│   └── store.ts
│
└── styles/
    └── lotoCard.css
```

---

## Naming Conventions

### Files
- Components: PascalCase (`GameHeader.tsx`)
- Hooks: camelCase with `use` prefix (`useGameSocket.ts`)
- Services: camelCase (`storage.ts`)
- Types: camelCase (`types.ts`)

### Variables
- Private members: `m_` prefix (`m_isMuted`)
- Static members: `s_` prefix
- Constants: `UPPER_SNAKE_CASE`
- Booleans: `is`/`has`/`can` prefix

### Functions
- Event handlers: `handle` prefix (`handleCellClick`)
- Callbacks: verb-based (`onCellClick`, `onError`)
- Getters: `get` prefix or `select` for selectors

---

## SOLID Principles Applied

### Single Responsibility
- `ConfirmModal` handles only confirmation UI
- `storageService` handles only localStorage
- `GameContext` handles only state distribution

### Open/Closed
- Components accept variants via props
- Services use interfaces for extension

### Liskov Substitution
- All button variants behave consistently
- Modal variants maintain same API

### Interface Segregation
- `GameContextType` exposes only needed methods
- `IStorageService` focuses on storage operations

### Dependency Inversion
- Components depend on abstractions (services)
- Storage accessed via service, not directly

---

## Future Improvements (Optional)

1. **Further GameContext splitting** - Extract socket logic into separate provider
2. **Component library** - Move common components to separate package
3. **E2E Tests** - Add Playwright tests for critical flows
4. **Performance monitoring** - Add React DevTools markers
5. **Error boundaries** - Add per-section error boundaries
6. **Lazy loading** - Split heavy components with dynamic imports

---

## Testing Checklist

After each change, verify:
- [ ] `npm run build` passes
- [ ] `npm run dev` works
- [ ] Game can be created and joined
- [ ] Cards display correctly
- [ ] Numbers can be marked
- [ ] Sounds work
- [ ] Modal appears correctly
