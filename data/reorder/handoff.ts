import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { formatShoppingList } from '@/domain/shopping';
import type { ShoppingListItem } from '@/domain/types';
import { syncBaseUrl } from '../householdSync';
import type { ReorderHandoff, ReorderProvider } from '../repositories';

const PROVIDERS: ReorderProvider[] = [
  { id: 'instacart', label: 'Instacart' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'walmart', label: 'Walmart' },
];

function searchUrl(itemName: string, provider: ReorderProvider): string {
  const q = encodeURIComponent(itemName);
  switch (provider.id) {
    case 'instacart':
      return `https://www.instacart.com/store/s?k=${q}`;
    case 'amazon':
      return `https://www.amazon.com/s?k=${q}`;
    case 'walmart':
      return `https://www.walmart.com/search?q=${q}`;
  }
}

function instacartUnit(unit: string): string {
  const n = unit.trim().toLowerCase();
  if (['ea', 'each', 'pcs', 'pc', 'count'].includes(n)) return 'each';
  if (['dozen'].includes(n)) return 'each';
  if (['oz', 'ounce', 'ounces'].includes(n)) return 'ounce';
  if (['lb', 'pound', 'pounds'].includes(n)) return 'pound';
  return 'each';
}

export async function createInstacartListUrl(
  items: Pick<ShoppingListItem, 'name' | 'quantity' | 'unit'>[],
): Promise<string | undefined> {
  const lineItems = items
    .filter((item) => item.name.trim())
    .map((item) => ({
      name: item.name,
      quantity: item.quantity || 1,
      unit: instacartUnit(item.unit),
      display_text: `${item.quantity} ${item.unit} ${item.name}`,
    }));
  if (lineItems.length === 0) return undefined;

  const body = {
    title: 'Kibox list',
    link_type: 'shopping_list',
    expires_in: 14,
    line_items: lineItems,
    landing_page_configuration: {
      partner_linkback_url: 'kibox://list',
      enable_pantry_items: true,
    },
  };

  const proxy = syncBaseUrl();
  if (proxy) {
    const response = await fetch(`${proxy}/instacart/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await response.json()) as { url?: string; error?: string };
    if (response.ok && json.url) return json.url;
  }

  const key = process.env.EXPO_PUBLIC_INSTACART_API_KEY?.trim();
  if (!key) return undefined;
  const response = await fetch('https://connect.instacart.com/idp/v1/products/products_link', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as { products_link_url?: string };
  return json.products_link_url;
}

export class StoreSearchHandoff implements ReorderHandoff {
  providers(): ReorderProvider[] {
    return PROVIDERS;
  }

  async open(itemName: string, provider: ReorderProvider): Promise<{ stubbed: boolean; message: string }> {
    const url = searchUrl(itemName, provider);
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      await Linking.openURL(url);
    }
    return { stubbed: false, message: `Opened ${provider.label} for ${itemName}` };
  }
}

export const reorderHandoff: ReorderHandoff = new StoreSearchHandoff();

export function cartClipboardText(items: ShoppingListItem[]): string {
  return formatShoppingList(items);
}
