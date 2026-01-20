/**
 * Analytics Service
 * 
 * Abstraction layer for analytics to allow easy swapping of providers (Firebase, Amplitude, etc.)
 * Currently logs to console in development.
 */

type EventParams = Record<string, string | number | boolean | null | undefined>;

class AnalyticsService {
    private static instance: AnalyticsService;
    private initialized = false;

    private constructor() { }

    public static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    public init(): void {
        if (this.initialized) return;

        // Initialize real analytics provider here
        console.log('[Analytics] Initialized');
        this.initialized = true;
    }

    public logEvent(eventName: string, params?: EventParams): void {
        if (__DEV__) {
            console.log(`[Analytics] Event: ${eventName}`, params);
        }
        // Send to provider
    }

    public setUserProperty(name: string, value: string): void {
        if (__DEV__) {
            console.log(`[Analytics] User Property: ${name} = ${value}`);
        }
    }

    public setUserId(userId: string): void {
        if (__DEV__) {
            console.log(`[Analytics] User ID: ${userId}`);
        }
    }

    public logScreenView(screenName: string, screenClass?: string): void {
        if (__DEV__) {
            console.log(`[Analytics] Screen View: ${screenName}`);
        }
    }
}

export const analytics = AnalyticsService.getInstance();
