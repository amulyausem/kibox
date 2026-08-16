import { create } from 'zustand';
import { addDaysIso } from '@/domain/dates';
import { inferDepletionSuggestions } from '@/domain/confidence';
import { defaultSettings } from '@/domain/defaults';
import { guessFromName } from '@/domain/groceryCatalog';
import { createId } from '@/domain/ids';
import type { HouseholdSettings, Item, NewItemInput, StapleRule } from '@/domain/types';
import { inventoryRepo, settingsRepo, stapleRepo } from '@/data/container';
import { seedItems, seedStapleRules } from '@/data/seed';
import { syncDailyDigest } from './notifications';

interface AppState {
  items: Item[];
  rules: StapleRule[];
  settings: HouseholdSettings;
  loaded: boolean;
  toast?: string;
  hydrate: () => Promise<void>;
  addItem: (input: NewItemInput) => Promise<Item>;
  quickAddByName: (name: string) => Promise<Item>;
  updateItem: (id: string, patch: Partial<Omit<Item, 'id'>>) => Promise<void>;
  confirmItem: (id: string) => Promise<void>;
  dismissItem: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  markUsed: (id: string) => Promise<void>;
  saveSettings: (patch: Partial<HouseholdSettings>) => Promise<void>;
  upsertRule: (rule: StapleRule) => Promise<void>;
  removeRule: (id: string) => Promise<void>;
  resetSeed: () => Promise<void>;
  addCandidatesAsSuggested: (count: (now: Date) => NewItemInput[]) => Promise<void>;
  setToast: (toast?: string) => void;
}

async function persistNotify(
  items: Item[],
  rules: StapleRule[],
  settings: HouseholdSettings,
): Promise<void> {
  try {
    await syncDailyDigest(items, rules, settings);
  } catch {
    // Notifications are optional on simulator / web.
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  items: [],
  rules: [],
  settings: defaultSettings(),
  loaded: false,
  toast: undefined,

  setToast: (toast) => set({ toast }),

  hydrate: async () => {
    let settings = await settingsRepo.get();
    let items = await inventoryRepo.list();
    let rules = await stapleRepo.list();

    if (settings.seedDataEnabled && items.length === 0) {
      const seeded = seedItems();
      const seededRules = seedStapleRules();
      for (const item of seeded) {
        await inventoryRepo.add({ ...item });
      }
      await stapleRepo.replaceAll(seededRules);
      items = await inventoryRepo.list();
      rules = await stapleRepo.list();
    }

    const drafts = inferDepletionSuggestions(items, rules, new Date(), settings);
    for (const draft of drafts) {
      if (items.some((item) => item.name.toLowerCase() === draft.name.toLowerCase())) continue;
      const created = await inventoryRepo.add({
        name: draft.name,
        category: draft.category,
        quantity: 1,
        unit: draft.unit,
        location: draft.location,
        source: 'heuristic',
        status: 'suggested',
        confidence: draft.confidence,
        flaggedForRestock: draft.reason === 'probably_low',
      });
      items = [created, ...items];
    }

    set({ items, rules, settings, loaded: true });
    await persistNotify(items, rules, settings);
  },

  addItem: async (input) => {
    const item = await inventoryRepo.add(input);
    const items = [item, ...get().items];
    set({ items, toast: `Added ${item.name}` });
    await persistNotify(items, get().rules, get().settings);
    return item;
  },

  quickAddByName: async (name) => {
    const catalog = guessFromName(name);
    const now = new Date();
    const category = catalog?.category ?? 'other';
    const location = catalog?.location ?? get().settings.defaultLocations[category];
    const unit = catalog?.unit ?? 'ea';
    const shelf = catalog?.shelfLifeDays ?? get().settings.shelfLifeDays[category];
    return get().addItem({
      name: catalog?.name ?? name.trim(),
      category,
      quantity: 1,
      unit,
      location,
      expiresAt: addDaysIso(now, shelf),
      source: 'manual',
      status: 'confirmed',
    });
  },

  updateItem: async (id, patch) => {
    const updated = await inventoryRepo.update(id, patch);
    const items = get().items.map((item) => (item.id === id ? updated : item));
    set({ items });
    await persistNotify(items, get().rules, get().settings);
  },

  confirmItem: async (id) => {
    await get().updateItem(id, { status: 'confirmed', confidence: undefined });
    const item = get().items.find((row) => row.id === id);
    set({ toast: item ? `Confirmed ${item.name}` : 'Confirmed' });
  },

  dismissItem: async (id) => {
    await inventoryRepo.remove(id);
    const items = get().items.filter((item) => item.id !== id);
    set({ items, toast: 'Dismissed' });
    await persistNotify(items, get().rules, get().settings);
  },

  removeItem: async (id) => {
    await inventoryRepo.remove(id);
    const items = get().items.filter((item) => item.id !== id);
    set({ items });
    await persistNotify(items, get().rules, get().settings);
  },

  markUsed: async (id) => {
    const item = get().items.find((row) => row.id === id);
    if (!item) return;
    if (item.quantity <= 1) {
      await get().removeItem(id);
      set({ toast: `Used last of ${item.name}` });
      return;
    }
    await get().updateItem(id, { quantity: item.quantity - 1, openedAt: new Date().toISOString() });
    set({ toast: `Used ${item.name}` });
  },

  saveSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    await settingsRepo.save(settings);
    set({ settings });
    await persistNotify(get().items, get().rules, settings);
  },

  upsertRule: async (rule) => {
    const saved = await stapleRepo.upsert(rule.id ? rule : { ...rule, id: createId() });
    const existing = get().rules.some((row) => row.id === saved.id);
    const rules = existing
      ? get().rules.map((row) => (row.id === saved.id ? saved : row))
      : [...get().rules, saved];
    set({ rules });
    await persistNotify(get().items, rules, get().settings);
  },

  removeRule: async (id) => {
    await stapleRepo.remove(id);
    const rules = get().rules.filter((row) => row.id !== id);
    set({ rules });
  },

  resetSeed: async () => {
    await inventoryRepo.clear();
    const seeded = seedItems();
    const seededRules = seedStapleRules();
    for (const item of seeded) {
      await inventoryRepo.add({ ...item });
    }
    await stapleRepo.replaceAll(seededRules);
    const items = await inventoryRepo.list();
    const rules = await stapleRepo.list();
    await get().saveSettings({ seedDataEnabled: true });
    set({ items, rules, toast: 'Sample pantry restored' });
    await persistNotify(items, rules, get().settings);
  },

  addCandidatesAsSuggested: async (build) => {
    const now = new Date();
    const inputs = build(now);
    const created: Item[] = [];
    for (const input of inputs) {
      created.push(await inventoryRepo.add(input));
    }
    const items = [...created, ...get().items];
    set({ items, toast: `Added ${created.length} to confirm` });
  },
}));
