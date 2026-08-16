import type { Category, HouseholdSettings, Location } from './types';

export const DEFAULT_LOCATIONS: Record<Category, Location> = {
  produce: 'fridge',
  dairy: 'fridge',
  meat: 'fridge',
  pantry: 'pantry',
  frozen: 'freezer',
  household: 'other',
  other: 'pantry',
};

export const DEFAULT_SHELF_LIFE_DAYS: Record<Category, number> = {
  produce: 5,
  dairy: 7,
  meat: 3,
  pantry: 180,
  frozen: 90,
  household: 365,
  other: 14,
};

export const DEFAULT_SOON_WINDOWS_DAYS: Record<Category, number> = {
  produce: 2,
  dairy: 3,
  meat: 2,
  pantry: 14,
  frozen: 21,
  household: 30,
  other: 5,
};

export const DEFAULT_UNITS: Record<Category, string> = {
  produce: 'pcs',
  dairy: 'ea',
  meat: 'pack',
  pantry: 'bag',
  frozen: 'bag',
  household: 'ea',
  other: 'ea',
};

export function defaultSettings(): HouseholdSettings {
  return {
    defaultLocations: { ...DEFAULT_LOCATIONS },
    notificationHour: 9,
    notificationMinute: 0,
    digestEnabled: true,
    units: 'imperial',
    seedDataEnabled: true,
    soonWindowsDays: { ...DEFAULT_SOON_WINDOWS_DAYS },
    shelfLifeDays: { ...DEFAULT_SHELF_LIFE_DAYS },
  };
}
