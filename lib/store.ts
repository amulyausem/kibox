import { create } from 'zustand';
import { addDaysIso, namesMatch } from '@/domain/dates';
import { inferDepletionSuggestions } from '@/domain/confidence';
import { defaultSettings } from '@/domain/defaults';
import { guessFromName } from '@/domain/groceryCatalog';
import { createId, makeDeviceId } from '@/domain/ids';
import { remoteIsNewer } from '@/domain/household';
import { publishHomeWidget } from './homeWidget';
import { createHouseholdRemote, pullHousehold, pushHousehold, syncBaseUrl } from '@/data/householdSync';
import { BACKUP_VERSION, parseBackup, type HouseholdBackup } from '@/domain/backup';
import { shoppingListHasName } from '@/domain/shopping';
import { applyLearnedInterval, learnedIntervalDays } from '@/domain/staplesLearn';
import { runningLowRules } from '@/domain/restock';
import type {
  HouseholdSettings,
  Item,
  NewItemInput,
  ShoppingListItem,
  StapleRule,
  UsageEvent,
  WasteEvent,
} from '@/domain/types';
import {
  inventoryRepo,
  settingsRepo,
  shoppingRepo,
  stapleRepo,
  usageRepo,
  wasteRepo,
} from '@/data/container';
import { seedItems, seedStapleRules } from '@/data/seed';
import { syncDailyDigest } from './notifications';

