# LOTO Mobile - Project Architecture

## Overview

This is an Expo React Native application for the LOTO family game, built with TypeScript and following SOLID principles and Expo best practices.

## Tech Stack

- **Framework**: Expo SDK 54 with New Architecture enabled
- **Navigation**: Expo Router v6 (file-based routing with typed routes)
- **State Management**: Zustand v5 (slice-based architecture)
- **Styling**: NativeWind v4 (TailwindCSS for React Native)
- **Networking**: Socket.io-client for multiplayer
- **Testing**: Jest + Testing Library
- **Build**: EAS Build with multiple profiles
- **Updates**: EAS Update for OTA updates

## Project Structure

```
loto-mobile/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── assets/                      # Static assets (icons, images)
├── docs/                        # Project documentation
├── src/
│   ├── app/                     # Expo Router pages
│   │   ├── _layout.tsx         # Root layout with providers
│   │   ├── index.tsx           # Home/Menu screen
│   │   └── game.tsx            # Game screen with modes
│   │
│   ├── components/              # React components
│   │   ├── common/             # Reusable UI primitives
│   │   │   ├── AnimatedModal.tsx
│   │   │   ├── WoodenButton.tsx
│   │   │   ├── WoodenCard.tsx
│   │   │   └── WoodenInput.tsx
│   │   ├── game/               # Game-specific components
│   │   │   ├── OfflineGame.tsx
│   │   │   └── OnlineGame.tsx
│   │   ├── LotoCard.tsx        # Main game card component
│   │   ├── GameHeader.tsx      # Game HUD
│   │   └── ...
│   │
│   ├── engine/                  # Game logic (pure functions)
│   │   ├── lotoCardGenerator.ts
│   │   └── __tests__/
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useLocalGame.ts     # Offline game logic
│   │   ├── useOnlineGame.ts    # Online multiplayer logic
│   │   ├── useResponsive.ts    # Screen size utilities
│   │   └── index.ts            # Barrel export
│   │
│   └── lib/                     # Core library modules
│       ├── config/             # Configuration constants
│       │   ├── env.config.ts   # Environment configuration (Expo best practices)
│       │   ├── avatar.config.ts
│       │   ├── game.config.ts
│       │   ├── theme.config.ts
│       │   ├── ui.config.ts
│       │   └── index.ts
│       │
│       ├── i18n/               # Internationalization
│       │   ├── translations.ts
│       │   ├── types.ts
│       │   └── index.ts
│       │
│       ├── services/           # External services
│       │   ├── storage.ts      # AsyncStorage wrapper
│       │   └── socket.ts       # Socket.io client
│       │
│       ├── store/              # Zustand state management
│       │   ├── slices/         # Store slices (SRP)
│       │   │   ├── playerSlice.ts
│       │   │   ├── economySlice.ts
│       │   │   ├── statsSlice.ts
│       │   │   ├── settingsSlice.ts
│       │   │   └── appSlice.ts
│       │   ├── types.ts
│       │   └── index.ts
│       │
│       ├── shop.ts             # Shop domain logic
│       ├── types.ts            # Shared TypeScript types
│       └── index.ts            # Library barrel export
│
├── app.config.ts                # Dynamic Expo configuration (TypeScript)
├── app.json                     # Static Expo configuration (fallback)
├── babel.config.js              # Babel configuration
├── eas.json                     # EAS Build/Update configuration
├── metro.config.js              # Metro bundler config
├── tailwind.config.js           # TailwindCSS config
├── tsconfig.json                # TypeScript config
├── .env.example                 # Environment variables template
└── package.json
```

## Expo Best Practices

### Configuration (app.config.ts)

We use dynamic TypeScript configuration for:
- **Environment-based variants**: Different app names/identifiers per environment
- **Type safety**: Full TypeScript support for configuration
- **Runtime access**: Use `Constants.expoConfig` (via ENV module)

```typescript
// Access via ENV module
import { ENV } from '@/lib/config';

console.log(ENV.app.version);     // '1.0.0'
console.log(ENV.isDevelopment);   // true/false
console.log(ENV.server.url);      // Server URL
```

### Environment Variables

- Prefix client-side variables with `EXPO_PUBLIC_`
- Configure per-environment in `eas.json` build profiles
- Access via `process.env.EXPO_PUBLIC_*`
- Use ENV module for typed access

```bash
# .env.local (git-ignored)
EXPO_PUBLIC_SERVER_URL=http://localhost:3000
```

### Continuous Native Generation (CNG)

