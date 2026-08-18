import { guessFromName } from '@/domain/groceryCatalog';
import { DEFAULT_LOCATIONS, DEFAULT_UNITS } from '@/domain/defaults';
import type { CandidateItem, IngestionSource } from '../repositories';

/** Local, real source — typeahead / free-text add. */
export class ManualIngestionSource implements IngestionSource {
  readonly id = 'manual';
  readonly label = 'Manual';
  readonly isStub = false;

  constructor(
    private readonly name: string,
    private readonly quantity: number,
  ) {}

  async ingest(): Promise<CandidateItem[]> {
    const catalog = guessFromName(this.name);
    const category = catalog?.category ?? 'other';
    return [
      {
        name: catalog?.name ?? this.name.trim(),
        category,
        location: catalog?.location ?? DEFAULT_LOCATIONS[category],
        unit: catalog?.unit ?? DEFAULT_UNITS[category],
        quantity: this.quantity,
        expiresInDays: catalog?.shelfLifeDays,
        confidence: 1,
        source: 'manual',
      },
    ];
  }
}
