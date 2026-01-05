# Loto Game Implementation Plan

- [x] **Visual Feedback Enhancements**
  - [x] Update `LotoCard` to receive game context (called numbers).
  - [x] Implement "Missed Number" visual state (called but not marked).
  - [x] Implement "Mistaken Mark" visual state (marked but not called).
  - [x] Improve "Correctly Marked" visual state.
  - [x] Add animations for new marks and state changes.

- [x] **Game Logic Overhaul**
  - [x] Update `types.ts` to include `flats` in `Player` state.
  - [x] Implement `checkRowCompletion` logic.
  - [x] Add `game:claimFlat` socket event handler.
  - [x] Update `PlayerList` to show flat indicators (Green/Bar).
  - [x] Add "Claim Flat" button to UI.

- [x] **Visual Feedback Enhancements**
  - [x] Update `LotoCard` "Missed" state to use Red Cross.
  - [x] Fix "Missed" state logic (should persist?). For now, stick to context-based checks.

- [x] **Bonus System**
  - [x] Add Bonus types (+1, +5, X, Magnifier).
  - [x] Implement Bonus inventory in `Player` state.
  - [x] Add UI to use Bonuses.
  - [x] Implement Bonus logic in engine.

- [ ] **Sound Effects**
  - [x] Add sound for calling a number.
  - [ ] Add sound for marking a cell.
  - [ ] Add sound for winning (Loto!).

- [ ] **UI Polish**
  - [x] Enhance Number Medallion look.
  - [ ] Improve Grid Layout on mobile.
  - [ ] Add transitions for showing/hiding screens.

- [ ] **Gameplay Features**
  - [ ] Implement strict marking mode (cannot mark uncalled numbers).
  - [ ] Add "Last 5 Calls" history with better visuals.
