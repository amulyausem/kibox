import type { Item, NewItemInput, StapleRule, HouseholdSettings } from '@/domain/types';

export interface InventoryRepository {
  list(): Promise<Item[]>;
  get(id: string): Promise<Item | undefined>;
  add(input: NewItemInput): Promise<Item>;
  update(id: string, patch: Partial<Omit<Item, 'id'>>): Promise<Item>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface StapleRepository {
  list(): Promise<StapleRule[]>;
  upsert(rule: StapleRule): Promise<StapleRule>;
  remove(id: string): Promise<void>;
  replaceAll(rules: StapleRule[]): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<HouseholdSettings>;
  save(settings: HouseholdSettings): Promise<void>;
}

export interface CandidateItem {
  name: string;
  category: Item['category'];
  location: Item['location'];
  unit: string;
  quantity: number;
  expiresInDays?: number;
  confidence: number;
  source: Item['source'];
  barcode?: string;
}

export interface IngestionSource {
  id: string;
  label: string;
  isStub: boolean;
  ingest(): Promise<CandidateItem[]>;
}

export interface ProductRecord {
  barcode: string;
  name: string;
  category: Item['category'];
  location: Item['location'];
  unit: string;
  shelfLifeDays: number;
}

export interface ProductLookup {
  lookup(barcode: string): Promise<ProductRecord | undefined>;
}

export interface ReorderProvider {
  id: 'instacart' | 'amazon' | 'walmart';
  label: string;
}

export interface ReorderHandoff {
  providers(): ReorderProvider[];
  open(itemName: string, provider: ReorderProvider): Promise<{ stubbed: boolean; message: string }>;
}
