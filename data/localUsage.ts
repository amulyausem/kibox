import { createId } from '@/domain/ids';
import type { UsageEvent } from '@/domain/types';
import { getDb, rowToUsage } from './db';

export class LocalUsageRepository {
  async list(): Promise<UsageEvent[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM usage_events ORDER BY usedAt DESC',
    );
    return rows.map(rowToUsage);
  }

  async add(itemName: string, usedAt = new Date().toISOString()): Promise<UsageEvent> {
    const event: UsageEvent = { id: createId(), itemName, usedAt };
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO usage_events (id, itemName, usedAt) VALUES (?, ?, ?)',
      event.id,
      event.itemName,
      event.usedAt,
    );
    return event;
  }

  async replaceAll(events: UsageEvent[]): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM usage_events');
      for (const event of events) {
        await db.runAsync(
          'INSERT INTO usage_events (id, itemName, usedAt) VALUES (?, ?, ?)',
          event.id,
          event.itemName,
          event.usedAt,
        );
      }
    });
  }
}
