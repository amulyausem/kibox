import type { ProductLookup, CandidateItem, IngestionSource } from '../repositories';

/** Local barcode source. Lookup is injected so Open Food Facts can replace it later. */
export class BarcodeIngestionSource implements IngestionSource {
  readonly id = 'barcode';
  readonly label = 'Barcode';
  readonly isStub = false;

  constructor(
    private readonly barcode: string,
    private readonly lookup: ProductLookup,
  ) {}

  async ingest(): Promise<CandidateItem[]> {
    const product = await this.lookup.lookup(this.barcode.trim());
    if (!product) return [];
    return [
      {
        name: product.name,
        category: product.category,
        location: product.location,
        unit: product.unit,
        quantity: 1,
        expiresInDays: product.shelfLifeDays,
        confidence: 1,
        source: 'barcode',
        barcode: product.barcode,
      },
    ];
  }
}
