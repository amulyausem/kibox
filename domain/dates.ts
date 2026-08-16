export const DAY_MS = 86_400_000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDaysIso(from: string | Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function daysUntil(iso: string, now: Date): number {
  const target = startOfDay(new Date(iso));
  const today = startOfDay(now);
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

export function daysSince(iso: string, now: Date): number {
  return -daysUntil(iso, now);
}

export function namesMatch(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function nameIncludes(haystack: string, needle: string): boolean {
  const n = normalizeName(needle);
  if (!n) return false;
  return normalizeName(haystack).includes(n);
}
