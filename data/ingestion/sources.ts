import { FEATURES } from '../featureFlags';
import type { CandidateItem, IngestionSource } from '../repositories';

export class PhotoRecognitionSource implements IngestionSource {
  readonly id = 'photo';
  readonly label = 'Photo';
  readonly isStub = !FEATURES.realVisionRecognition;

  constructor(private readonly photoUri?: string) {}

  async ingest(): Promise<CandidateItem[]> {
    if (!FEATURES.realVisionRecognition) {
      // TODO: real vision model — send photoUri to on-device or cloud vision and map detections.
      void this.photoUri;
      return [
        {
          name: 'Tomatoes',
          category: 'produce',
          location: 'fridge',
          unit: 'pcs',
          quantity: 4,
          expiresInDays: 5,
          confidence: 0.78,
          source: 'photo',
        },
        {
          name: 'Cucumber',
          category: 'produce',
          location: 'fridge',
          unit: 'pcs',
          quantity: 2,
          expiresInDays: 6,
          confidence: 0.62,
          source: 'photo',
        },
      ];
    }
    // TODO: real vision model
    return [];
  }
}

export class ReceiptIngestionSource implements IngestionSource {
  readonly id = 'receipt-stub';
  readonly label = 'Last receipt';
  readonly isStub = !FEATURES.realReceiptParsing;

  async ingest(): Promise<CandidateItem[]> {
    // TODO: real integration — OCR a receipt photo or parse an emailed receipt.
    return [
      {
        name: 'Oat milk',
        category: 'dairy',
        location: 'fridge',
        unit: 'carton',
        quantity: 1,
        expiresInDays: 10,
        confidence: 0.64,
        source: 'receipt-stub',
      },
      {
        name: 'Coffee',
        category: 'pantry',
        location: 'pantry',
        unit: 'bag',
        quantity: 1,
        expiresInDays: 60,
        confidence: 0.58,
        source: 'receipt-stub',
      },
    ];
  }
}

export class LoyaltyIngestionSource implements IngestionSource {
  readonly id = 'loyalty-stub';
  readonly label = 'Store account';
  readonly isStub = !FEATURES.realLoyaltySync;

  async ingest(): Promise<CandidateItem[]> {
    // TODO: real integration — sync recent purchases from a grocery loyalty / store account.
    return [
      {
        name: 'Eggs',
        category: 'dairy',
        location: 'fridge',
        unit: 'dozen',
        quantity: 1,
        expiresInDays: 21,
        confidence: 0.71,
        source: 'loyalty-stub',
      },
      {
        name: 'Butter',
        category: 'dairy',
        location: 'fridge',
        unit: 'stick',
        quantity: 1,
        expiresInDays: 21,
        confidence: 0.66,
        source: 'loyalty-stub',
      },
    ];
  }
}
