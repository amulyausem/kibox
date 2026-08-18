import type { HouseholdSettings, Item, ShoppingListItem, StapleRule, WasteEvent } from './types';

export const BACKUP_VERSION = 1 as const;

export interface HouseholdBackup {
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  items: Item[];
  rules: StapleRule[];
  settings: HouseholdSettings;
  shopping: ShoppingListItem[];
  waste: WasteEvent[];
}

export function parseBackup(raw: string): HouseholdBackup {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object') throw new Error('Not a Kibox backup.');
  const rec = parsed as Partial<HouseholdBackup>;
  if (rec.version !== BACKUP_VERSION || !Array.isArray(rec.items) || !Array.isArray(rec.rules)) {
    throw new Error('This backup is from a newer or unknown Kibox version.');
  }
  return {
    version: BACKUP_VERSION,
    exportedAt: typeof rec.exportedAt === 'string' ? rec.exportedAt : new Date().toISOString(),
    items: rec.items,
    rules: rec.rules,
    settings: rec.settings as HouseholdSettings,
    shopping: Array.isArray(rec.shopping) ? rec.shopping : [],
    waste: Array.isArray(rec.waste) ? rec.waste : [],
  };
}
