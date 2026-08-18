import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { householdInviteMessage, remoteIsNewer } from './household';
import { homeWidgetProps } from './homeWidget';
import type { Item, ShoppingListItem } from './types';

describe('remoteIsNewer', () => {
  it('applies when this phone has never pulled', () => {
    assert.equal(remoteIsNewer(undefined, '2026-08-18T12:00:00.000Z'), true);
  });

  it('applies only a later snapshot', () => {
    assert.equal(remoteIsNewer('2026-08-18T12:00:00.000Z', '2026-08-18T12:00:01.000Z'), true);
    assert.equal(remoteIsNewer('2026-08-18T12:00:01.000Z', '2026-08-18T12:00:00.000Z'), false);
    assert.equal(remoteIsNewer('2026-08-18T12:00:00.000Z', '2026-08-18T12:00:00.000Z'), false);
  });
});

describe('householdInviteMessage', () => {
  it('includes the code and a join link', () => {
    const text = householdInviteMessage('ABC123');
    assert.match(text, /ABC123/);
    assert.match(text, /kibox:\/\/join\?code=ABC123/);
  });
});

describe('homeWidgetProps', () => {
  it('leads with expiring food, then the list count', () => {
    const items: Item[] = [
      {
        id: '1',
        name: 'Milk',
        category: 'dairy',
        quantity: 1,
        unit: 'ea',
        location: 'fridge',
        addedAt: '2026-08-10T00:00:00.000Z',
        expiresAt: '2026-08-18T00:00:00.000Z',
        source: 'manual',
        status: 'confirmed',
        flaggedForRestock: false,
      },
    ];
    const shopping: ShoppingListItem[] = [
      {
        id: 's1',
        name: 'Eggs',
        quantity: 1,
        unit: 'dozen',
        checked: false,
        addedAt: '2026-08-18T00:00:00.000Z',
      },
    ];
    const props = homeWidgetProps(items, shopping, undefined, new Date('2026-08-18T12:00:00.000Z'));
    assert.equal(props.title, '1 to use');
    assert.equal(props.line1, 'Milk');
    assert.equal(props.line3, 'List · 1');
  });
});
