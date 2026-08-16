import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getExpiryStatus } from '@/domain/expiry';
import { runningLowRules } from '@/domain/restock';
import type { HouseholdSettings, Item, StapleRule } from '@/domain/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function syncDailyDigest(
  items: Item[],
  rules: StapleRule[],
  settings: HouseholdSettings,
  now = new Date(),
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.digestEnabled) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const body = digestBody(items, rules, settings, now);
  if (!body) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Kibox · today',
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.notificationHour,
      minute: settings.notificationMinute,
    },
  });
}

export function digestBody(
  items: Item[],
  rules: StapleRule[],
  settings: HouseholdSettings,
  now: Date,
): string | undefined {
  const confirmed = items.filter((item) => item.status === 'confirmed');
  const expiring = confirmed.filter(
    (item) => getExpiryStatus(item, now, settings) === 'expiring_soon',
  );
  const expired = confirmed.filter(
    (item) => getExpiryStatus(item, now, settings) === 'expired',
  );
  const low = runningLowRules(confirmed, rules, now);

  const parts: string[] = [];
  if (expired.length) parts.push(`${expired.length} expired`);
  if (expiring.length) parts.push(`${expiring.length} expiring`);
  if (low.length) parts.push(`${low.length} running low`);
  if (parts.length === 0) return undefined;

  const names = [
    ...expired.slice(0, 2).map((i) => i.name),
    ...expiring.slice(0, 2).map((i) => i.name),
    ...low.slice(0, 2).map((r) => r.itemName),
  ].slice(0, 3);

  return `${parts.join(' · ')}. ${names.join(', ')}`;
}

export async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('kibox-digest', {
    name: 'Daily digest',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}