interface AppState {
  items: Item[];
  rules: StapleRule[];
  settings: HouseholdSettings;
  shopping: ShoppingListItem[];
  waste: WasteEvent[];
  usage: UsageEvent[];
  loaded: boolean;
  toast?: string;
  hydrate: () => Promise<void>;
  addItem: (input: NewItemInput) => Promise<Item>;
  quickAddByName: (name: string) => Promise<Item>;
  updateItem: (id: string, patch: Partial<Omit<Item, 'id'>>) => Promise<void>;
  confirmItem: (id: string) => Promise<void>;
  dismissItem: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  tossItem: (id: string) => Promise<void>;
  markUsed: (id: string) => Promise<void>;
  saveSettings: (patch: Partial<HouseholdSettings>) => Promise<void>;
  completeOnboarding: (opts: { seed: boolean }) => Promise<void>;
  upsertRule: (rule: StapleRule) => Promise<void>;
  removeRule: (id: string) => Promise<void>;
  resetSeed: () => Promise<void>;
  addCandidatesAsSuggested: (count: (now: Date) => NewItemInput[]) => Promise<void>;
  confirmAllSuggested: () => Promise<void>;
  addToShopping: (name: string, quantity?: number, unit?: string, pantryItemId?: string) => Promise<void>;
  toggleShopping: (id: string) => Promise<void>;
  removeShopping: (id: string) => Promise<void>;
  clearCheckedShopping: () => Promise<void>;
  buyShoppingIntoPantry: () => Promise<void>;
  exportBackup: () => HouseholdBackup;
  importBackup: (raw: string, opts?: { silent?: boolean }) => Promise<void>;
  createHousehold: () => Promise<string>;
  joinHousehold: (code: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  pullHouseholdNow: () => Promise<void>;
  setToast: (toast?: string) => void;
}

async function persistNotify(
  items: Item[],
  rules: StapleRule[],
  settings: HouseholdSettings,
  shopping: ShoppingListItem[] = [],
  waste: WasteEvent[] = [],
): Promise<void> {
  try {
    await syncDailyDigest(items, rules, settings);
  } catch {
    // Notifications are optional on simulator / web.
  }
  try {
    await publishHomeWidget(items, shopping, settings);
  } catch {
    // Widgets need a native build.
  }
  if (settings.householdCode && syncBaseUrl() && settings.deviceId) {
    try {
      await pushHousehold(settings.householdCode, settings.deviceId, {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        items,
        rules,
        settings,
        shopping,
        waste,
      });
    } catch {
      // Sync is best-effort while offline.
    }
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  items: [],
  rules: [],
  settings: defaultSettings(),
  shopping: [],
  waste: [],
  usage: [],
  loaded: false,
  toast: undefined,

  setToast: (toast) => set({ toast }),

  hydrate: async () => {
    let settings = await settingsRepo.get();
    if (!settings.deviceId) {
      settings = { ...settings, deviceId: makeDeviceId() };
      await settingsRepo.save(settings);
    }
    let items = await inventoryRepo.list();
    let rules = await stapleRepo.list();
    let shopping = await shoppingRepo.list();
    const waste = await wasteRepo.list();
    const usage = await usageRepo.list();

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

    const now = new Date();
    const low = runningLowRules(
      items.filter((item) => item.status === 'confirmed'),
      rules,
      now,
    );
    for (const rule of low) {
      if (shoppingListHasName(shopping, rule.itemName)) continue;
      shopping = [
        await shoppingRepo.add({
          name: rule.itemName,
          quantity: 1,
          unit: 'ea',
          checked: false,
        }),
        ...shopping,
      ];
    }
    for (const item of items.filter((row) => row.flaggedForRestock && row.status === 'confirmed')) {
      if (shoppingListHasName(shopping, item.name)) continue;
      shopping = [
        await shoppingRepo.add({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          checked: false,
          pantryItemId: item.id,
        }),
        ...shopping,
      ];
    }

    set({ items, rules, settings, shopping, waste, usage, loaded: true });
    await persistNotify(items, rules, settings, shopping, waste);
  },

  addItem: async (input) => {
    if (input.status === 'confirmed') {
      const existing = get().items.find(
        (item) =>
          item.status === 'confirmed' &&
          namesMatch(item.name, input.name) &&
          item.location === input.location,
      );
      if (existing) {
        const updated = await inventoryRepo.update(existing.id, {
          quantity: existing.quantity + input.quantity,
          lastPriceCents: input.lastPriceCents ?? existing.lastPriceCents,
        });
        const items = get().items.map((item) => (item.id === existing.id ? updated : item));
        set({ items, toast: `Updated ${updated.name}` });
        await persistNotify(items, get().rules, get().settings, get().shopping, get().waste);
        return updated;
      }
    }
    const item = await inventoryRepo.add(input);
    const items = [item, ...get().items];
    set({ items, toast: `Added ${item.name}` });
    await persistNotify(items, get().rules, get().settings, get().shopping, get().waste);
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
    if (patch.flaggedForRestock === true) {
      const current = get().items.find((row) => row.id === id);
      if (current && !shoppingListHasName(get().shopping, current.name)) {
        await get().addToShopping(current.name, current.quantity, current.unit, current.id);
      }
    }
    const updated = await inventoryRepo.update(id, patch);
    const items = get().items.map((item) => (item.id === id ? updated : item));
    set({ items });
    await persistNotify(items, get().rules, get().settings, get().shopping, get().waste);
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
    await persistNotify(items, get().rules, get().settings, get().shopping, get().waste);
  },

  removeItem: async (id) => {
    await inventoryRepo.remove(id);
    const items = get().items.filter((item) => item.id !== id);
    set({ items });
    await persistNotify(items, get().rules, get().settings, get().shopping, get().waste);
  },

  tossItem: async (id) => {
    const item = get().items.find((row) => row.id === id);
    if (!item) return;
    const event = await wasteRepo.add({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      priceCents: item.lastPriceCents,
      tossedAt: new Date().toISOString(),
    });
    await inventoryRepo.remove(id);
    const items = get().items.filter((row) => row.id !== id);
    set({ items, waste: [event, ...get().waste], toast: `Tossed ${item.name}` });
    await persistNotify(items, get().rules, get().settings, get().shopping, get().waste);
  },

  markUsed: async (id) => {
    const item = get().items.find((row) => row.id === id);
    if (!item) return;
    const usageEvent = await usageRepo.add(item.name);
    const usage = [usageEvent, ...get().usage];
    const match = get().rules.find((rule) => namesMatch(rule.itemName, item.name));
    if (match) {
      const learned = learnedIntervalDays(usage, item.name);
      const next = applyLearnedInterval(match, learned);
      if (next.typicalIntervalDays !== match.typicalIntervalDays) {
        await stapleRepo.upsert(next);
        set({ rules: get().rules.map((rule) => (rule.id === next.id ? next : rule)) });
      }
    }
    if (item.quantity <= 1) {
      await inventoryRepo.remove(id);
      const items = get().items.filter((row) => row.id !== id);
      set({ items, usage, toast: `Used last of ${item.name}` });
      await persistNotify(items, get().rules, get().settings, get().shopping, get().waste);
      return;
    }
    const updated = await inventoryRepo.update(id, {
      quantity: item.quantity - 1,
      openedAt: new Date().toISOString(),
    });
    const items = get().items.map((row) => (row.id === id ? updated : row));
    set({ items, usage, toast: `Used ${item.name}` });
    await persistNotify(items, get().rules, get().settings, get().shopping, get().waste);
  },

  saveSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    await settingsRepo.save(settings);
    set({ settings });
    await persistNotify(get().items, get().rules, settings, get().shopping, get().waste);
  },

  completeOnboarding: async ({ seed }) => {
    await get().saveSettings({ onboardingDone: true, seedDataEnabled: seed, visionConsent: true });
    if (seed && get().items.length === 0) {
      await get().resetSeed();
    }
  },

  upsertRule: async (rule) => {
    const saved = await stapleRepo.upsert(rule.id ? rule : { ...rule, id: createId() });
    const existing = get().rules.some((row) => row.id === saved.id);
    const rules = existing
      ? get().rules.map((row) => (row.id === saved.id ? saved : row))
      : [...get().rules, saved];
    set({ rules });
    await persistNotify(get().items, rules, get().settings, get().shopping, get().waste);
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
    await persistNotify(items, rules, get().settings, get().shopping, get().waste);
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
    await persistNotify(items, get().rules, get().settings, get().shopping, get().waste);
  },

  confirmAllSuggested: async () => {
    const suggested = get().items.filter((item) => item.status === 'suggested');
    for (const item of suggested) {
      await inventoryRepo.update(item.id, { status: 'confirmed', confidence: undefined });
    }
    const items = get().items.map((item) =>
      item.status === 'suggested' ? { ...item, status: 'confirmed' as const, confidence: undefined } : item,
    );
    set({ items, toast: `Confirmed ${suggested.length}` });
    await persistNotify(items, get().rules, get().settings, get().shopping, get().waste);
  },

  addToShopping: async (name, quantity = 1, unit = 'ea', pantryItemId) => {
    if (shoppingListHasName(get().shopping, name)) {
      set({ toast: `${name} is already on the list` });
      return;
    }
    const item = await shoppingRepo.add({
      name,
      quantity,
      unit,
      checked: false,
      pantryItemId,
    });
    set({ shopping: [item, ...get().shopping], toast: `Added ${name} to list` });
    await persistNotify(get().items, get().rules, get().settings, get().shopping, get().waste);
  },

  toggleShopping: async (id) => {
    const current = get().shopping.find((row) => row.id === id);
    if (!current) return;
    const updated = await shoppingRepo.update(id, { checked: !current.checked });
    const shopping = get().shopping.map((row) => (row.id === id ? updated : row));
    set({ shopping });
    await persistNotify(get().items, get().rules, get().settings, shopping, get().waste);
  },

  removeShopping: async (id) => {
    await shoppingRepo.remove(id);
    const shopping = get().shopping.filter((row) => row.id !== id);
    set({ shopping });
    await persistNotify(get().items, get().rules, get().settings, shopping, get().waste);
  },

  clearCheckedShopping: async () => {
    await shoppingRepo.clearChecked();
    const shopping = get().shopping.filter((row) => !row.checked);
    set({ shopping });
    await persistNotify(get().items, get().rules, get().settings, shopping, get().waste);
  },

  buyShoppingIntoPantry: async () => {
    const checked = get().shopping.filter((row) => row.checked);
    for (const row of checked) {
      await get().quickAddByName(row.name);
    }
    await get().clearCheckedShopping();
    set({ toast: checked.length ? `Added ${checked.length} to pantry` : 'Nothing checked' });
  },

  exportBackup: () => ({
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    items: get().items,
    rules: get().rules,
    settings: get().settings,
    shopping: get().shopping,
    waste: get().waste,
  }),

  importBackup: async (raw, opts) => {
    const backup = parseBackup(raw);
    await inventoryRepo.clear();
    for (const item of backup.items) {
      await inventoryRepo.add({ ...item, addedAt: item.addedAt });
    }
    await stapleRepo.replaceAll(backup.rules);
    await shoppingRepo.replaceAll(backup.shopping);
    await wasteRepo.replaceAll(backup.waste);
    if (backup.settings) {
      const keep = {
        deviceId: get().settings.deviceId,
        householdCode: get().settings.householdCode,
      };
      await settingsRepo.save({
        ...defaultSettings(),
        ...backup.settings,
        ...keep,
        onboardingDone: true,
      });
    }
    const items = await inventoryRepo.list();
    const rules = await stapleRepo.list();
    const shopping = await shoppingRepo.list();
    const waste = await wasteRepo.list();
    const settings = await settingsRepo.get();
    set({ items, rules, shopping, waste, settings, toast: opts?.silent ? undefined : 'Backup restored' });
    await persistNotify(items, rules, settings, shopping, waste);
  },

  createHousehold: async () => {
    const code = await createHouseholdRemote();
    await get().saveSettings({ householdCode: code, lastPushedAt: new Date().toISOString() });
    set({ toast: `Household ${code}` });
    return code;
  },

  joinHousehold: async (code) => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) throw new Error('Enter the household code.');
    if (!syncBaseUrl()) throw new Error('Set EXPO_PUBLIC_SYNC_URL to the companion server.');
    const settings = { ...get().settings, householdCode: trimmed };
    await settingsRepo.save(settings);
    set({ settings });
    const remote = await pullHousehold(trimmed);
    if (remote?.snapshot && remote.deviceId !== settings.deviceId) {
      await get().importBackup(JSON.stringify(remote.snapshot), { silent: true });
      await settingsRepo.save({
        ...get().settings,
        householdCode: trimmed,
        lastPulledAt: remote.snapshot.exportedAt,
      });
      set({
        settings: {
          ...get().settings,
          householdCode: trimmed,
          lastPulledAt: remote.snapshot.exportedAt,
        },
        toast: `Joined ${trimmed}`,
      });
      return;
    }
    await persistNotify(get().items, get().rules, get().settings, get().shopping, get().waste);
    set({ toast: `Joined ${trimmed}` });
  },

  leaveHousehold: async () => {
    await get().saveSettings({ householdCode: undefined, lastPulledAt: undefined, lastPushedAt: undefined });
    set({ toast: 'Left household' });
  },

  pullHouseholdNow: async () => {
    const code = get().settings.householdCode;
    if (!code) return;
    const remote = await pullHousehold(code);
    if (!remote?.snapshot) return;
    if (remote.deviceId && remote.deviceId === get().settings.deviceId) return;
    if (!remoteIsNewer(get().settings.lastPulledAt, remote.snapshot.exportedAt)) return;
    await get().importBackup(JSON.stringify(remote.snapshot), { silent: true });
    await get().saveSettings({
      householdCode: code,
      lastPulledAt: remote.snapshot.exportedAt,
    });
  },
}));
