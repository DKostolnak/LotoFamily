# Development Workflow

This guide covers the development workflow and conventions for the Loto game project.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The game runs on `http://localhost:3000` by default.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## Code Style

### TypeScript Conventions
- Use strict mode (`"strict": true`)
- Prefer `const` over `let`
- Use meaningful names (no abbreviations)
- Add JSDoc comments for public APIs

### Component Structure
```typescript
'use client';

import React, { memo, useCallback } from 'react';

interface MyComponentProps {
    // Props definition
}

function MyComponent({ prop }: MyComponentProps) {
    // Hooks first
    const handleClick = useCallback(() => {
        // Implementation
    }, []);
    
    // JSX return
    return (
        <div>
            {/* Content */}
        </div>
    );
}

export default memo(MyComponent);
```

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `use*.ts`
- Utilities: `camelCase.ts`
- Tests: `*.test.ts(x)`

## Pre-commit Checks

Before committing, ensure:

1. **TypeScript compiles**: `npx tsc --noEmit`
2. **Tests pass**: `npm test -- --run`
3. **Lint passes**: `npm run lint`

## Local Multiplayer Testing

1. Start the server: `npm run dev`
2. Open browser tab 1 → Create game
3. Note the room code
4. Open browser tab 2 → Join with room code
5. Test gameplay flow

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

The app is configured for Render deployment via `render.yaml`.
