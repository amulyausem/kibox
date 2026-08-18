import type { CandidateItem } from '../repositories';

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function pickDemoSet<T>(sets: T[], seed?: string): T {
  let n = Date.now();
  if (seed) {
    n = 0;
    for (const char of seed) n += char.charCodeAt(0);
  }
  return sets[Math.abs(n) % sets.length] ?? sets[0];
}

const photoA: CandidateItem[] = [
  { name: 'Tomatoes', category: 'produce', location: 'fridge', unit: 'pcs', quantity: 4, expiresInDays: 5, confidence: 0.86, source: 'photo', detail: 'On the counter' },
  { name: 'Cucumber', category: 'produce', location: 'fridge', unit: 'pcs', quantity: 2, expiresInDays: 6, confidence: 0.74, source: 'photo' },
  { name: 'Avocado', category: 'produce', location: 'other', unit: 'pcs', quantity: 2, expiresInDays: 3, confidence: 0.69, source: 'photo' },
];

const photoB: CandidateItem[] = [
  { name: 'Milk', category: 'dairy', location: 'fridge', unit: 'carton', quantity: 1, expiresInDays: 7, confidence: 0.91, source: 'photo' },
  { name: 'Eggs', category: 'dairy', location: 'fridge', unit: 'dozen', quantity: 1, expiresInDays: 21, confidence: 0.88, source: 'photo' },
  { name: 'Sourdough', category: 'pantry', location: 'other', unit: 'loaf', quantity: 1, expiresInDays: 4, confidence: 0.72, source: 'photo' },
];

const photoC: CandidateItem[] = [
  { name: 'Bananas', category: 'produce', location: 'other', unit: 'bunch', quantity: 1, expiresInDays: 5, confidence: 0.9, source: 'photo' },
  { name: 'Greek yogurt', category: 'dairy', location: 'fridge', unit: 'tub', quantity: 1, expiresInDays: 10, confidence: 0.77, source: 'photo' },
  { name: 'Chicken thighs', category: 'meat', location: 'fridge', unit: 'pack', quantity: 1, expiresInDays: 3, confidence: 0.64, source: 'photo' },
];

export const PHOTO_DEMO_SETS = [photoA, photoB, photoC];

export const RECEIPT_DEMO: CandidateItem[] = [
  { name: 'Oat milk', category: 'dairy', location: 'fridge', unit: 'carton', quantity: 1, expiresInDays: 10, confidence: 0.93, source: 'receipt-stub', detail: '$4.29' },
  { name: 'Eggs', category: 'dairy', location: 'fridge', unit: 'dozen', quantity: 1, expiresInDays: 21, confidence: 0.91, source: 'receipt-stub', detail: '$5.49' },
  { name: 'Baby spinach', category: 'produce', location: 'fridge', unit: 'bag', quantity: 1, expiresInDays: 4, confidence: 0.84, source: 'receipt-stub', detail: '$3.99' },
  { name: 'Pasta', category: 'pantry', location: 'pantry', unit: 'box', quantity: 2, expiresInDays: 365, confidence: 0.88, source: 'receipt-stub', detail: '$1.79 ea' },
  { name: 'Coffee', category: 'pantry', location: 'pantry', unit: 'bag', quantity: 1, expiresInDays: 60, confidence: 0.8, source: 'receipt-stub', detail: '$12.99' },
];

export const LOYALTY_DEMO: CandidateItem[] = [
  { name: 'Eggs', category: 'dairy', location: 'fridge', unit: 'dozen', quantity: 1, expiresInDays: 21, confidence: 0.95, source: 'loyalty-stub', detail: 'Whole Foods · yesterday' },
  { name: 'Butter', category: 'dairy', location: 'fridge', unit: 'stick', quantity: 1, expiresInDays: 21, confidence: 0.92, source: 'loyalty-stub', detail: 'Whole Foods · yesterday' },
  { name: 'Apples', category: 'produce', location: 'fridge', unit: 'pcs', quantity: 6, expiresInDays: 14, confidence: 0.89, source: 'loyalty-stub', detail: 'Honeycrisp' },
  { name: 'Olive oil', category: 'pantry', location: 'pantry', unit: 'bottle', quantity: 1, expiresInDays: 365, confidence: 0.81, source: 'loyalty-stub' },
];
