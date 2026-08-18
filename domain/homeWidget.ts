import type { Item, ShoppingListItem } from './types';
import { getExpiryStatus } from './expiry';
import { defaultSettings } from './defaults';
import type { HouseholdSettings } from './types';

export interface HomeWidgetProps {
  title: string;
  line1: string;
  line2: string;
  line3: string;
}

export function homeWidgetProps(
  items: Item[],
  shopping: ShoppingListItem[],
  settings: HouseholdSettings = defaultSettings(),
  now = new Date(),
): HomeWidgetProps {
  const confirmed = items.filter((item) => item.status === 'confirmed');
  const soon = confirmed.filter((item) => {
    const status = getExpiryStatus(item, now, settings);
    return status === 'expiring_soon' || status === 'expired';
  });
  const openList = shopping.filter((row) => !row.checked);
  const headline =
    soon.length === 0 && openList.length === 0
      ? 'Pantry looks fine'
      : soon.length
        ? `${soon.length} to use`
        : `${openList.length} to buy`;
  return {
    title: headline,
    line1: soon[0]?.name ?? openList[0]?.name ?? 'Add groceries in Kibox',
    line2: soon[1]?.name ?? openList[1]?.name ?? '',
    line3: openList.length ? `List · ${openList.length}` : `${confirmed.length} in pantry`,
  };
}
