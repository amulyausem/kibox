import { Alert, Clipboard, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { createInstacartListUrl, reorderHandoff, cartClipboardText } from '@/data/reorder/handoff';
import type { ShoppingListItem } from '@/domain/types';

export function openRestock(name: string): void {
  const providers = reorderHandoff.providers();
  Alert.alert(`Restock ${name}`, 'Opens a store search for this item.', [
    ...providers.map((provider) => ({
      text: provider.label,
      onPress: () => {
        void reorderHandoff.open(name, provider);
      },
    })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

export async function openInstacartCart(items: ShoppingListItem[]): Promise<void> {
  const open = items.filter((item) => !item.checked);
  if (open.length === 0) {
    Alert.alert('List is empty', 'Add items before sending them to Instacart.');
    return;
  }
  Clipboard.setString(cartClipboardText(open));
  const url = await createInstacartListUrl(open).catch(() => undefined);
  if (url) {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      await Linking.openURL(url);
    }
    return;
  }
  Alert.alert(
    'Instacart cart',
    'List copied to the clipboard. Without an Instacart partner key we walk each item into search — that’s the closest public cart.',
    [
      { text: 'Walk the list', onPress: () => walkCart(open, 0) },
      {
        text: 'Open Instacart',
        onPress: () => {
          void reorderHandoff.open(open[0]?.name ?? 'groceries', {
            id: 'instacart',
            label: 'Instacart',
          });
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ],
  );
}

function walkCart(items: ShoppingListItem[], index: number): void {
  const item = items[index];
  if (!item) {
    Alert.alert('Done', 'Every list item was opened in Instacart search.');
    return;
  }
  Alert.alert(
    `${index + 1} of ${items.length}`,
    `Add ${item.quantity} ${item.unit} ${item.name}, then come back for the next one.`,
    [
      {
        text: 'Open Instacart',
        onPress: () => {
          void reorderHandoff.open(item.name, { id: 'instacart', label: 'Instacart' }).then(() => {
            walkCart(items, index + 1);
          });
        },
      },
      { text: 'Skip', onPress: () => walkCart(items, index + 1) },
      { text: 'Stop', style: 'cancel' },
    ],
  );
}