- Native `ios/` and `android/` directories are git-ignored
- Generated via `npx expo prebuild` when needed
- All native configuration via plugins in app.config.ts

### EAS Build Profiles

| Profile | Purpose | Distribution |
|---------|---------|--------------|
| `development` | Dev builds with DevClient | Internal (Simulator) |
| `development-device` | Dev builds for physical iOS | Internal |
| `preview` | Testing builds | Internal |
| `production` | Store releases | Store |

### EAS Update

OTA updates configured with channels:
- `preview` channel → preview builds
- `production` channel → production builds

## Architecture Principles

### 1. Single Responsibility Principle (SRP)
- Each store slice handles one concern
- Components are split into presentational and container patterns
- Services handle specific external integrations

### 2. Open/Closed Principle (OCP)
- Add new themes/skins by extending config objects
- Add new features via new slices, not modifying existing ones

### 3. Dependency Inversion (DIP)
- Components depend on store interface, not implementation
- Services are abstracted behind clean interfaces

### 4. DRY (Don't Repeat Yourself)
- Centralized config eliminates duplicate constants
- Shared types prevent definition duplication

## Key Conventions

### File Naming
- Components: PascalCase (`LotoCard.tsx`)
- Hooks: camelCase with `use` prefix (`useLocalGame.ts`)
- Config: kebab-case with `.config.ts` suffix
- Types: Types live in `.ts` files or `types.ts`

### Import Aliases
```typescript
// Use @ alias for src directory
import { useGameStore } from '@/lib/store';
import { LotoCard } from '@/components/LotoCard';
```

### Styling
- Use NativeWind/TailwindCSS classes when possible
- Use config constants for repeated values
- Prefix style constants with `k_` (e.g., `k_colorGold`)

## Scripts Reference

### Development
```bash
npm start              # Start Expo dev server
npm run start:clear    # Start with cache cleared
npm run start:tunnel   # Start with tunnel (for remote testing)
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on web
```

### Quality Assurance
```bash
npm run lint           # ESLint check
npm run lint:fix       # ESLint with auto-fix
npm run typecheck      # TypeScript check
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
npm run validate       # Run all checks (typecheck + lint + test)
npm run doctor         # Run Expo doctor health check
```

### Native Builds (Local)
```bash
npm run prebuild           # Generate native projects
npm run prebuild:clean     # Clean regenerate native projects
npm run prebuild:android   # Generate Android only
npm run prebuild:ios       # Generate iOS only
npm run run:android        # Build and run Android locally
npm run run:ios            # Build and run iOS locally
```

### EAS Builds (Cloud)
```bash
npm run build:dev          # Development builds (both platforms)
npm run build:dev:android  # Development build (Android)
npm run build:dev:ios      # Development build (iOS simulator)
npm run build:dev:device   # Development build (iOS device)
npm run build:preview      # Preview builds (both platforms)
npm run build:android      # Production build (Android)
npm run build:ios          # Production build (iOS)
```

### Store Submission
```bash
npm run submit:android     # Submit to Google Play
npm run submit:ios         # Submit to App Store
```

### OTA Updates
```bash
npm run update:preview "message"    # Publish to preview channel
npm run update:production "message" # Publish to production channel
npm run eas:configure               # Configure EAS Update
```

## Adding New Features

### New Shop Item
1. Add to appropriate array in `src/lib/shop.ts`
2. Add color config to `src/lib/config/theme.config.ts` if theme/skin

### New Translation
1. Add key to `TranslationKeys` interface in `src/lib/i18n/types.ts`
2. Add translations to all languages in `src/lib/i18n/translations.ts`

### New Store Feature
1. Create new slice in `src/lib/store/slices/`
2. Add types to `src/lib/store/types.ts`
3. Compose into main store in `src/lib/store/index.ts`
4. Create selector hook if needed

### New Environment Variable
1. Add to `.env.example` with documentation
2. Add to `eas.json` for each build profile
3. Access via `process.env.EXPO_PUBLIC_*` or update `env.config.ts`

## Deployment

### Development Build
```bash
# For simulator/emulator
npm run build:dev

# For physical iOS device
npm run build:dev:device
```

### Preview Build (Internal Testing)
```bash
npm run build:preview
```

### Production Build
```bash
npm run build:android
npm run build:ios
```

### OTA Updates
```bash
# Push update to preview builds
npm run update:preview "Fix: button alignment"

# Push update to production builds  
npm run update:production "Fix: critical bug"
```
