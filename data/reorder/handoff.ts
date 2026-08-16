import { FEATURES } from '../featureFlags';
import type { ReorderHandoff, ReorderProvider } from '../repositories';

const PROVIDERS: ReorderProvider[] = [
  { id: 'instacart', label: 'Instacart' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'walmart', label: 'Walmart' },
];

export class StubReorderHandoff implements ReorderHandoff {
  providers(): ReorderProvider[] {
    return PROVIDERS;
  }

  async open(itemName: string, provider: ReorderProvider): Promise<{ stubbed: boolean; message: string }> {
    // TODO: affiliate reorder link to Instacart/Amazon/Walmart
    if (!FEATURES.realReorderHandoff) {
      return {
        stubbed: true,
        message: `Reorder for ${itemName} via ${provider.label} is coming next. The button is wired; the destination is stubbed.`,
      };
    }
    return { stubbed: false, message: `Opening ${provider.label}…` };
  }
}

export const reorderHandoff: ReorderHandoff = new StubReorderHandoff();
