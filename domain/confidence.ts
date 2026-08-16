import { DEFAULT_LOCATIONS, DEFAULT_UNITS } from './defaults';
import { getExpiryStatus } from './expiry';
import { namesMatch } from './dates';
import { isRunningLow, lastRestockedAt, totalQuantityForName } from './restock';
import type { Category, HouseholdSettings, Item, Location, StapleRule } from './types';

export type InferenceKind = 'probably_used' | 'probably_low';

export interface SuggestionDraft {
  name: string;
  reason: InferenceKind;
  confidence: number;
  category: Category;
  location: Location;
  unit: string;
}

const PERISHABLE: Category[] = ['produce', 'dairy', 'meat'];

export function inferDepletionSuggestions(
  items: Item[],
  rules: StapleRule[],
  now: Date,
  settings: Pick<HouseholdSettings, 'shelfLifeDays' | 'soonWindowsDays' | 'defaultLocations'>,
): SuggestionDraft[] {
  const drafts: SuggestionDraft[] = [];

  for (const item of items) {
    if (item.status !== 'confirmed') continue;
    if (!PERISHABLE.includes(item.category)) continue;
    const status = getExpiryStatus(item, now, settings);
    if (status !== 'expired') continue;
    if (drafts.some((d) => namesMatch(d.name, item.name))) continue;
    drafts.push({
      name: item.name,
      reason: 'probably_used',
      confidence: 0.55,
      category: item.category,
      location: item.location,
      unit: item.unit,
    });
  }

  for (const rule of rules) {
    if (!rule.enabled || rule.typicalIntervalDays == null) continue;
    const low = isRunningLow({
      currentQuantity: totalQuantityForName(items, rule.itemName),
      lastRestockedAt: lastRestockedAt(items, rule.itemName),
      rule,
      now,
    });
    if (!low) continue;
    if (items.some((item) => namesMatch(item.name, rule.itemName) && item.status === 'suggested')) {
      continue;
    }
    if (drafts.some((d) => namesMatch(d.name, rule.itemName))) continue;
    drafts.push({
      name: rule.itemName,
      reason: 'probably_low',
      confidence: 0.6,
      category: 'pantry',
      location: settings.defaultLocations.pantry ?? DEFAULT_LOCATIONS.pantry,
      unit: DEFAULT_UNITS.pantry,
    });
  }

  return drafts;
}

export function confidenceLabel(confidence: number | undefined): string {
  if (confidence == null) return 'Suggested';
  return `${Math.round(confidence * 100)}% sure`;
}
