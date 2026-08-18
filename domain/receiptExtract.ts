import { guessFromName } from './groceryCatalog';
import { DEFAULT_LOCATIONS, DEFAULT_SHELF_LIFE_DAYS, DEFAULT_UNITS } from './defaults';
import { parsePriceCents } from './money';
import type { Category, ItemSource, Location } from './types';

export interface ExtractedReceiptLine {
  name: string;
  quantity?: number;
  unit?: string;
  price?: string;
}

export interface ReceiptCandidate {
  name: string;
  category: Category;
  location: Location;
  unit: string;
  quantity: number;
  expiresInDays?: number;
  confidence: number;
  source: ItemSource;
  detail?: string;
  lastPriceCents?: number;
}

const SKIP =
  /^(subtotal|total|tax|vat|tip|visa|mastercard|amex|debit|credit|change|cash|balance|savings|approved|#|tel|phone|store|thank)/i;

export function extractedToCandidates(
  lines: ExtractedReceiptLine[],
  source: ItemSource = 'receipt-stub',
): ReceiptCandidate[] {
  const items: ReceiptCandidate[] = [];
  for (const line of lines) {
    const name = line.name.trim();
    if (name.length < 2 || SKIP.test(name)) continue;
    const catalog = guessFromName(name);
    const category = catalog?.category ?? 'other';
    const quantity = line.quantity && line.quantity > 0 ? line.quantity : 1;
    items.push({
      name: catalog?.name ?? titleCase(name),
      category,
      location: catalog?.location ?? DEFAULT_LOCATIONS[category],
      unit: line.unit?.trim() || catalog?.unit || DEFAULT_UNITS[category],
      quantity,
      expiresInDays: catalog?.shelfLifeDays ?? DEFAULT_SHELF_LIFE_DAYS[category],
      confidence: catalog ? 0.9 : 0.72,
      source: source ?? 'receipt-stub',
      detail: line.price ? String(line.price) : undefined,
      lastPriceCents: parsePriceCents(line.price),
    });
  }
  return items;
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseModelJson(raw: string): ExtractedReceiptLine[] {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned) as unknown;
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { items?: unknown }).items)
      ? (parsed as { items: unknown[] }).items
      : [];
  const lines: ExtractedReceiptLine[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const rec = row as Record<string, unknown>;
    if (typeof rec.name !== 'string') continue;
    lines.push({
      name: rec.name,
      quantity: typeof rec.quantity === 'number' ? rec.quantity : Number(rec.quantity) || undefined,
      unit: typeof rec.unit === 'string' ? rec.unit : undefined,
      price: rec.price != null ? String(rec.price) : undefined,
    });
  }
  return lines;
}

export function heuristicReceiptLines(text: string): ExtractedReceiptLine[] {
  const lines: ExtractedReceiptLine[] = [];
  for (const raw of text.split(/\n+/)) {
    const trimmed = raw.trim();
    if (trimmed.length < 2) continue;
    const priceMatch = trimmed.match(/\$?\d+\.\d{2}/);
    const name = trimmed.replace(/\$?\d+\.\d{2}.*/, '').replace(/\s{2,}/g, ' ').trim();
    if (name.length < 2) continue;
    lines.push({ name, price: priceMatch?.[0] });
  }
  return lines;
}
