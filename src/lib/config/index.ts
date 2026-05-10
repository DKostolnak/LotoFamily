/**
 * Configuration Module Barrel Export
 * 
 * Centralized access to all configuration values following SOLID principles.
 * 
 * @module config
 */

// Environment configuration (Expo best practices)
export {
    APP_VARIANT,
    IS_DEVELOPMENT,
    IS_PREVIEW,
    IS_PRODUCTION,
    IS_DEBUG,
    APP_VERSION,
    APP_BUILD_NUMBER,
    APP_NAME,
    APP_SLUG,
    SERVER_URL,
    FEATURES,
    EAS_PROJECT_ID,
    RUNTIME_VERSION,
    APP_STORE_ID,
    PLAY_STORE_ID,
    PRIVACY_POLICY_URL,
    TERMS_OF_SERVICE_URL,
    SUPPORT_EMAIL,
    ENV,
} from './env.config';

// Theme & styling
export * from './theme.config';

// Game mechanics
export * from './game.config';

// User assets
export * from './avatar.config';

// UI constants
export * from './ui.config';

// Design system tokens (typography, spacing, button sizing)
export * from './typography.config';

// Season / Battle Pass
export * from './season.config';

// ============================================================================
// Backward compatibility aliases (formerly in lib/constants.ts)
// ============================================================================
import { SERVER_URL } from './env.config';
import { SCORING, ROOM_CONFIG, TIMING } from './game.config';

/** @deprecated Use `SERVER_URL` instead */
export const k_serverUrl = SERVER_URL;

/** @deprecated Use `SCORING` instead */
export const POINTS = SCORING;

/** @deprecated Use `ROOM_CONFIG.CODE_CHARS` instead */
export const ROOM_CODE_CHARS = ROOM_CONFIG.CODE_CHARS;

/** @deprecated Use `ROOM_CONFIG.CODE_LENGTH` instead */
export const ROOM_CODE_LENGTH = ROOM_CONFIG.CODE_LENGTH;

/** @deprecated Use `TIMING.AUTO_CALL` instead */
export const AUTO_CALL_INTERVALS = TIMING.AUTO_CALL;
