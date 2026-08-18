import { FEATURES } from '../featureFlags';
import type { CandidateItem, IngestionSource } from '../repositories';
import { parsePantryPhoto, parseReceiptPhoto, parseReceiptText, resolveVisionApiKey, visionProxyUrl } from './receiptParser';

function hasVision(): boolean {
  return Boolean(visionProxyUrl() || resolveVisionApiKey());
}

export class PhotoRecognitionSource implements IngestionSource {
  readonly id = 'photo';
  readonly label = 'Photo';
  readonly isStub = !FEATURES.realVisionRecognition;

  constructor(private readonly photoUri?: string) {}

  async ingest(): Promise<CandidateItem[]> {
    if (!this.photoUri) throw new Error('Take a photo of the groceries first.');
    if (!hasVision()) {
      throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY in .env. Restart Expo after adding it.');
    }
    const items = await parsePantryPhoto(this.photoUri);
    if (items.length === 0) {
      throw new Error('Could not recognize groceries in that photo. Try a closer shot.');
    }
    return items;
  }
}

export class ReceiptIngestionSource implements IngestionSource {
  readonly id = 'receipt-stub';
  readonly label = 'Receipt';
  readonly isStub = false;

  constructor(private readonly photoUri?: string) {}

  async ingest(): Promise<CandidateItem[]> {
    if (!this.photoUri) {
      throw new Error('Take a photo of the receipt first.');
    }
    if (!hasVision()) {
      throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY in .env. Restart Expo after adding it.');
    }
    const items = await parseReceiptPhoto(this.photoUri);
    if (items.length === 0) {
      throw new Error('Could not find grocery items on that receipt. Try a clearer photo.');
    }
    return items;
  }
}

export class TextReceiptSource implements IngestionSource {
  readonly id = 'receipt-stub';
  readonly label = 'Pasted receipt';
  readonly isStub = false;

  constructor(private readonly text: string) {}

  async ingest(): Promise<CandidateItem[]> {
    const trimmed = this.text.trim();
    if (trimmed.length < 8) throw new Error('Paste more of the receipt text.');
    const items = await parseReceiptText(trimmed);
    if (items.length === 0) {
      throw new Error('Could not find grocery lines in that text.');
    }
    return items;
  }
}
