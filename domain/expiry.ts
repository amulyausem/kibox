import { addDaysIso, daysUntil } from './dates';
import { DEFAULT_OPENED_SHELF_LIFE_DAYS } from './defaults';
import type { Category, ExpiryStatus, Item } from './types';

export type ExpiryOptions = {
  soonWindowsDays: Record<Category, number>;
  shelfLifeDays: Record<Category, number>;
  openedShelfLifeDays?: Record<Category, number>;
};

export function inferExpiresAt(
  item: Pick<Item, 'expiresAt' | 'addedAt' | 'openedAt' | 'category'>,
  shelfLifeDays: Record<Category, number>,
  openedShelfLifeDays: Record<Category, number> = DEFAULT_OPENED_SHELF_LIFE_DAYS,
): string {
  const sealed = item.expiresAt ?? addDaysIso(item.addedAt, shelfLifeDays[item.category]);
  if (!item.openedAt) return sealed;
  const opened = addDaysIso(item.openedAt, openedShelfLifeDays[item.category]);
  return sealed <= opened ? sealed : opened;
}

export function getExpiryStatus(
  item: Pick<Item, 'expiresAt' | 'addedAt' | 'openedAt' | 'category'>,
  now: Date,
  options: ExpiryOptions,
): ExpiryStatus {
  const expiresAt = inferExpiresAt(item, options.shelfLifeDays, options.openedShelfLifeDays);
  const days = daysUntil(expiresAt, now);
  if (days < 0) return 'expired';
  if (days <= options.soonWindowsDays[item.category]) return 'expiring_soon';
  return 'fresh';
}

export function expiryLabel(
  item: Pick<Item, 'expiresAt' | 'addedAt' | 'openedAt' | 'category'>,
  now: Date,
  options: Pick<ExpiryOptions, 'shelfLifeDays' | 'openedShelfLifeDays'>,
): string {
  const expiresAt = inferExpiresAt(item, options.shelfLifeDays, options.openedShelfLifeDays);
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
  options: Pick<ExpiryOptions, 'shelfLifeDays' | 'openedShelfLifeDays'>,
): number {
  const aDays = daysUntil(inferExpiresAt(a, options.shelfLifeDays, options.openedShelfLifeDays), now);
  const bDays = daysUntil(inferExpiresAt(b, options.shelfLifeDays, options.openedShelfLifeDays), now);
  return aDays - bDays;
}

export function useThisFirst(
  items: Item[],
  now: Date,
  options: ExpiryOptions,
  limit = 3,
): Item[] {
  return items
    .filter((item) => item.status === 'confirmed')
    .filter((item) => {
      const status = getExpiryStatus(item, now, options);
      return status === 'expiring_soon' || status === 'expired';
    })
    .sort((a, b) => compareByExpiry(a, b, now, options))
    .slice(0, limit);
}
