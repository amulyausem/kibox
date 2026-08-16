import { daysSince, namesMatch } from './dates';
import type { Item, StapleRule } from './types';

export function totalQuantityForName(items: Item[], itemName: string): number {
  return items
    .filter((item) => item.status === 'confirmed' && namesMatch(item.name, itemName))
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function lastRestockedAt(items: Item[], itemName: string): string | undefined {
  const matches = items
    .filter((item) => item.status === 'confirmed' && namesMatch(item.name, itemName))
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  return matches[0]?.addedAt;
}

export function isRunningLow(args: {
  currentQuantity: number;
  lastRestockedAt: string | undefined;
  rule: StapleRule;
  now: Date;
}): boolean {
  if (!args.rule.enabled) return false;

  if (
    args.rule.minQuantityThreshold != null &&
    args.currentQuantity <= args.rule.minQuantityThreshold
  ) {
    return true;
  }

  if (args.rule.typicalIntervalDays != null && args.lastRestockedAt) {
    return daysSince(args.lastRestockedAt, args.now) >= args.rule.typicalIntervalDays;
  }

  if (args.rule.typicalIntervalDays != null && !args.lastRestockedAt) {
    return true;
  }

  return false;
}

export function runningLowRules(
  items: Item[],
  rules: StapleRule[],
  now: Date,
): StapleRule[] {
  return rules.filter((rule) =>
    isRunningLow({
      currentQuantity: totalQuantityForName(items, rule.itemName),
      lastRestockedAt: lastRestockedAt(items, rule.itemName),
      rule,
      now,
    }),
  );
}
