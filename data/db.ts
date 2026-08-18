import * as SQLite from 'expo-sqlite';
import type {
  Category,
  HouseholdSettings,
  Item,
  Location,
  ShoppingListItem,
  StapleRule,
  UsageEvent,
  WasteEvent,
} from '@/domain/types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDb();
  }
  return dbPromise;
}

async function openDb(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('kibox.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      location TEXT NOT NULL,
      addedAt TEXT NOT NULL,
      expiresAt TEXT,
      openedAt TEXT,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      confidence REAL,
      photoUri TEXT,
      barcode TEXT,
      flaggedForRestock INTEGER NOT NULL DEFAULT 0,
      lastPriceCents INTEGER
    );
    CREATE TABLE IF NOT EXISTS staple_rules (
      id TEXT PRIMARY KEY NOT NULL,
      itemName TEXT NOT NULL,
      typicalIntervalDays INTEGER,
      minQuantityThreshold REAL,
      enabled INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY NOT NULL,
      json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shopping_list (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      checked INTEGER NOT NULL DEFAULT 0,
      pantryItemId TEXT,
      addedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS waste_events (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      priceCents INTEGER,
      tossedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS usage_events (
      id TEXT PRIMARY KEY NOT NULL,
      itemName TEXT NOT NULL,
      usedAt TEXT NOT NULL
    );
  `);
  await ensureColumn(db, 'items', 'lastPriceCents', 'INTEGER');
  return db;
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  spec: string,
): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (cols.some((col) => col.name === column)) return;
  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${spec}`);
}

export function rowToItem(row: Record<string, unknown>): Item {
  return {
    id: String(row.id),
    name: String(row.name),
    category: row.category as Category,
    quantity: Number(row.quantity),
    unit: String(row.unit),
    location: row.location as Location,
    addedAt: String(row.addedAt),
    expiresAt: row.expiresAt ? String(row.expiresAt) : undefined,
    openedAt: row.openedAt ? String(row.openedAt) : undefined,
    source: row.source as Item['source'],
    status: row.status as Item['status'],
    confidence: row.confidence == null ? undefined : Number(row.confidence),
    photoUri: row.photoUri ? String(row.photoUri) : undefined,
    barcode: row.barcode ? String(row.barcode) : undefined,
    flaggedForRestock: Number(row.flaggedForRestock) === 1,
    lastPriceCents: row.lastPriceCents == null ? undefined : Number(row.lastPriceCents),
  };
}

export function rowToRule(row: Record<string, unknown>): StapleRule {
  return {
    id: String(row.id),
    itemName: String(row.itemName),
    typicalIntervalDays:
      row.typicalIntervalDays == null ? undefined : Number(row.typicalIntervalDays),
    minQuantityThreshold:
      row.minQuantityThreshold == null ? undefined : Number(row.minQuantityThreshold),
    enabled: Number(row.enabled) === 1,
  };
}

export function rowToShop(row: Record<string, unknown>): ShoppingListItem {
  return {
    id: String(row.id),
    name: String(row.name),
    quantity: Number(row.quantity),
    unit: String(row.unit),
    checked: Number(row.checked) === 1,
    pantryItemId: row.pantryItemId ? String(row.pantryItemId) : undefined,
    addedAt: String(row.addedAt),
  };
}

export function rowToWaste(row: Record<string, unknown>): WasteEvent {
  return {
    id: String(row.id),
    name: String(row.name),
    category: row.category as Category,
    quantity: Number(row.quantity),
    unit: String(row.unit),
    priceCents: row.priceCents == null ? undefined : Number(row.priceCents),
    tossedAt: String(row.tossedAt),
  };
}

export function rowToUsage(row: Record<string, unknown>): UsageEvent {
  return {
    id: String(row.id),
    itemName: String(row.itemName),
    usedAt: String(row.usedAt),
  };
}

export function parseSettings(json: string): Partial<HouseholdSettings> {
  return JSON.parse(json) as Partial<HouseholdSettings>;
}
