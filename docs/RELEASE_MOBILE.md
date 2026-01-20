# Mobile Release Guide (Expo)

This app is an Expo Router + React Native project.

## 1) Configure the multiplayer server

- Copy `.env.example` -> `.env` and set:
  - `EXPO_PUBLIC_SERVER_URL=https://YOUR-SOCKET-SERVER`

Notes:
- `EXPO_PUBLIC_*` variables are embedded into the client bundle. Do not put secrets here.
- For Android emulator, host machine is typically `http://10.0.2.2:3000`.

## 2) Quality gates (run locally)

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run doctor`

## 3) Build profiles (EAS)

- `eas.json` defines:
  - `development`: dev client for device testing
  - `preview`: internal distribution
  - `production`: store builds with auto-increment

Commands:
- Android prod build: `npm run build:android`
- iOS prod build: `npm run build:ios`

## 4) Versioning

- App version: `app.json -> expo.version`
- iOS build number: `app.json -> expo.ios.buildNumber` (string)
- Android version code: `app.json -> expo.android.versionCode` (int)
- EAS `production.autoIncrement` increments platform build numbers automatically.

## 5) Store checklist (high level)

Apple App Store:
- App name, subtitle, description, keywords
- Screenshots (all required sizes)
- Privacy details (data collection, tracking)
- Support URL + Privacy Policy URL

Google Play:
- Store listing (short/long description)
- Screenshots + feature graphic
- Data safety form
- Content rating questionnaire

## 6) Operational checklist

- Confirm the production `EXPO_PUBLIC_SERVER_URL` points at a stable server.
- Ensure server supports TLS (`https`) and WebSocket upgrades.
- Validate reconnect behavior on flaky networks (airplane mode -> restore).
- Validate accessibility (font scaling, VoiceOver/TalkBack).
