# Modular Game Architecture

This directory contains a reusable core for building 2D games on mobile.

## Structure

### `engine/`

Contains base classes for game logic.

- **`BaseGameEngine.ts`**: Abstract class providing:
  - Player lifecycle management.
  - State synchronization patterns.
  - Event subscriptions.

The engine layer is transport-agnostic. It uses generic `NetworkMessage` /
`NetworkPlayer` types defined in `src/lib/types.ts` so the same logic can be
driven by any transport (e.g. Socket.io for the online mode, or a purely
local in-process driver for offline / single-player).

## How to build a new game

1. **Define your State**: Create a state interface for your new game.
2. **Extend `BaseGameEngine`**:

   ```typescript
   class MyNewGameEngine extends BaseGameEngine<MyState> {
       initialize(config) { /* set initial state */ }
       handleMessage(msg) { /* logic for game moves */ }
   }
   ```

3. **Drive the engine** from a hook or context that owns the transport
   (e.g. socket events) and forwards them to `handleMessage`.

## Principles

- **Host-Authoritative**: The host runs the `GameEngine`. All logic
  (validating moves, calculating scores) happens on the host. Clients
  send "intention" messages (e.g., `MOVE_PIECE`) and receive the
  validated game state.
- **Transport-Agnostic**: The engine has no knowledge of the network
  layer. All wire formats are abstracted behind `NetworkMessage`.
