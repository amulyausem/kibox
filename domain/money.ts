import type { WasteEvent } from './types';

export function parsePriceCents(raw?: string): number | undefined {
  if (!raw) return undefined;
  const match = raw.replace(/,/g, '').match(/(\d+)\.(\d{2})/) ?? raw.match(/(\d+)/);
  if (!match) return undefined;
  if (match[2]) return Number(match[1]) * 100 + Number(match[2]);
  const dollars = Number(match[1]);
  if (!Number.isFinite(dollars)) return undefined;
  return dollars < 100 && !raw.includes('.') ? dollars * 100 : dollars;
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function wasteCentsInMonth(events: WasteEvent[], now: Date): number {
  const month = now.getMonth();
  const year = now.getFullYear();
  return events
    .filter((event) => {
      const at = new Date(event.tossedAt);
      return at.getMonth() === month && at.getFullYear() === year;
    })
    .reduce((sum, event) => sum + (event.priceCents ?? 0), 0);
}
