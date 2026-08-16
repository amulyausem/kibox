import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { PressScale } from '@/components/PressScale';
import { ScreenHeader } from '@/components/ScreenHeader';
import { reorderHandoff } from '@/data/reorder/handoff';
import { runningLowRules } from '@/domain/restock';
import { namesMatch } from '@/domain/dates';
import { listEntering, listLayout } from '@/lib/animations';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

export default function RestockScreen() {
  const t = useTheme();
  const items = useAppStore((s) => s.items);
  const rules = useAppStore((s) => s.rules);
  const updateItem = useAppStore((s) => s.updateItem);
  const now = new Date();
  const confirmed = items.filter((item) => item.status === 'confirmed');
  const lowNames = runningLowRules(confirmed, rules, now).map((rule) => rule.itemName);
  const flagged = confirmed.filter((item) => item.flaggedForRestock);
  const merged = [
    ...flagged,
    ...confirmed.filter(
      (item) =>
        lowNames.some((name) => namesMatch(name, item.name)) &&
        !flagged.some((row) => row.id === item.id),
    ),
  ];
  const suggestedLow = items.filter(
    (item) => item.status === 'suggested' && item.flaggedForRestock,
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg0 }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Restock" subtitle="Low staples and anything you flagged" />
        {merged.length === 0 && suggestedLow.length === 0 ? (
          <Text style={{ fontFamily: fonts.sans, color: t.muted, fontSize: 14 }}>
            Nothing to restock. Flag an item from its detail screen.
          </Text>
        ) : null}
        {suggestedLow.map((item, i) => (
          <RestockRow
            key={item.id}
            index={i}
            name={item.name}
            meta="Suggested · not confirmed"
            onRestock={() => openHandoff(item.name)}
            onClear={() => updateItem(item.id, { flaggedForRestock: false })}
          />
        ))}
        {merged.map((item, i) => (
          <RestockRow
            key={item.id}
            index={i + suggestedLow.length}
            name={item.name}
            meta={`${item.quantity} ${item.unit} · ${item.location}`}
            onRestock={() => openHandoff(item.name)}
            onClear={() => updateItem(item.id, { flaggedForRestock: false })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

async function openHandoff(name: string) {
  const providers = reorderHandoff.providers();
  Alert.alert(`Restock ${name}`, 'Pick a store. Destinations are stubbed for this MVP.', [
    ...providers.map((provider) => ({
      text: provider.label,
      onPress: async () => {
        const result = await reorderHandoff.open(name, provider);
        Alert.alert(provider.label, result.message);
      },
    })),
    { text: 'Cancel', style: 'cancel' },
  ]);
}

function RestockRow({
  name,
  meta,
  onRestock,
  onClear,
  index,
}: {
  name: string;
  meta: string;
  onRestock: () => void;
  onClear: () => void;
  index: number;
}) {
  const t = useTheme();
  return (
    <Animated.View
      entering={listEntering(index)}
      layout={listLayout}
      style={{
        backgroundColor: t.paper,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: t.line,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.sansMd, fontSize: 15, color: t.ink }}>{name}</Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: t.muted, marginTop: 2 }}>
          {meta}
        </Text>
      </View>
      <PressScale
        onPress={onClear}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: t.line,
        }}
      >
        <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.muted }}>Clear</Text>
      </PressScale>
      <PressScale
        onPress={onRestock}
        style={{
          backgroundColor: t.mint,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
        }}
      >
        <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: '#fff' }}>Restock</Text>
      </PressScale>
    </Animated.View>
  );
}
