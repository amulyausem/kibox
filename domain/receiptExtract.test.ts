import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractedToCandidates, parseModelJson } from './receiptExtract';

describe('receipt extract', () => {
  it('parseModelJson reads Gemini-style items payload', () => {
    const lines = parseModelJson('{"items":[{"name":"oat milk","quantity":2,"price":"$4.29"}]}');
    assert.equal(lines[0]?.name, 'oat milk');
    assert.equal(lines[0]?.quantity, 2);
  });

  it('skips totals and maps catalog names', () => {
    const items = extractedToCandidates([
      { name: 'Oat milk', quantity: 1, price: '$4.29' },
      { name: 'TOTAL', price: '$12.00' },
      { name: 'Tax' },
    ]);
    assert.equal(items.length, 1);
    assert.equal(items[0]?.name, 'Oat milk');
    assert.equal(items[0]?.source, 'receipt-stub');
  });
});
