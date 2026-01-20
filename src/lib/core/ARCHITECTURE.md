# 🎮 Modular Game Architecture

This directory contains a reusable core for building multiplayer 2D games on mobile using Peer-to-Peer (P2P) and socket-based networking.

## 📁 Structure

### `network/`

Contains modular networking providers.

- **`types.ts`**: Generic interfaces for messages and providers.
- **`P2PProvider.ts`**: Reusable WebRTC implementation via PeerJS. Handles message relaying, broadcasting, and host/client logic.

### `engine/`

Contains base classes for game logic.

- **`BaseGameEngine.ts`**: Abstract class providing:
  - Player lifecycle management.
  - State synchronization patterns.
  - Event subscriptions.

## 🚀 How to build a new game

1. **Define your State**: Create a state interface for your new game.
2. **Extend `BaseGameEngine`**:

   ```typescript
   class MyNewGameEngine extends BaseGameEngine<MyState> {
       initialize(config) { /* set initial state */ }
       handleMessage(msg) { /* logic for game moves */ }
   }
   ```

3. **Use `P2PProvider`**:
   Integrate with a React Context or Hook to pipe network messages into your engine.

## 📡 Networking Principles

- **Host-Authoritative**: The player who starts the room runs the `GameEngine`. All logic (validating moves, calculating scores) happens on the host. clients only send "intention" messages (e.g., `MOVE_PIECE`) and receive the validated `GAME_STATE`.
- **Broadcast System**: The `P2PProvider` automatically relays messages from clients to all other peers if the current node is the host.
- **Offline First**: Designed to work on local WiFi networks without external internet access (requires a reachable signaling server or direct IP pairing if using custom signaling).
