import { LocalInventoryRepository } from './localInventory';
import { LocalSettingsRepository } from './localSettings';
import { LocalShoppingRepository } from './localShopping';
import { LocalStapleRepository } from './localStaples';
import { LocalUsageRepository } from './localUsage';
import { LocalWasteRepository } from './localWaste';
import type { InventoryRepository, SettingsRepository, StapleRepository } from './repositories';

/**
 * Swap these implementations for remote ones later — UI never talks to SQLite directly.
 */
export const inventoryRepo: InventoryRepository = new LocalInventoryRepository();
export const stapleRepo: StapleRepository = new LocalStapleRepository();
export const settingsRepo: SettingsRepository = new LocalSettingsRepository();
export const shoppingRepo = new LocalShoppingRepository();
export const wasteRepo = new LocalWasteRepository();
export const usageRepo = new LocalUsageRepository();
