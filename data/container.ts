import { LocalInventoryRepository } from './localInventory';
import { LocalSettingsRepository } from './localSettings';
import { LocalStapleRepository } from './localStaples';
import type { InventoryRepository, SettingsRepository, StapleRepository } from './repositories';

/**
 * Swap these implementations for remote ones later — UI never talks to SQLite directly.
 */
export const inventoryRepo: InventoryRepository = new LocalInventoryRepository();
export const stapleRepo: StapleRepository = new LocalStapleRepository();
export const settingsRepo: SettingsRepository = new LocalSettingsRepository();
