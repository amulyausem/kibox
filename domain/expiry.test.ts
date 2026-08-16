import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultSettings } from './defaults';
import { expiryLabel, getExpiryStatus, inferExpiresAt } from './expiry';
import type { Item } from './types';

const now = new Date('2026-08-16T12:00:00.000Z');
const settings = defaultSettings();

function item(overrides: Partial<Item>): Item {
  return {
    id: '1',
    name: 'Milk',
    category: 'dairy',
    quantity: 1,
    unit: 'carton',
    location: 'fridge',
    addedAt: '2026-08-10T12:00:00.000Z',
    source: 'manual',
    status: 'confirmed',
    flaggedForRestock: false,
    ...overrides,
  };
}

describe('getExpiryStatus', () => {
  it('marks past dates as expired', () => {
    const status = getExpiryStatus(
      item({ expiresAt: '2026-08-14T12:00:00.000Z' }),
      now,
      settings,
    );
    assert.equal(status, 'expired');
  });

  it('marks dates within the category window as expiring soon', () => {
    const status = getExpiryStatus(
      item({ expiresAt: '2026-08-18T12:00:00.000Z' }),
      now,
      settings,
    );
    assert.equal(status, 'expiring_soon');
  });

  it('marks later dates as fresh', () => {
    const status = getExpiryStatus(
      item({ expiresAt: '2026-08-26T12:00:00.000Z' }),
      now,
      settings,
    );
    assert.equal(status, 'fresh');
  });

  it('uses category shelf life when no expiry is set', () => {
    const milk = item({ expiresAt: undefined, addedAt: '2026-08-10T12:00:00.000Z' });
    const inferred = inferExpiresAt(milk, settings.shelfLifeDays);
    assert.equal(inferred.startsWith('2026-08-17'), true);
    assert.equal(getExpiryStatus(milk, now, settings), 'expiring_soon');
  });
});

describe('expiryLabel', () => {
  it('formats remaining days compactly', () => {
    assert.equal(
      expiryLabel(item({ expiresAt: '2026-08-16T12:00:00.000Z' }), now, settings.shelfLifeDays),
      'Expires today',
    );
    assert.equal(
      expiryLabel(item({ expiresAt: '2026-08-17T12:00:00.000Z' }), now, settings.shelfLifeDays),
      'Tomorrow',
    );
    assert.equal(
      expiryLabel(item({ expiresAt: '2026-08-14T12:00:00.000Z' }), now, settings.shelfLifeDays),
      'Expired 2d',
    );
  });
});
