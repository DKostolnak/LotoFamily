/**
 * Notifications Service
 *
 * Local-only push notifications for retention drivers (daily bonus reminders,
 * future season-ending nudges). Wraps `expo-notifications` with a singleton
 * pattern for testability and graceful degradation.
 *
 * Server-side push is intentionally out of scope — all notifications are
 * scheduled client-side and survive app restarts via the OS scheduler.
 *
 * Permission flow:
 *  - `init()` requests permission once. Subsequent calls are idempotent.
 *  - If denied, all schedule methods become no-ops (no throws).
 *  - User can re-enable via system settings or in-app Settings toggle.
 */

import { Platform } from 'react-native';
// Types only — erased at runtime, no native module touched at import time
import type { TimeIntervalTriggerInput } from 'expo-notifications';

// Lazy-loaded to avoid "Cannot find native module 'ExpoPushTokenManager'"
// crash when the app binary is launched without an active Expo dev server
// (e.g. via xcrun simctl launch or bare-binary cold-start).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notifications: typeof import('expo-notifications') | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
} catch {
    console.warn('[notifications] expo-notifications native module unavailable — notifications disabled');
}

export type NotificationCategory = 'daily_bonus' | 'season_ending' | 'friend_invite';

class NotificationsService {
    private static instance: NotificationsService;
    private initialized = false;
    private hasPermission = false;

    public static getInstance(): NotificationsService {
        if (!NotificationsService.instance) {
            NotificationsService.instance = new NotificationsService();
        }
        return NotificationsService.instance;
    }

    /**
     * Initialize the notification subsystem and request permission.
     * Idempotent — safe to call multiple times.
     */
    public async init(): Promise<void> {
        if (this.initialized) return;

        if (!Notifications) {
            // Native module not available — silently degrade
            this.initialized = true;
            this.hasPermission = false;
            return;
        }

        try {
            // Foreground display behaviour
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: false,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            this.hasPermission = finalStatus === 'granted';

            if (Platform.OS === 'android' && this.hasPermission) {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.DEFAULT,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FFD700',
                });
            }

            this.initialized = true;
        } catch (err) {
            // Notifications module may not be available in Expo Go on SDK 53+ —
            // gracefully degrade so the app still launches.
            console.warn('[notifications] init failed', err);
            this.initialized = true;
            this.hasPermission = false;
        }
    }

    public hasNotificationPermission(): boolean {
        return this.hasPermission;
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Schedule a daily-bonus reminder. Cancels any previous daily-bonus
     * notification first so we keep at most one outstanding reminder.
     *
     * @param triggerInSeconds delay until fire (clamped to >= 60s)
     * @param title translated notification title (optional, falls back to EN)
     * @param body  translated notification body  (optional, falls back to EN)
     * @returns scheduled identifier or null on failure / no-permission
     */
    public async scheduleDailyBonusReminder(
        triggerInSeconds: number,
        title?: string,
        body?: string,
    ): Promise<string | null> {
        if (!this.hasPermission || !Notifications) return null;

        try {
            await this.cancelByCategory('daily_bonus');

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: title ?? '🎁 Daily bonus is ready!',
                    body: body ?? 'Open LOTO and claim your reward.',
                    sound: false,
                    data: { category: 'daily_bonus' satisfies NotificationCategory },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: Math.max(60, Math.floor(triggerInSeconds)),
                    channelId: 'default',
                } as TimeIntervalTriggerInput,
            });
            return id;
        } catch (err) {
            console.warn('[notifications] scheduleDailyBonusReminder failed', err);
            return null;
        }
    }

    /**
     * Schedule a "season ending soon" reminder.
     * Fires X seconds before season end. Cancels any previous season_ending notif.
     *
     * @param triggerInSeconds seconds until the notification fires
     * @param title translated title
     * @param body  translated body
     */
    public async scheduleSeasonEndingReminder(
        triggerInSeconds: number,
        title?: string,
        body?: string,
    ): Promise<string | null> {
        if (!this.hasPermission || !Notifications) return null;
        if (triggerInSeconds < 60) return null; // too soon to bother

        try {
            await this.cancelByCategory('season_ending');

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: title ?? '⏳ Season ending soon!',
                    body: body ?? 'Claim your Battle Pass rewards before the season ends.',
                    sound: false,
                    data: { category: 'season_ending' satisfies NotificationCategory },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: Math.max(60, Math.floor(triggerInSeconds)),
                    channelId: 'default',
                } as TimeIntervalTriggerInput,
            });
            return id;
        } catch (err) {
            console.warn('[notifications] scheduleSeasonEndingReminder failed', err);
            return null;
        }
    }

    /**
     * Cancel all scheduled notifications belonging to a given category.
     */
    public async cancelByCategory(category: NotificationCategory): Promise<void> {
        if (!Notifications) return;
        try {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            const toCancel = scheduled.filter((n) => {
                const data = n.content.data as { category?: NotificationCategory } | null | undefined;
                return data?.category === category;
            });
            for (const n of toCancel) {
                await Notifications.cancelScheduledNotificationAsync(n.identifier);
            }
        } catch (err) {
            console.warn('[notifications] cancelByCategory failed', err);
        }
    }

    /**
     * Cancel every scheduled notification (used when user opts out via Settings).
     */
    public async cancelAll(): Promise<void> {
        if (!Notifications) return;
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (err) {
            console.warn('[notifications] cancelAll failed', err);
        }
    }
}

export const notificationsService = NotificationsService.getInstance();
