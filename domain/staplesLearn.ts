import { daysSince, namesMatch } from './dates';
import type { StapleRule, UsageEvent } from './types';

export function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const even = sorted.length % 2 === 0;
  const a = sorted[mid];
  const b = sorted[mid - 1];
  if (a == null) return undefined;
  if (even && b != null) return Math.round((a + b) / 2);
  return a;
}

export function learnedIntervalDays(events: UsageEvent[], itemName: string): number | undefined {
  const times = events
    .filter((event) => namesMatch(event.itemName, itemName))
    .map((event) => new Date(event.usedAt).getTime())
    .sort((a, b) => a - b);
  if (times.length < 2) return undefined;
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i += 1) {
    const prev = times[i - 1];
    const next = times[i];
    if (prev == null || next == null) continue;
    const days = Math.round((next - prev) / 86_400_000);
    if (days >= 1 && days <= 180) gaps.push(days);
  }
  return median(gaps);
}

export function applyLearnedInterval(rule: StapleRule, learned: number | undefined): StapleRule {
  if (learned == null) return rule;
  if (rule.typicalIntervalDays == null) return { ...rule, typicalIntervalDays: learned };
  const mixed = Math.round(rule.typicalIntervalDays * 0.6 + learned * 0.4);
  return { ...rule, typicalIntervalDays: mixed };
}

export function daysSinceLastUse(events: UsageEvent[], itemName: string, now: Date): number | undefined {
  const last = events
    .filter((event) => namesMatch(event.itemName, itemName))
    .sort((a, b) => b.usedAt.localeCompare(a.usedAt))[0];
  if (!last) return undefined;
  return daysSince(last.usedAt, now);
}
