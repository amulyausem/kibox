import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddFab } from '@/components/AddFab';
import { BrandMark } from '@/components/BrandMark';
import { Chip } from '@/components/Chip';
import { ItemRow } from '@/components/ItemRow';
import { PressScale } from '@/components/PressScale';
import { ToastBar } from '@/components/ToastBar';
import { nameIncludes } from '@/domain/dates';
import { compareByExpiry } from '@/domain/expiry';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

type SortMode = 'expiry' | 'location';

export default function InventoryScreen() {
  const t = useTheme();
  const items = useAppStore((s) => s.items);
  const settings = useAppStore((s) => s.settings);
  const loaded = useAppStore((s) => s.loaded);
  const toast = useAppStore((s) => s.toast);
  const setToast = useAppStore((s) => s.setToast);
  const [sort, setSort] = useState<SortMode>('expiry');
  const [query, setQuery] = useState('');
  const confirmAllSuggested = useAppStore((s) => s.confirmAllSuggested);
  const confirmedCount = items.filter((item) => item.status === 'confirmed').length;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(undefined), 2200);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  const suggested = items.filter(
    (item) => item.status === 'suggested' && (!query || nameIncludes(item.name, query)),
  );
  const confirmed = items.filter(
    (item) => item.status === 'confirmed' && (!query || nameIncludes(item.name, query)),
  );

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
                  fontFamily: fonts.sansBd,
                  fontSize: 26,
                  color: t.ink,
                  letterSpacing: -0.4,
                }}
              >
                Pantry
              </Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: t.muted }}>
                {loaded ? `${confirmedCount} confirmed` : 'Loading…'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Chip label="Soonest" selected={sort === 'expiry'} onPress={() => setSort('expiry')} />
            <Chip label="Place" selected={sort === 'location'} onPress={() => setSort('location')} />
          </View>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Find an item"
          placeholderTextColor={t.muted}
          style={{
            fontFamily: fonts.sans,
            fontSize: 14,
            color: t.ink,
            backgroundColor: t.paper,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: t.line,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 12,
          }}
        />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
        >
          {suggested.length > 0 ? (
            <View style={{ marginBottom: 6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.sansMd,
                    fontSize: 11,
                    color: t.mint,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                  }}
                >
                  Confirm these
                </Text>
                <PressScale onPress={() => confirmAllSuggested()}>
                  <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.mint }}>
                    Confirm all
                  </Text>
                </PressScale>
              </View>
              {suggested.map((item, index) => (
                <ItemRow key={item.id} item={item} index={index} />
              ))}
            </View>
          ) : null}

          {loaded && suggested.length === 0 && confirmed.length === 0 ? (
            <Text style={{ fontFamily: fonts.sans, color: t.muted, fontSize: 14, marginTop: 24 }}>
              {query ? 'No matching items.' : 'Pantry is empty. Tap Add to log what you have.'}
            </Text>
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
