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

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
     * @returns scheduled identifier or null on failure / no-permission
     */
    public async scheduleDailyBonusReminder(triggerInSeconds: number): Promise<string | null> {
        if (!this.hasPermission) return null;

        try {
            await this.cancelByCategory('daily_bonus');

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🎁 Daily bonus is ready!',
                    body: 'Open LOTO and claim your reward.',
                    sound: false,
                    data: { category: 'daily_bonus' satisfies NotificationCategory },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: Math.max(60, Math.floor(triggerInSeconds)),
                    channelId: 'default',
                } as Notifications.TimeIntervalTriggerInput,
            });
            return id;
        } catch (err) {
            console.warn('[notifications] scheduleDailyBonusReminder failed', err);
            return null;
        }
    }

    /**
     * Cancel all scheduled notifications belonging to a given category.
     */
    public async cancelByCategory(category: NotificationCategory): Promise<void> {
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
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (err) {
            console.warn('[notifications] cancelAll failed', err);
        }
    }
}

export const notificationsService = NotificationsService.getInstance();
