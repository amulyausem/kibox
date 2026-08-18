import { useState } from 'react';
import { Share, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { PressScale } from '@/components/PressScale';
import { ScreenHeader } from '@/components/ScreenHeader';
import { formatShoppingList } from '@/domain/shopping';
import { listEntering, listLayout } from '@/lib/animations';
import { openInstacartCart, openRestock } from '@/lib/openRestock';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

export default function RestockScreen() {
  const t = useTheme();
  const shopping = useAppStore((s) => s.shopping);
  const addToShopping = useAppStore((s) => s.addToShopping);
  const toggleShopping = useAppStore((s) => s.toggleShopping);
  const removeShopping = useAppStore((s) => s.removeShopping);
  const clearCheckedShopping = useAppStore((s) => s.clearCheckedShopping);
  const buyShoppingIntoPantry = useAppStore((s) => s.buyShoppingIntoPantry);
  const [draft, setDraft] = useState('');
  const open = shopping.filter((row) => !row.checked);
  const checked = shopping.filter((row) => row.checked);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg0 }} edges={['top']}>
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="List" subtitle="Low staples, flags, and anything you add" />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add to list"
            placeholderTextColor={t.muted}
            onSubmitEditing={() => {
              if (!draft.trim()) return;
              void addToShopping(draft.trim());
              setDraft('');
            }}
            style={{
              flex: 1,
              fontFamily: fonts.sans,
              fontSize: 14,
              color: t.ink,
              backgroundColor: t.paper,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: t.line,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          />
          <PressScale
            onPress={() => {
              if (!draft.trim()) return;
              void addToShopping(draft.trim());
              setDraft('');
            }}
            style={{
              backgroundColor: t.ink,
              borderRadius: radii.md,
              paddingHorizontal: 14,
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, color: '#fff', fontSize: 13 }}>Add</Text>
          </PressScale>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <PressScale onPress={() => void openInstacartCart(shopping)} style={chip(t)}>
            <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.ink }}>Instacart cart</Text>
          </PressScale>
          <PressScale
            onPress={() =>
              Share.share({ title: 'Kibox list', message: formatShoppingList(shopping) })
            }
            style={chip(t)}
          >
            <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.ink }}>Share list</Text>
          </PressScale>
          <PressScale onPress={() => buyShoppingIntoPantry()} style={chip(t)}>
            <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.ink }}>Checked → pantry</Text>
          </PressScale>
          <PressScale onPress={() => clearCheckedShopping()} style={chip(t)}>
            <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.ink }}>Clear checked</Text>
          </PressScale>
        </View>
        {shopping.length === 0 ? (
          <Text style={{ fontFamily: fonts.sans, color: t.muted, fontSize: 14 }}>
            Nothing on the list. Flag an item, or type a name above.
          </Text>
        ) : null}
        {open.map((row, i) => (
          <ListRow
            key={row.id}
            index={i}
            name={row.name}
            meta={`${row.quantity} ${row.unit}`}
            checked={false}
            onToggle={() => toggleShopping(row.id)}
            onStore={() => openRestock(row.name)}
            onRemove={() => removeShopping(row.id)}
          />
        ))}
        {checked.map((row, i) => (
          <ListRow
            key={row.id}
            index={i + open.length}
            name={row.name}
            meta="Checked"
            checked
            onToggle={() => toggleShopping(row.id)}
            onStore={() => openRestock(row.name)}
            onRemove={() => removeShopping(row.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function chip(t: ReturnType<typeof useTheme>) {
  return {
    backgroundColor: t.paper,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: t.line,
  };
}

function ListRow({
  name,
  meta,
  checked,
  onToggle,
  onStore,
  onRemove,
  index,
}: {
  name: string;
  meta: string;
  checked: boolean;
  onToggle: () => void;
  onStore: () => void;
  onRemove: () => void;
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
        opacity: checked ? 0.55 : 1,
      }}
    >
      <PressScale
        onPress={onToggle}
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: checked ? t.mint : t.line,
          backgroundColor: checked ? t.mint : 'transparent',
        }}
      >
        <View />
      </PressScale>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: fonts.sansMd,
            fontSize: 15,
            color: t.ink,
            textDecorationLine: checked ? 'line-through' : 'none',
          }}
        >
          {name}
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: t.muted, marginTop: 2 }}>{meta}</Text>
      </View>
      <PressScale onPress={onStore}>
        <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.mint }}>Store</Text>
      </PressScale>
      <PressScale onPress={onRemove}>
        <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.rust }}>Remove</Text>
      </PressScale>
    </Animated.View>
  );
}
