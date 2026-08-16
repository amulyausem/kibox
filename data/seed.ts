import { createId } from '@/domain/ids';
import { addDaysIso } from '@/domain/dates';
import type { Item, StapleRule } from '@/domain/types';

export function seedItems(now = new Date()): Item[] {
  const t = (daysAgo: number) => addDaysIso(now, -daysAgo);
  const exp = (daysFromNow: number) => addDaysIso(now, daysFromNow);

  return [
    item('Milk', 'dairy', 'fridge', 1, 'carton', t(2), exp(2), 'manual', 'confirmed'),
    item('Eggs', 'dairy', 'fridge', 2, 'dozen', t(5), exp(12), 'manual', 'confirmed'),
    item('Baby spinach', 'produce', 'fridge', 1, 'bag', t(8), exp(-1), 'manual', 'confirmed'),
    item('Chicken thighs', 'meat', 'fridge', 1, 'pack', t(1), exp(1), 'manual', 'confirmed'),
    item('Greek yogurt', 'dairy', 'fridge', 1, 'tub', t(3), exp(5), 'manual', 'confirmed'),
    item('Bananas', 'produce', 'other', 1, 'bunch', t(3), exp(1), 'manual', 'confirmed'),
    item('Frozen peas', 'frozen', 'freezer', 1, 'bag', t(20), exp(80), 'manual', 'confirmed'),
    item('Olive oil', 'pantry', 'pantry', 1, 'bottle', t(40), exp(200), 'manual', 'confirmed'),
    item('Jasmine rice', 'pantry', 'pantry', 1, 'bag', t(40), exp(200), 'manual', 'confirmed'),
    item('Sourdough', 'pantry', 'other', 1, 'loaf', t(1), exp(2), 'barcode', 'confirmed'),
    item('Dish soap', 'household', 'other', 1, 'bottle', t(15), undefined, 'manual', 'confirmed'),
    item('Cheddar', 'dairy', 'fridge', 1, 'block', t(4), exp(8), 'manual', 'confirmed'),
    item(
      'Tomatoes',
      'produce',
      'fridge',
      4,
      'pcs',
      t(0),
      exp(5),
      'photo',
      'suggested',
      0.78,
    ),
    item(
      'Oat milk',
      'dairy',
      'fridge',
      1,
      'carton',
      t(0),
      exp(9),
      'receipt-stub',
      'suggested',
      0.64,
    ),
    item(
      'Coffee',
      'pantry',
      'pantry',
      1,
      'bag',
      t(0),
      undefined,
      'heuristic',
      'suggested',
      0.6,
      true,
    ),
  ];
}

export function seedStapleRules(): StapleRule[] {
  return [
    { id: createId(), itemName: 'Eggs', minQuantityThreshold: 6, enabled: true },
    { id: createId(), itemName: 'Milk', typicalIntervalDays: 7, enabled: true },
    { id: createId(), itemName: 'Olive oil', typicalIntervalDays: 60, enabled: true },
    { id: createId(), itemName: 'Jasmine rice', typicalIntervalDays: 30, enabled: true },
    { id: createId(), itemName: 'Coffee', typicalIntervalDays: 14, enabled: true },
  ];
}

function item(
  name: Item['name'],
  category: Item['category'],
  location: Item['location'],
  quantity: number,
  unit: string,
  addedAt: string,
  expiresAt: string | undefined,
  source: Item['source'],
  status: Item['status'],
  confidence?: number,
  flaggedForRestock = false,
): Item {
  return {
    id: createId(),
    name,
    category,
    quantity,
    unit,
    location,
    addedAt,
    expiresAt,
    source,
    status,
    confidence,
    flaggedForRestock,
  };
}
