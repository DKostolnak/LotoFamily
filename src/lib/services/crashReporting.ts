/**
 * Crash Reporting Service — Sentry via @sentry/react-native.
 *
 * Behavior by environment:
 *  - EXPO_PUBLIC_SENTRY_DSN set + production/preview build → real Sentry
 *    (crashes, JS errors, breadcrumbs, user context, sessions).
 *  - No DSN / dev build / Expo Go / Jest → mock provider that logs to the
 *    console in debug builds.
 *
 * Setup (before production release):
 *  1. Create a project at sentry.io → copy the DSN.
 *  2. Set EXPO_PUBLIC_SENTRY_DSN (see .env.example) locally and in EAS.
 *  3. Optional but recommended: set SENTRY_ORG + SENTRY_PROJECT +
 *     SENTRY_AUTH_TOKEN in EAS so the config plugin uploads source maps
 *     (readable stack traces). See app.config.ts.
 *
 * Public API kept stable so call sites (`crashReporting.captureException(...)`)
 * do not change.
 */

import { FEATURES, IS_DEBUG } from '@/lib/config';
import { APP_VARIANT, APP_VERSION, APP_BUILD_NUMBER, SENTRY } from '@/lib/config/env.config';

type Severity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

type CrashProvider = 'sentry' | 'mock';

interface ErrorContext {
    [key: string]: string | number | boolean | null | undefined;
}

interface UserContext {
    id?: string;
    name?: string;
    email?: string;
}

interface Breadcrumb {
    category: string;
    message: string;
    data?: Record<string, unknown>;
    level?: Severity;
    timestamp?: number;
}

// Lazy module load — keeps Expo Go / Jest safe (no native binding there).
type SentryModule = typeof import('@sentry/react-native');
let Sentry: SentryModule | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Sentry = require('@sentry/react-native');
} catch {
    Sentry = null;
}

class CrashReportingService {
    private static instance: CrashReportingService;
    private initialized = false;
    private provider: CrashProvider = 'mock';
    private userContext: UserContext | null = null;
    private breadcrumbs: Breadcrumb[] = [];
    private readonly maxBreadcrumbs = 50;

    private constructor() {}

    public static getInstance(): CrashReportingService {
        if (!CrashReportingService.instance) {
            CrashReportingService.instance = new CrashReportingService();
        }
        return CrashReportingService.instance;
    }

    /**
     * Initialize the crash reporting service.
     * Call this early in app startup (_layout.tsx). Never throws.
     */
    public init(): void {
        if (this.initialized) return;
        this.initialized = true;

        if (!FEATURES.enableCrashReporting) {
            if (IS_DEBUG) {
                console.log('[CrashReporting] Disabled for this environment');
            }
            return;
        }

        if (!Sentry || !SENTRY.dsn) {
            if (IS_DEBUG) {
                console.log('[CrashReporting] No Sentry DSN / module configured (mock).');
            }
            return;
        }

        try {
            Sentry.init({
                dsn: SENTRY.dsn,
                environment: APP_VARIANT,
                release: `${APP_VERSION}+${APP_BUILD_NUMBER}`,
                // 20% of transactions — enough signal without eating quota.
                tracesSampleRate: 0.2,
                enableAutoSessionTracking: true,
                maxBreadcrumbs: this.maxBreadcrumbs,
            });
            this.provider = 'sentry';
            if (this.userContext) Sentry.setUser(this.userContext);
        } catch (e) {
            this.provider = 'mock';
            if (IS_DEBUG) console.warn('[CrashReporting] Sentry init failed:', e);
        }
    }

    /**
     * Read-only provider name (useful for analytics tagging).
     */
    public getProvider(): CrashProvider {
        return this.provider;
    }

    /**
     * Capture an exception and send to crash reporting service
     */
    public captureException(error: Error | unknown, context?: ErrorContext): void {
        const errorObj = error instanceof Error ? error : new Error(String(error));

        if (IS_DEBUG) {
            console.error('[CrashReporting] Exception:', errorObj.message, context);
        }

        if (this.provider === 'sentry' && Sentry) {
            Sentry.captureException(errorObj, { extra: context });
        }
    }

    /**
     * Capture a message (non-exception) event
     */
    public captureMessage(message: string, severity: Severity = 'info'): void {
        if (IS_DEBUG) {
            console.log(`[CrashReporting] ${severity.toUpperCase()}: ${message}`);
        }

        if (this.provider === 'sentry' && Sentry) {
            Sentry.captureMessage(message, severity);
        }
    }

    /**
     * Set user context for crash reports
     */
    public setUser(user: UserContext | null): void {
        this.userContext = user;

        if (IS_DEBUG && user) {
            console.log('[CrashReporting] User set:', user.id);
        }

        if (this.provider === 'sentry' && Sentry) {
            Sentry.setUser(user);
        }
    }

    /**
     * Add a breadcrumb to track user journey
     */
    public addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
        const crumb: Breadcrumb = {
            ...breadcrumb,
            timestamp: Date.now(),
        };

        this.breadcrumbs.push(crumb);

        // Keep breadcrumb list bounded
        if (this.breadcrumbs.length > this.maxBreadcrumbs) {
            this.breadcrumbs.shift();
        }

        if (IS_DEBUG) {
            console.log(`[CrashReporting] Breadcrumb: ${breadcrumb.category} - ${breadcrumb.message}`);
        }

        if (this.provider === 'sentry' && Sentry) {
            Sentry.addBreadcrumb({
                category: crumb.category,
                message: crumb.message,
                data: crumb.data,
                level: crumb.level ?? 'info',
            });
        }
    }

    /**
     * Set additional context tags
     */
    public setTag(key: string, value: string): void {
        if (IS_DEBUG) {
            console.log(`[CrashReporting] Tag: ${key}=${value}`);
        }

        if (this.provider === 'sentry' && Sentry) {
            Sentry.setTag(key, value);
        }
    }

    /**
     * Set extra context data
     */
    public setExtra(key: string, value: unknown): void {
        if (this.provider === 'sentry' && Sentry) {
            Sentry.setExtra(key, value);
        }
    }

    /**
     * Convenience shortcut for `addBreadcrumb({ category, message, data })`.
     */
    public logBreadcrumb(
        category: string,
        message: string,
        data?: Record<string, unknown>
    ): void {
        this.addBreadcrumb({ category, message, data, level: 'info' });
    }

    /**
     * Wrap an async function so that any thrown / rejected error is captured
     * automatically (and re-thrown so call-site behavior is unchanged).
     */
    public wrapAsync<T extends (...args: unknown[]) => Promise<unknown>>(
        fn: T,
        context?: ErrorContext
    ): T {
        return (async (...args: Parameters<T>) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.captureException(error, context);
                throw error;
            }
        }) as T;
    }

    /**
     * Create a wrapped function that reports errors
     */
    public wrap<T extends (...args: unknown[]) => unknown>(
        fn: T,
        context?: ErrorContext
    ): T {
        return ((...args: Parameters<T>) => {
            try {
                const result = fn(...args);

                // Handle promises
                if (result instanceof Promise) {
                    return result.catch((error) => {
                        this.captureException(error, context);
                        throw error;
                    });
                }

                return result;
            } catch (error) {
                this.captureException(error, context);
                throw error;
            }
        }) as T;
    }
}

export const crashReporting = CrashReportingService.getInstance();

// Convenience exports
export const captureException = crashReporting.captureException.bind(crashReporting);
export const captureMessage = crashReporting.captureMessage.bind(crashReporting);
export const addBreadcrumb = crashReporting.addBreadcrumb.bind(crashReporting);
