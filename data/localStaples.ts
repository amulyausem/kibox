import { getDb, rowToRule } from './db';
import type { StapleRepository } from './repositories';
import type { StapleRule } from '@/domain/types';

export class LocalStapleRepository implements StapleRepository {
  async list(): Promise<StapleRule[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM staple_rules ORDER BY itemName',
    );
    return rows.map(rowToRule);
  }

  async upsert(rule: StapleRule): Promise<StapleRule> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO staple_rules (id, itemName, typicalIntervalDays, minQuantityThreshold, enabled)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         itemName = excluded.itemName,
         typicalIntervalDays = excluded.typicalIntervalDays,
         minQuantityThreshold = excluded.minQuantityThreshold,
         enabled = excluded.enabled`,
      rule.id,
      rule.itemName,
      rule.typicalIntervalDays ?? null,
      rule.minQuantityThreshold ?? null,
      rule.enabled ? 1 : 0,
    );
    return rule;
  }

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM staple_rules WHERE id = ?', id);
  }

  async replaceAll(rules: StapleRule[]): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM staple_rules');
      for (const rule of rules) {
        await db.runAsync(
          `INSERT INTO staple_rules (id, itemName, typicalIntervalDays, minQuantityThreshold, enabled)
           VALUES (?, ?, ?, ?, ?)`,
          rule.id,
          rule.itemName,
          rule.typicalIntervalDays ?? null,
          rule.minQuantityThreshold ?? null,
          rule.enabled ? 1 : 0,
        );
      }
    });
  }
}
