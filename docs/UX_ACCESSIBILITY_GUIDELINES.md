# UX & Accessibility Targets

## Audience Considerations
- Primary audience includes older adults and mixed-age families joining casual sessions.
- Design for imperfect vision, slower reaction time, and limited tech familiarity.
- Provide supportive feedback for both host and players with minimal cognitive load.

## Experience Principles
1. **Clarity First** – Numbers and controls must remain legible at 2.5 m distance on a tablet or laptop.
2. **Effortless Flow** – Every primary action needs obvious affordance and succinct copy.
3. **Reassuring Feedback** – Reflect the game state with redundant cues (color + motion + text).
4. **Inclusive by Default** – Accessible without fine motor precision, color-only cues, or audio reliance.

## Visual Targets
- Minimum body font size: 18 px; headings 28–40 px; called numbers ≥ 64 px.
- Use `rem` typography scale: `1rem` (18 px) base, `1.5rem`, `2.25rem`, `3rem`, `4rem` for hierarchy.
- Maintain line height ≥ 1.4 for paragraphs, 1.2 for numerals.
- Adopt high-contrast palette meeting WCAG AA (contrast ratio ≥ 4.5:1, ≥ 3:1 for large text).
- Provide alternative high-contrast mode and gentle theme by toggled tokens.
- Buttons: minimum touch area 56 × 56 px with 12 px spacing.

## Interaction Targets
- Navigation accessible by keyboard (Tab / Shift+Tab) with visible focus rings ≥ 3 px.
- Ensure ARIA labels for interactive controls and announce state changes via ARIA live regions.
- Support screen readers announcing called numbers, new joins, and sabotage effects.
- Provide optional confirmation for destructive host actions (kick, close room).
- Reduce motion preferences via `prefers-reduced-motion`; fall back to fade transitions.

## Performance Goals
- Time-to-interactive under 3 seconds on mid-tier tablet (Lighthouse ~80+).
- Core interactions (mark cell, call number) respond within 100 ms from input to feedback.
- Limit bundle per route under 200 KB gzipped; defer confetti/audio until needed.
- Handle spotty connectivity with resilient socket reconnects and queued UI feedback.

## Content & Localization
- Provide simple language variants (EN, SK, UK, RU) featuring short phrases (<30 chars where possible).
- Avoid jargon; prefer descriptive icons with text labels.
- Ensure layout gracefully handles translated strings up to 30% longer.

## Testing & Validation
- Manual accessibility audit with screen reader (VoiceOver) and keyboard only.
- Automated checks: ESLint `jsx-a11y`, Playwright axe scans, jest unit coverage for logic.
- Gather hallway feedback from target users to iterate on clarity and comfort.
