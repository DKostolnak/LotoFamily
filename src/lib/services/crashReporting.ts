/**
 * Crash Reporting Service
 * 
 * Abstraction layer for crash reporting to allow easy swapping of providers.
 * Designed to integrate with Sentry, Bugsnag, or similar services.
 * 
 * Currently provides:
 * - Console logging in development
 * - Structured error capturing
 * - User context tracking
 * - Breadcrumb trail
 * 
 * To integrate with Sentry:
 * 1. npm install @sentry/react-native
 * 2. Follow Sentry's Expo integration guide
 * 3. Replace the implementation below with Sentry methods
 */

import { FEATURES, IS_DEBUG } from '@/lib/config';
import { SENTRY } from '@/lib/config/env.config';

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
     * Initialize the crash reporting service
     * Call this early in app startup (_layout.tsx)
     */
    public init(): void {
        if (this.initialized) return;
        
        if (!FEATURES.enableCrashReporting) {
            if (IS_DEBUG) {
                console.log('[CrashReporting] Disabled for this environment');
            }
            return;
        }

        // REPLACE WHEN SENTRY CONFIGURED:
        // import * as Sentry from '@sentry/react-native';
        // Sentry.init({
        //     dsn: SENTRY.dsn,
        //     environment: APP_VARIANT,
        //     release: `${APP_VERSION}+${APP_BUILD_NUMBER}`,
        //     enableAutoSessionTracking: true,
        //     tracesSampleRate: 0.2,
        // });
        // this.provider = 'sentry';

        if (IS_DEBUG && !SENTRY.dsn) {
            console.log('[CrashReporting] No Sentry DSN configured (mock).');
        }

        this.initialized = true;
        console.log('[CrashReporting] Initialized');
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
    public captureException(
        error: Error | unknown,
        context?: ErrorContext
    ): void {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        
        if (IS_DEBUG) {
            console.error('[CrashReporting] Exception:', errorObj.message, context);
        }

        if (!FEATURES.enableCrashReporting || !this.initialized) return;

        // TODO: Send to real provider
        // Example: Sentry.captureException(errorObj, { extra: context });
    }

    /**
     * Capture a message (non-exception) event
     */
    public captureMessage(message: string, severity: Severity = 'info'): void {
        if (IS_DEBUG) {
            console.log(`[CrashReporting] ${severity.toUpperCase()}: ${message}`);
        }

        if (!FEATURES.enableCrashReporting || !this.initialized) return;

        // TODO: Send to real provider
        // Example: Sentry.captureMessage(message, severity);
    }

    /**
     * Set user context for crash reports
     */
    public setUser(user: UserContext | null): void {
        this.userContext = user;
        
        if (IS_DEBUG && user) {
            console.log('[CrashReporting] User set:', user.id);
        }

        // TODO: Set on real provider
        // Example: Sentry.setUser(user);
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

        // TODO: Add to real provider
        // Example: Sentry.addBreadcrumb(crumb);
    }

    /**
     * Set additional context tags
     */
    public setTag(key: string, value: string): void {
        if (IS_DEBUG) {
            console.log(`[CrashReporting] Tag: ${key}=${value}`);
        }

        // TODO: Set on real provider
        // Example: Sentry.setTag(key, value);
    }

    /**
     * Set extra context data
     */
    public setExtra(key: string, value: unknown): void {
        // TODO: Set on real provider
        // Example: Sentry.setExtra(key, value);
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
