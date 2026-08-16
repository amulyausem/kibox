import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddFab } from '@/components/AddFab';
import { BrandMark } from '@/components/BrandMark';
import { Chip } from '@/components/Chip';
import { ItemRow } from '@/components/ItemRow';
import { ToastBar } from '@/components/ToastBar';
import { compareByExpiry } from '@/domain/expiry';
import { useAppStore } from '@/lib/store';
import { fonts, useTheme } from '@/lib/theme';

type SortMode = 'expiry' | 'location';

export default function InventoryScreen() {
  const t = useTheme();
  const items = useAppStore((s) => s.items);
  const settings = useAppStore((s) => s.settings);
  const loaded = useAppStore((s) => s.loaded);
  const toast = useAppStore((s) => s.toast);
  const setToast = useAppStore((s) => s.setToast);
  const [sort, setSort] = useState<SortMode>('expiry');

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(undefined), 2200);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  const suggested = items.filter((item) => item.status === 'suggested');
  const confirmed = items.filter((item) => item.status === 'confirmed');

  const grouped = useMemo(() => {
    const now = new Date();
    if (sort === 'expiry') {
      return [
        {
          key: 'Soonest',
          items: [...confirmed].sort((a, b) =>
            compareByExpiry(a, b, now, settings.shelfLifeDays),
          ),
        },
      ];
    }
    const buckets = new Map<string, typeof confirmed>();
    for (const item of confirmed) {
      const list = buckets.get(item.location) ?? [];
      list.push(item);
      buckets.set(item.location, list);
    }
    return [...buckets.entries()].map(([key, rows]) => ({
      key,
      items: rows.sort((a, b) => compareByExpiry(a, b, now, settings.shelfLifeDays)),
    }));
  }, [confirmed, settings.shelfLifeDays, sort]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg0 }} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 6,
            marginBottom: 14,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <BrandMark size={30} />
            <View>
              <Text
                style={{
                  fontFamily: fonts.serifBd,
                  fontSize: 26,
                  color: t.ink,
                  letterSpacing: -0.4,
                }}
              >
                Pantry
              </Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: t.muted }}>
                {loaded ? `${confirmed.length} confirmed` : 'Loading…'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Chip label="Soonest" selected={sort === 'expiry'} onPress={() => setSort('expiry')} />
            <Chip label="Place" selected={sort === 'location'} onPress={() => setSort('location')} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
        >
          {suggested.length > 0 ? (
            <View style={{ marginBottom: 6 }}>
              <Text
                style={{
                  fontFamily: fonts.sansMd,
                  fontSize: 11,
                  color: t.mint,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Confirm these
              </Text>
              {suggested.map((item, index) => (
                <ItemRow key={item.id} item={item} index={index} />
              ))}
            </View>
          ) : null}

          {grouped.map((group) => (
            <View key={group.key} style={{ marginBottom: 8 }}>
              {sort === 'location' ? (
                <Text
                  style={{
                    fontFamily: fonts.sansMd,
                    fontSize: 11,
                    color: t.muted,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                    marginTop: 6,
                  }}
                >
                  {group.key}
                </Text>
              ) : null}
              {group.items.map((item, index) => (
                <ItemRow key={item.id} item={item} index={index + suggested.length} />
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
      {toast ? <ToastBar message={toast} onPress={() => setToast(undefined)} /> : null}
      <AddFab />
    </SafeAreaView>
  );
}
