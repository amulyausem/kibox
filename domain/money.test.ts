import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatCents, parsePriceCents, wasteCentsInMonth } from './money';
import type { WasteEvent } from './types';

describe('parsePriceCents', () => {
  it('reads dollar strings', () => {
    assert.equal(parsePriceCents('$4.29'), 429);
    assert.equal(parsePriceCents('12.00'), 1200);
  });
});

describe('wasteCentsInMonth', () => {
  it('sums this month only', () => {
    const events: WasteEvent[] = [
      {
        id: '1',
        name: 'Spinach',
        category: 'produce',
        quantity: 1,
        unit: 'bag',
        priceCents: 399,
        tossedAt: '2026-08-10T12:00:00.000Z',
      },
      {
        id: '2',
        name: 'Milk',
        category: 'dairy',
        quantity: 1,
        unit: 'carton',
        priceCents: 449,
        tossedAt: '2026-07-10T12:00:00.000Z',
      },
    ];
    assert.equal(wasteCentsInMonth(events, new Date('2026-08-18T12:00:00.000Z')), 399);
    assert.equal(formatCents(399), '$3.99');
  });
});
