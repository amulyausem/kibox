export const CATEGORIES = [
  'produce',
  'dairy',
  'meat',
  'pantry',
  'frozen',
  'household',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const LOCATIONS = ['fridge', 'freezer', 'pantry', 'other'] as const;
export type Location = (typeof LOCATIONS)[number];

export const ITEM_SOURCES = [
  'manual',
  'barcode',
  'photo',
  'receipt-stub',
  'loyalty-stub',
  'heuristic',
] as const;
export type ItemSource = (typeof ITEM_SOURCES)[number];

export const ITEM_STATUSES = ['confirmed', 'suggested'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export type ExpiryStatus = 'fresh' | 'expiring_soon' | 'expired' | 'unknown';

export interface Item {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  location: Location;
  addedAt: string;
  expiresAt?: string;
  openedAt?: string;
  source: ItemSource;
  status: ItemStatus;
  confidence?: number;
  photoUri?: string;
  barcode?: string;
  flaggedForRestock: boolean;
  lastPriceCents?: number;
}

export interface StapleRule {
  id: string;
  itemName: string;
  typicalIntervalDays?: number;
  minQuantityThreshold?: number;
  enabled: boolean;
}

export interface HouseholdSettings {
  defaultLocations: Record<Category, Location>;
  notificationHour: number;
  notificationMinute: number;
  digestEnabled: boolean;
  units: 'imperial' | 'metric';
  seedDataEnabled: boolean;
  soonWindowsDays: Record<Category, number>;
  shelfLifeDays: Record<Category, number>;
  openedShelfLifeDays: Record<Category, number>;
  onboardingDone: boolean;
  visionConsent: boolean;
  deviceId: string;
  householdCode?: string;
  lastPushedAt?: string;
  lastPulledAt?: string;
}

export interface NewItemInput {
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  location: Location;
  expiresAt?: string;
  openedAt?: string;
  source: ItemSource;
  status: ItemStatus;
  confidence?: number;
  photoUri?: string;
  barcode?: string;
  flaggedForRestock?: boolean;
  addedAt?: string;
  lastPriceCents?: number;
}

export type ItemPatch = Partial<Omit<Item, 'id'>>;

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  pantryItemId?: string;
  addedAt: string;
}

export interface WasteEvent {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  priceCents?: number;
  tossedAt: string;
}

export interface UsageEvent {
  id: string;
  itemName: string;
  usedAt: string;
}
