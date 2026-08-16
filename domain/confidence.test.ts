import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { confidenceLabel, inferDepletionSuggestions } from './confidence';
import { defaultSettings } from './defaults';
import type { Item, StapleRule } from './types';

const now = new Date('2026-08-16T12:00:00.000Z');
const settings = defaultSettings();

describe('inferDepletionSuggestions', () => {
  it('suggests expired perishables as probably used', () => {
    const spinach: Item = {
      id: 's',
      name: 'Baby spinach',
      category: 'produce',
      quantity: 1,
      unit: 'bag',
      location: 'fridge',
      addedAt: '2026-08-01T12:00:00.000Z',
      expiresAt: '2026-08-10T12:00:00.000Z',
      source: 'manual',
      status: 'confirmed',
      flaggedForRestock: false,
    };
    const drafts = inferDepletionSuggestions([spinach], [], now, settings);
    assert.equal(drafts.length, 1);
    assert.equal(drafts[0]?.reason, 'probably_used');
    assert.equal(drafts[0]?.confidence, 0.55);
  });

  it('suggests staples past interval as probably low', () => {
    const rule: StapleRule = {
      id: 'c',
      itemName: 'Coffee',
      typicalIntervalDays: 14,
      enabled: true,
    };
    const drafts = inferDepletionSuggestions([], [rule], now, settings);
    assert.equal(drafts[0]?.reason, 'probably_low');
    assert.equal(drafts[0]?.name, 'Coffee');
  });

  it('does not duplicate an existing suggested item', () => {
    const rule: StapleRule = {
      id: 'c',
      itemName: 'Coffee',
      typicalIntervalDays: 14,
      enabled: true,
    };
    const existing: Item = {
      id: 'sug',
      name: 'Coffee',
      category: 'pantry',
      quantity: 1,
      unit: 'bag',
      location: 'pantry',
      addedAt: now.toISOString(),
      source: 'heuristic',
      status: 'suggested',
      confidence: 0.6,
      flaggedForRestock: true,
    };
    const drafts = inferDepletionSuggestions([existing], [rule], now, settings);
    assert.equal(drafts.length, 0);
  });
});

describe('confidenceLabel', () => {
  it('renders a compact percent', () => {
    assert.equal(confidenceLabel(0.78), '78% sure');
    assert.equal(confidenceLabel(undefined), 'Suggested');
  });
});
