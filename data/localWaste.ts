import { createId } from '@/domain/ids';
import type { WasteEvent } from '@/domain/types';
import { getDb, rowToWaste } from './db';

export class LocalWasteRepository {
  async list(): Promise<WasteEvent[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM waste_events ORDER BY tossedAt DESC',
    );
    return rows.map(rowToWaste);
  }

  async add(input: Omit<WasteEvent, 'id'>): Promise<WasteEvent> {
    const event: WasteEvent = { ...input, id: createId() };
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO waste_events (id, name, category, quantity, unit, priceCents, tossedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      event.id,
      event.name,
      event.category,
      event.quantity,
      event.unit,
      event.priceCents ?? null,
      event.tossedAt,
    );
    return event;
  }

  async replaceAll(events: WasteEvent[]): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM waste_events');
      for (const event of events) {
        await db.runAsync(
          `INSERT INTO waste_events (id, name, category, quantity, unit, priceCents, tossedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          event.id,
          event.name,
          event.category,
          event.quantity,
          event.unit,
          event.priceCents ?? null,
          event.tossedAt,
        );
      }
    });
  }
}
