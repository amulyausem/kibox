import { GROCERY_CATALOG } from '@/domain/groceryCatalog';
import { FEATURES } from '../featureFlags';
import type { ProductLookup, ProductRecord } from '../repositories';

const LOCAL_BARCODES: Record<string, string> = {
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

/**
 * TODO: real integration — call Open Food Facts (https://world.openfoodfacts.org/api/v2/product/{barcode}.json)
 * and map product_name / categories_tags into ProductRecord. Keep LocalProductLookup as fallback.
 */
export class OpenFoodFactsLookup implements ProductLookup {
  constructor(private readonly fallback: ProductLookup) {}

  async lookup(barcode: string): Promise<ProductRecord | undefined> {
    if (!FEATURES.realProductLookup) {
      return this.fallback.lookup(barcode);
    }
    // TODO: real integration
    return this.fallback.lookup(barcode);
  }
}

export const productLookup: ProductLookup = new OpenFoodFactsLookup(new LocalProductLookup());
