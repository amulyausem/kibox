import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isRunningLow, lastRestockedAt, totalQuantityForName } from './restock';
import type { Item, StapleRule } from './types';

const now = new Date('2026-08-16T12:00:00.000Z');

const eggs: Item = {
  id: 'e',
  name: 'Eggs',
  category: 'dairy',
  quantity: 2,
  unit: 'dozen',
  location: 'fridge',
  addedAt: '2026-08-01T12:00:00.000Z',
  source: 'manual',
  status: 'confirmed',
  flaggedForRestock: false,
};

describe('isRunningLow', () => {
  it('flags quantity at or below the threshold', () => {
    const rule: StapleRule = {
      id: 'r1',
      itemName: 'Eggs',
      minQuantityThreshold: 6,
      enabled: true,
    };
    assert.equal(
      isRunningLow({ currentQuantity: 2, lastRestockedAt: eggs.addedAt, rule, now }),
      true,
    );
    assert.equal(
      isRunningLow({ currentQuantity: 12, lastRestockedAt: eggs.addedAt, rule, now }),
      false,
    );
  });

  it('flags staples past their typical interval', () => {
    const rule: StapleRule = {
      id: 'r2',
      itemName: 'Rice',
      typicalIntervalDays: 30,
      enabled: true,
    };
    assert.equal(
      isRunningLow({
        currentQuantity: 1,
        lastRestockedAt: '2026-07-01T12:00:00.000Z',
        rule,
        now,
      }),
      true,
    );
    assert.equal(
      isRunningLow({
        currentQuantity: 1,
        lastRestockedAt: '2026-08-10T12:00:00.000Z',
        rule,
        now,
      }),
      false,
    );
  });

  it('ignores disabled rules', () => {
    const rule: StapleRule = {
      id: 'r3',
      itemName: 'Eggs',
      minQuantityThreshold: 6,
      enabled: false,
    };
    assert.equal(
      isRunningLow({ currentQuantity: 0, lastRestockedAt: eggs.addedAt, rule, now }),
      false,
    );
  });
});

describe('item aggregations', () => {
  it('sums confirmed quantity by name', () => {
    const extra: Item = { ...eggs, id: 'e2', quantity: 4 };
    assert.equal(totalQuantityForName([eggs, extra], 'eggs'), 6);
  });

  it('uses the newest confirmed add as last restock', () => {
    const older: Item = { ...eggs, id: 'old', addedAt: '2026-07-01T12:00:00.000Z' };
    assert.equal(lastRestockedAt([older, eggs], 'Eggs'), eggs.addedAt);
  });
});
