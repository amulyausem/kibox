import { namesMatch } from './dates';
import type { ShoppingListItem } from './types';

export function formatShoppingList(items: ShoppingListItem[]): string {
  const open = items.filter((item) => !item.checked);
  const lines = open.map((item) => `- ${item.quantity} ${item.unit} ${item.name}`);
  return ['Kibox list', ...lines].join('\n');
}

export function shoppingListHasName(items: ShoppingListItem[], name: string): boolean {
  return items.some((item) => namesMatch(item.name, name));
}
