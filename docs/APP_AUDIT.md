# Application Audit

## Host Journey
- **Entry friction**: Host controls hide behind FAB; seniors may miss expandable menu. Need persistent toolbar with labelled buttons and textual descriptions.
- **Room creation**: Custom code input lacks validation feedback beyond text; enlarge input and provide suggestions. Missing confirmation after creation.
- **Game management**: Hard confirm using `confirm()` blocking dialog causing inconsistent styling and unannounced focus. Replace with accessible modal.
- **Caller board**: Modal triggered via `document.getElementById`; bypasses React state & accessibility patterns.

## Player Journey
- **Join flow**: Room code requires 6 characters only, yet custom codes allow 8. Improve instructions, auto-advance, and allow paste normalization.
- **Card interaction**: No explicit feedback when inputs disabled (freeze). Need overlay with readable text and timer countdown.
- **Sabotage effects**: Visual cues rely on color/animation; add textual toasts and screen reader announcements.
- **Error handling**: Error toasts disappear after timeout without focus management. Provide manual dismissal and focus if blocking action.

## UI & Styling
- Tailwind + custom CSS mix lacks central tokens; inconsistent colors across components.
- Buttons share classes but inline styles override spacing/size; refactor to design system using CSS variables.
- Layout uses fixed pixel heights/positions; ensure responsive scaling, safe-area support, orientation changes.
- Missing prefers-reduced-motion handling for animations (confetti, screen shake).

## State & Architecture
- `GameContext` handles many responsibilities: socket lifecycle, persistence, business logic. Needs segregation into hooks/services.
- Components read entire `gameState` causing rerenders; memoize selectors or use context slices.
- Server `store` uses shared map without eviction on interval failure; consider TTL + watchers.
- Handlers rely on socket id equality; central auth/token mapping would stabilize reconnection.
- Client/server duplication of constants (POINTS) currently inconsistent (engine vs constants).

## Code Quality
- Minimal testing; no unit coverage for engine or handlers. Introduce Jest/vitest for pure logic, Playwright for flows.
- ESLint config default, missing `jsx-a11y`, `react-hooks`, or custom rules. Add Prettier integration.
- No CI pipeline; add GitHub Actions/Render build guard.

## Performance
- Dynamic imports help but base bundle still heavy; audit components for unused features.
- Assets (audio, confetti) loaded when component mounts regardless of need; gate behind state.
- Server uses `createServer(handler)` but lacks compression/caching; add Next middleware or use Next standalone.
- No PWA offline/low-bandwidth considerations beyond manifest; ensure prefetch minimal.

## Localization
- Translations stored statically; ensure fallback to English when missing key. Provide translation tooling.
- RTL languages unsupported; check layout compatibility or restrict list explicitly.

## Security & Stability
- Room codes stored in localStorage indefinitely; expire when leaving.
- No rate limiting on sabotage/mark events; add server-side throttling.
- Host migration logic picks first player indiscriminately; ensure willing host and inform players.
