import { createId } from '@/domain/ids';
import type { ShoppingListItem } from '@/domain/types';
import { getDb, rowToShop } from './db';

export class LocalShoppingRepository {
  async list(): Promise<ShoppingListItem[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM shopping_list ORDER BY checked ASC, addedAt DESC',
    );
    return rows.map(rowToShop);
  }

  async add(input: Omit<ShoppingListItem, 'id' | 'addedAt'> & { addedAt?: string }): Promise<ShoppingListItem> {
    const item: ShoppingListItem = {
      id: createId(),
      name: input.name.trim(),
      quantity: input.quantity,
      unit: input.unit,
      checked: input.checked,
      pantryItemId: input.pantryItemId,
      addedAt: input.addedAt ?? new Date().toISOString(),
    };
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO shopping_list (id, name, quantity, unit, checked, pantryItemId, addedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      item.name,
      item.quantity,
      item.unit,
      item.checked ? 1 : 0,
      item.pantryItemId ?? null,
      item.addedAt,
    );
    return item;
  }

  async update(id: string, patch: Partial<Omit<ShoppingListItem, 'id'>>): Promise<ShoppingListItem> {
    const current = (await this.list()).find((row) => row.id === id);
    if (!current) throw new Error(`Shopping item ${id} not found`);
    const next = { ...current, ...patch, id };
    const db = await getDb();
    await db.runAsync(
      `UPDATE shopping_list SET name = ?, quantity = ?, unit = ?, checked = ?, pantryItemId = ?, addedAt = ? WHERE id = ?`,
      next.name,
      next.quantity,
      next.unit,
      next.checked ? 1 : 0,
      next.pantryItemId ?? null,
      next.addedAt,
      id,
    );
    return next;
  }

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM shopping_list WHERE id = ?', id);
  }

  async replaceAll(items: ShoppingListItem[]): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM shopping_list');
      for (const item of items) {
        await db.runAsync(
          `INSERT INTO shopping_list (id, name, quantity, unit, checked, pantryItemId, addedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          item.id,
          item.name,
          item.quantity,
          item.unit,
          item.checked ? 1 : 0,
          item.pantryItemId ?? null,
          item.addedAt,
        );
      }
    });
  }

  async clearChecked(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM shopping_list WHERE checked = 1');
  }
}
