import { createId } from '@/domain/ids';
import type { Item, NewItemInput } from '@/domain/types';
import { getDb, rowToItem } from './db';
import type { InventoryRepository } from './repositories';

export class LocalInventoryRepository implements InventoryRepository {
  async list(): Promise<Item[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM items ORDER BY addedAt DESC',
    );
    return rows.map(rowToItem);
  }

  async get(id: string): Promise<Item | undefined> {
    const db = await getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM items WHERE id = ?',
      id,
    );
    return row ? rowToItem(row) : undefined;
  }

  async add(input: NewItemInput): Promise<Item> {
    const item: Item = {
      id: createId(),
      name: input.name.trim(),
      category: input.category,
      quantity: input.quantity,
      unit: input.unit,
      location: input.location,
      addedAt: input.addedAt ?? new Date().toISOString(),
      expiresAt: input.expiresAt,
      openedAt: input.openedAt,
      source: input.source,
      status: input.status,
      confidence: input.confidence,
      photoUri: input.photoUri,
      barcode: input.barcode,
      flaggedForRestock: input.flaggedForRestock ?? false,
      lastPriceCents: input.lastPriceCents,
    };
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO items (
        id, name, category, quantity, unit, location, addedAt, expiresAt, openedAt,
        source, status, confidence, photoUri, barcode, flaggedForRestock, lastPriceCents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      item.name,
      item.category,
      item.quantity,
      item.unit,
      item.location,
      item.addedAt,
      item.expiresAt ?? null,
      item.openedAt ?? null,
      item.source,
      item.status,
      item.confidence ?? null,
      item.photoUri ?? null,
      item.barcode ?? null,
      item.flaggedForRestock ? 1 : 0,
      item.lastPriceCents ?? null,
    );
    return item;
  }

  async update(id: string, patch: Partial<Omit<Item, 'id'>>): Promise<Item> {
    const current = await this.get(id);
    if (!current) throw new Error(`Item ${id} not found`);
    const next: Item = { ...current, ...patch, id };
    const db = await getDb();
    await db.runAsync(
      `UPDATE items SET
        name = ?, category = ?, quantity = ?, unit = ?, location = ?, addedAt = ?,
        expiresAt = ?, openedAt = ?, source = ?, status = ?, confidence = ?,
        photoUri = ?, barcode = ?, flaggedForRestock = ?, lastPriceCents = ?
      WHERE id = ?`,
      next.name,
      next.category,
      next.quantity,
      next.unit,
      next.location,
      next.addedAt,
      next.expiresAt ?? null,
      next.openedAt ?? null,
      next.source,
      next.status,
      next.confidence ?? null,
      next.photoUri ?? null,
      next.barcode ?? null,
      next.flaggedForRestock ? 1 : 0,
      next.lastPriceCents ?? null,
      id,
    );
    return next;
  }

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM items WHERE id = ?', id);
  }

  async clear(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM items');
  }
}
