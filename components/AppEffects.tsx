import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { namesMatch } from '@/domain/dates';
import { useAppStore } from '@/lib/store';

export function AppEffects() {
  const router = useRouter();
  const loaded = useAppStore((s) => s.loaded);
  const code = useAppStore((s) => s.settings.householdCode);
  const pullHouseholdNow = useAppStore((s) => s.pullHouseholdNow);

  useEffect(() => {
    if (!loaded) return;
    const run = (url: string | null) => {
      if (!url) return;
      const parsed = ExpoLinking.parse(url);
      const host = `${parsed.hostname ?? ''}${parsed.path ?? ''}`.replace(/^\//, '').split('/')[0];
      const name = typeof parsed.queryParams?.name === 'string' ? parsed.queryParams.name : undefined;
      const joinCode = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : undefined;
      const store = useAppStore.getState();
      if (host === 'used' && name) {
        const match = store.items.find((item) => namesMatch(item.name, name) && item.status === 'confirmed');
        if (match) void store.markUsed(match.id);
        else void store.addToShopping(name);
        return;
      }
      if (host === 'add' && name) {
        void store.quickAddByName(name);
        return;
      }
      if (host === 'join' && joinCode) {
        void store.joinHousehold(joinCode);
        return;
      }
      if (host === 'list') router.push('/(tabs)/restock');
      if (host === 'today') router.push('/(tabs)/alerts');
    };
    const sub = Linking.addEventListener('url', (event) => run(event.url));
    void Linking.getInitialURL().then(run);
    return () => sub.remove();
  }, [loaded, router]);

  useEffect(() => {
    if (!loaded || !code) return;
    void pullHouseholdNow();
    const timer = setInterval(() => {
      void pullHouseholdNow();
    }, 8000);
    return () => clearInterval(timer);
  }, [loaded, code, pullHouseholdNow]);

  return null;
}
