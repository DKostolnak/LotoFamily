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
