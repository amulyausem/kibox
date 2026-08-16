import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Camera, ScanBarcode, Store, Receipt } from 'lucide-react-native';
import { PressScale } from '@/components/PressScale';
import { QuantityStepper } from '@/components/QuantityStepper';
import { LoyaltyIngestionSource, ReceiptIngestionSource } from '@/data/ingestion/sources';
import { addDaysIso } from '@/domain/dates';
import { DEFAULT_LOCATIONS, DEFAULT_UNITS } from '@/domain/defaults';
import { GROCERY_CATALOG, searchCatalog } from '@/domain/groceryCatalog';
import type { Category, Location } from '@/domain/types';
import { categoryLabel, locationLabel } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

export default function QuickAddScreen() {
  const t = useTheme();
  const router = useRouter();
  const addItem = useAppStore((s) => s.addItem);
  const addCandidatesAsSuggested = useAppStore((s) => s.addCandidatesAsSuggested);
  const settings = useAppStore((s) => s.settings);
  const [query, setQuery] = useState('');
  const [qty, setQty] = useState(1);
  const hits = useMemo(() => searchCatalog(query, 6), [query]);

  const addNamed = async (
    name: string,
    extras?: { category?: Category; location?: Location; unit?: string; shelfLifeDays?: number },
  ) => {
    const catalog = GROCERY_CATALOG.find((row) => row.name.toLowerCase() === name.toLowerCase());
    const category = extras?.category ?? catalog?.category ?? 'other';
    const location = extras?.location ?? catalog?.location ?? settings.defaultLocations[category];
    const unit = extras?.unit ?? catalog?.unit ?? DEFAULT_UNITS[category];
    const shelf = extras?.shelfLifeDays ?? catalog?.shelfLifeDays ?? settings.shelfLifeDays[category];
    await addItem({
      name: catalog?.name ?? name.trim(),
      category,
      quantity: qty,
      unit,
      location,
      expiresAt: addDaysIso(new Date(), shelf),
      source: 'manual',
      status: 'confirmed',
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const ingestStub = async (kind: 'receipt' | 'loyalty') => {
    const source = kind === 'receipt' ? new ReceiptIngestionSource() : new LoyaltyIngestionSource();
    const candidates = await source.ingest();
    await addCandidatesAsSuggested((now) =>
      candidates.map((c) => ({
        name: c.name,
        category: c.category,
        quantity: c.quantity,
        unit: c.unit,
        location: c.location ?? DEFAULT_LOCATIONS[c.category],
        expiresAt: c.expiresInDays ? addDaysIso(now, c.expiresInDays) : undefined,
        source: c.source,
        status: 'suggested' as const,
        confidence: c.confidence,
      })),
    );
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg0 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: t.muted, marginBottom: 10 }}>
          Tap a match to add it. Category, place, and expiry fill in for you.
        </Text>
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Milk, eggs, rice…"
          placeholderTextColor={t.muted}
          style={{
            fontFamily: fonts.sans,
            fontSize: 16,
            color: t.ink,
            backgroundColor: t.paper,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: t.line,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (query.trim()) void addNamed(query.trim());
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
          }}
        >
          <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: t.ink }}>Quantity</Text>
          <QuantityStepper value={qty} onChange={setQty} />
        </View>

        <View style={{ marginTop: 12, gap: 6 }}>
          {(query ? hits : GROCERY_CATALOG.slice(0, 8)).map((row) => (
            <PressScale
              key={row.name}
              onPress={() => addNamed(row.name)}
              style={{
                backgroundColor: t.paper,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: t.line,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={{ fontFamily: fonts.sansMd, fontSize: 15, color: t.ink }}>{row.name}</Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: t.muted, marginTop: 2 }}>
                  {categoryLabel(row.category)} · {locationLabel(row.location)} · ~{row.shelfLifeDays}d
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.mint }}>Add</Text>
            </PressScale>
          ))}
        </View>

        {query.trim() && hits.every((h) => h.name.toLowerCase() !== query.trim().toLowerCase()) ? (
          <PressScale
            onPress={() => addNamed(query.trim())}
            style={{
              marginTop: 8,
              backgroundColor: t.ink,
              borderRadius: radii.md,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>Add “{query.trim()}”</Text>
          </PressScale>
        ) : null}

        <Text
          style={{
            fontFamily: fonts.sansMd,
            fontSize: 11,
            color: t.muted,
            letterSpacing: 1.1,
            textTransform: 'uppercase',
            marginTop: 22,
            marginBottom: 8,
          }}
        >
          Other ways
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Way
            icon={<ScanBarcode size={16} color={t.ink} />}
            label="Barcode"
            onPress={() => router.push('/add-barcode')}
          />
          <Way
            icon={<Camera size={16} color={t.ink} />}
            label="Photo"
            onPress={() => router.push('/add-photo')}
          />
          <Way
            icon={<Receipt size={16} color={t.ink} />}
            label="Receipt · stub"
            onPress={() => ingestStub('receipt')}
          />
          <Way
            icon={<Store size={16} color={t.ink} />}
            label="Loyalty · stub"
            onPress={() => ingestStub('loyalty')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Way({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <PressScale
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: t.paper,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: t.line,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      {icon}
      <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: t.ink }}>{label}</Text>
    </PressScale>
  );
}
