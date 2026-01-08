# Loto Game Implementation Plan

## Phase 1 – Foundations
- [x] Document UX & accessibility guardrails for senior-friendly play.
- [x] Audit host and player journeys, highlighting interaction gaps.
- [x] Refactor context & socket lifecycle with reducer-based state management.
- [x] Consolidate shared constants across engine and server for parity.

## Phase 2 – Experience Polish
- [x] Refresh global design tokens for larger typography, high contrast, and reduced-motion support.
- [x] Rebuild main menu with guided copy, forms, and accessible language toggles.
- [x] Replace host floating buttons with persistent labelled toolbar & confirmations.
- [x] Improve toast system with manual dismissal, aria-live, and resilient timers.

## Phase 3 – Quality & Tooling
- [x] Add Vitest configuration and core engine unit tests.
- [x] Strengthen ESLint with React Hooks and JSX a11y rules.
- [x] Provide runtime status announcements for connectivity and loading.
- [ ] Expand automated test coverage (sabotage logic, socket handlers, UI flows via Playwright).
- [ ] Integrate CI pipeline (GitHub Actions) enforcing lint, type-check, and tests.
- [ ] Implement audio feedback pass (cell mark, victory) respecting accessibility toggle.
