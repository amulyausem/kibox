import { GROCERY_CATALOG } from '@/domain/groceryCatalog';
import { DEFAULT_LOCATIONS, DEFAULT_SHELF_LIFE_DAYS, DEFAULT_UNITS } from '@/domain/defaults';
import type { Category } from '@/domain/types';
import { FEATURES } from '../featureFlags';
import type { ProductLookup, ProductRecord } from '../repositories';

export const LOCAL_BARCODES: Record<string, string> = {
  '041220000011': 'Milk',
  '041220000028': 'Eggs',
  '041220000035': 'Bananas',
  '041220000042': 'Sourdough',
  '041220000059': 'Olive oil',
  '041220000066': 'Greek yogurt',
  '041220000073': 'Coffee',
  '041220000080': 'Jasmine rice',
};

export class LocalProductLookup implements ProductLookup {
  async lookup(barcode: string): Promise<ProductRecord | undefined> {
    const name = LOCAL_BARCODES[barcode.trim()];
    if (!name) return undefined;
    const catalog = GROCERY_CATALOG.find((item) => item.name === name);
    if (!catalog) return undefined;
    return {
      barcode,
      name: catalog.name,
      category: catalog.category,
      location: catalog.location,
      unit: catalog.unit,
      shelfLifeDays: catalog.shelfLifeDays,
    };
  }
}

interface OffResponse {
  status?: number;
  product?: {
    product_name?: string;
    product_name_en?: string;
    generic_name?: string;
    categories_tags?: string[];
  };
}

function mapOffCategory(tags: string[] | undefined): Category {
  const blob = (tags ?? []).join(' ').toLowerCase();
  if (/dairy|milk|cheese|yogurt|egg/.test(blob)) return 'dairy';
  if (/fruit|vegetable|produce|salad/.test(blob)) return 'produce';
  if (/meat|poultry|chicken|beef|fish|seafood/.test(blob)) return 'meat';
  if (/frozen/.test(blob)) return 'frozen';
  if (/household|cleaning|paper/.test(blob)) return 'household';
  return 'pantry';
}

function normalizeBarcode(code: string): string[] {
  const trimmed = code.trim();
  const variants = [trimmed];
  if (/^\d{12}$/.test(trimmed)) variants.push(`0${trimmed}`);
  if (/^\d{13}$/.test(trimmed) && trimmed.startsWith('0')) variants.push(trimmed.slice(1));
  return variants;
}

export class OpenFoodFactsLookup implements ProductLookup {
  constructor(private readonly fallback: ProductLookup) {}

  async lookup(barcode: string): Promise<ProductRecord | undefined> {
    const local = await this.fallback.lookup(barcode);
    if (local) return local;
    if (!FEATURES.realProductLookup) return undefined;

    for (const code of normalizeBarcode(barcode)) {
      try {
        const response = await fetch(
          `https://world.openfoodfacts.org/api/v2/product/${code}.json`,
          {
            headers: { 'User-Agent': 'Kibox/1.0 (presentation; connect@kiboxofficial.com)' },
          },
        );
        if (!response.ok) continue;
        const json = (await response.json()) as OffResponse;
        if (json.status !== 1 || !json.product) continue;
        const name =
          json.product.product_name_en?.trim() ||
          json.product.product_name?.trim() ||
          json.product.generic_name?.trim();
        if (!name) continue;
        const category = mapOffCategory(json.product.categories_tags);
        return {
          barcode: code,
          name,
          category,
          location: DEFAULT_LOCATIONS[category],
          unit: DEFAULT_UNITS[category],
          shelfLifeDays: DEFAULT_SHELF_LIFE_DAYS[category],
        };
      } catch {
        continue;
      }
    }
    return undefined;
  }
}

export const productLookup: ProductLookup = new OpenFoodFactsLookup(new LocalProductLookup());
