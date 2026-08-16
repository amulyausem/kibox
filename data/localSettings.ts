import { defaultSettings } from '@/domain/defaults';
import type { HouseholdSettings } from '@/domain/types';
import { getDb, parseSettings } from './db';
import type { SettingsRepository } from './repositories';

const SETTINGS_ID = 'default';

export class LocalSettingsRepository implements SettingsRepository {
  async get(): Promise<HouseholdSettings> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ json: string }>(
      'SELECT json FROM settings WHERE id = ?',
      SETTINGS_ID,
    );
    if (!row) return defaultSettings();
    return { ...defaultSettings(), ...parseSettings(row.json) };
  }

  async save(settings: HouseholdSettings): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO settings (id, json) VALUES (?, ?)
       ON CONFLICT(id) DO UPDATE SET json = excluded.json`,
      SETTINGS_ID,
      JSON.stringify(settings),
    );
  }
}
