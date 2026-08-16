import { addDaysIso, daysUntil } from './dates';
import type { Category, ExpiryStatus, Item } from './types';

export function inferExpiresAt(
  item: Pick<Item, 'expiresAt' | 'addedAt' | 'openedAt' | 'category'>,
  shelfLifeDays: Record<Category, number>,
): string {
  if (item.expiresAt) return item.expiresAt;
  const start = item.openedAt ?? item.addedAt;
  return addDaysIso(start, shelfLifeDays[item.category]);
}

export function getExpiryStatus(
  item: Pick<Item, 'expiresAt' | 'addedAt' | 'openedAt' | 'category'>,
  now: Date,
  options: {
    soonWindowsDays: Record<Category, number>;
    shelfLifeDays: Record<Category, number>;
  },
): ExpiryStatus {
  const expiresAt = inferExpiresAt(item, options.shelfLifeDays);
  const days = daysUntil(expiresAt, now);
  if (days < 0) return 'expired';
  if (days <= options.soonWindowsDays[item.category]) return 'expiring_soon';
  return 'fresh';
}

export function expiryLabel(
  item: Pick<Item, 'expiresAt' | 'addedAt' | 'openedAt' | 'category'>,
  now: Date,
  shelfLifeDays: Record<Category, number>,
): string {
  const expiresAt = inferExpiresAt(item, shelfLifeDays);
  const days = daysUntil(expiresAt, now);
  if (days < 0) return days === -1 ? 'Expired yesterday' : `Expired ${-days}d`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Tomorrow';
  return `${days}d`;
}

export function compareByExpiry(
  a: Item,
  b: Item,
  now: Date,
  shelfLifeDays: Record<Category, number>,
): number {
  const aDays = daysUntil(inferExpiresAt(a, shelfLifeDays), now);
  const bDays = daysUntil(inferExpiresAt(b, shelfLifeDays), now);
  return aDays - bDays;
}
