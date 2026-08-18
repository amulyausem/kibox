import type { Item, ShoppingListItem } from '@/domain/types';
import type { HouseholdSettings } from '@/domain/types';
import { homeWidgetProps } from '@/domain/homeWidget';

export type { HomeWidgetProps } from '@/domain/homeWidget';
export { homeWidgetProps };

export async function publishHomeWidget(
  items: Item[],
  shopping: ShoppingListItem[],
  settings: HouseholdSettings,
): Promise<void> {
  try {
    const widget = await import('@/widgets/KiboxToday');
    await widget.default.updateSnapshot(homeWidgetProps(items, shopping, settings));
  } catch {
    // Expo Go and web have no widget extension.
  }
}
