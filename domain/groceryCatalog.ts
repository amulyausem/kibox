import { DEFAULT_LOCATIONS, DEFAULT_SHELF_LIFE_DAYS, DEFAULT_UNITS } from './defaults';
import { nameIncludes, normalizeName } from './dates';
import type { Category, Location } from './types';

export interface CatalogEntry {
  name: string;
  aliases: string[];
  category: Category;
  location: Location;
  unit: string;
  shelfLifeDays: number;
}

function entry(
  name: string,
  category: Category,
  aliases: string[] = [],
  overrides: Partial<Pick<CatalogEntry, 'location' | 'unit' | 'shelfLifeDays'>> = {},
): CatalogEntry {
  return {
    name,
    aliases,
    category,
    location: overrides.location ?? DEFAULT_LOCATIONS[category],
    unit: overrides.unit ?? DEFAULT_UNITS[category],
    shelfLifeDays: overrides.shelfLifeDays ?? DEFAULT_SHELF_LIFE_DAYS[category],
  };
}

export const GROCERY_CATALOG: CatalogEntry[] = [
  entry('Milk', 'dairy', ['whole milk', '2%', 'skim'], { unit: 'carton', shelfLifeDays: 7 }),
  entry('Oat milk', 'dairy', ['oatly'], { unit: 'carton', shelfLifeDays: 10 }),
  entry('Eggs', 'dairy', ['dozen'], { unit: 'dozen', shelfLifeDays: 21 }),
  entry('Butter', 'dairy', [], { unit: 'stick', shelfLifeDays: 21 }),
  entry('Cheddar', 'dairy', ['cheese'], { unit: 'block', shelfLifeDays: 14 }),
  entry('Greek yogurt', 'dairy', ['yogurt'], { unit: 'tub', shelfLifeDays: 10 }),
  entry('Baby spinach', 'produce', ['spinach'], { unit: 'bag', shelfLifeDays: 4 }),
  entry('Bananas', 'produce', ['banana'], { location: 'other', unit: 'bunch', shelfLifeDays: 5 }),
  entry('Tomatoes', 'produce', ['tomato'], { unit: 'pcs', shelfLifeDays: 6 }),
  entry('Cucumber', 'produce', [], { unit: 'pcs', shelfLifeDays: 7 }),
  entry('Avocado', 'produce', [], { unit: 'pcs', shelfLifeDays: 4 }),
  entry('Lemons', 'produce', ['lemon'], { unit: 'pcs', shelfLifeDays: 14 }),
  entry('Apples', 'produce', ['apple'], { unit: 'pcs', shelfLifeDays: 14 }),
  entry('Chicken thighs', 'meat', ['chicken'], { unit: 'pack', shelfLifeDays: 3 }),
  entry('Ground beef', 'meat', ['beef'], { unit: 'pack', shelfLifeDays: 2 }),
  entry('Salmon', 'meat', [], { unit: 'pack', shelfLifeDays: 2 }),
  entry('Sourdough', 'pantry', ['bread'], { location: 'other', unit: 'loaf', shelfLifeDays: 4 }),
  entry('Jasmine rice', 'pantry', ['rice'], { unit: 'bag', shelfLifeDays: 365 }),
  entry('All-purpose flour', 'pantry', ['flour'], { unit: 'bag', shelfLifeDays: 180 }),
  entry('Granulated sugar', 'pantry', ['sugar'], { unit: 'bag', shelfLifeDays: 365 }),
  entry('Olive oil', 'pantry', ['evoo'], { unit: 'bottle', shelfLifeDays: 365 }),
  entry('Coffee', 'pantry', ['beans', 'grounds'], { unit: 'bag', shelfLifeDays: 60 }),
  entry('Pasta', 'pantry', ['spaghetti'], { unit: 'box', shelfLifeDays: 365 }),
  entry('Canned tomatoes', 'pantry', [], { unit: 'can', shelfLifeDays: 365 }),
  entry('Peanut butter', 'pantry', [], { unit: 'jar', shelfLifeDays: 180 }),
  entry('Oats', 'pantry', ['oatmeal'], { unit: 'canister', shelfLifeDays: 180 }),
  entry('Frozen peas', 'frozen', ['peas'], { unit: 'bag', shelfLifeDays: 180 }),
  entry('Frozen berries', 'frozen', [], { unit: 'bag', shelfLifeDays: 180 }),
  entry('Ice cream', 'frozen', [], { unit: 'pint', shelfLifeDays: 60 }),
  entry('Dish soap', 'household', [], { location: 'other', unit: 'bottle', shelfLifeDays: 365 }),
  entry('Paper towels', 'household', [], { location: 'other', unit: 'pack', shelfLifeDays: 365 }),
  entry('Trash bags', 'household', [], { location: 'other', unit: 'box', shelfLifeDays: 365 }),
];

export function searchCatalog(query: string, limit = 6): CatalogEntry[] {
  const q = normalizeName(query);
  if (!q) return GROCERY_CATALOG.slice(0, limit);

  const scored = GROCERY_CATALOG.map((item) => {
    const hay = [item.name, ...item.aliases].join(' ');
    const exact = normalizeName(item.name) === q;
    const starts = normalizeName(item.name).startsWith(q);
    const hit = nameIncludes(hay, q);
    const score = exact ? 3 : starts ? 2 : hit ? 1 : 0;
    return { item, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((row) => row.item);
}

export function guessFromName(name: string): CatalogEntry | undefined {
  const hits = searchCatalog(name, 1);
  if (hits.length === 0) return undefined;
  if (normalizeName(hits[0].name) === normalizeName(name)) return hits[0];
  if (nameIncludes(hits[0].name, name) || hits[0].aliases.some((a) => nameIncludes(a, name))) {
    return hits[0];
  }
  return undefined;
}
