import type { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PressScale } from '@/components/PressScale';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Chip } from '@/components/Chip';
import { CATEGORIES, LOCATIONS } from '@/domain/types';
import { categoryLabel, locationLabel } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

export default function ItemDetailScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useAppStore((s) => s.items.find((row) => row.id === id));
  const updateItem = useAppStore((s) => s.updateItem);
  const removeItem = useAppStore((s) => s.removeItem);
  const confirmItem = useAppStore((s) => s.confirmItem);
  const [name, setName] = useState(item?.name ?? '');

  if (!item) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.sans, color: t.muted }}>Item not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg0 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <TextInput
        value={name}
        onChangeText={setName}
        onEndEditing={() => {
          if (name.trim() && name.trim() !== item.name) void updateItem(item.id, { name: name.trim() });
        }}
        style={{
          fontFamily: fonts.serifBd,
          fontSize: 28,
          color: t.ink,
          marginBottom: 12,
        }}
      />

      {item.status === 'suggested' ? (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          <PressScale
            onPress={() => confirmItem(item.id)}
            style={{ flex: 1, backgroundColor: t.mint, borderRadius: 12, paddingVertical: 11, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>Confirm</Text>
          </PressScale>
          <PressScale
            onPress={() => {
              void removeItem(item.id);
              router.back();
            }}
            style={{
              flex: 1,
              backgroundColor: t.paper,
              borderRadius: 12,
              paddingVertical: 11,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, color: t.ink }}>Dismiss</Text>
          </PressScale>
        </View>
      ) : null}

      <View style={card(t)}>
        <Label>Quantity</Label>
        <QuantityStepper
          value={item.quantity}
          min={0.5}
          onChange={(quantity) => updateItem(item.id, { quantity })}
        />
        <TextInput
          value={item.unit}
          onChangeText={(unit) => updateItem(item.id, { unit })}
          style={field(t)}
        />
      </View>

      <View style={card(t)}>
        <Label>Category</Label>
        <Wrap>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={categoryLabel(category)}
              selected={item.category === category}
              onPress={() => updateItem(item.id, { category })}
            />
          ))}
        </Wrap>
        <Label>Location</Label>
        <Wrap>
          {LOCATIONS.map((location) => (
            <Chip
              key={location}
              label={locationLabel(location)}
              selected={item.location === location}
              onPress={() => updateItem(item.id, { location })}
            />
          ))}
        </Wrap>
      </View>

      <View style={card(t)}>
        <Label>Expiry</Label>
        <Text style={{ fontFamily: fonts.sans, color: t.muted, fontSize: 13, marginBottom: 8 }}>
          {item.expiresAt ? new Date(item.expiresAt).toDateString() : 'Using category default'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[-1, 1, 3, 7].map((days) => (
            <PressScale
              key={days}
              onPress={() => {
                const base = item.expiresAt ? new Date(item.expiresAt) : new Date();
                base.setDate(base.getDate() + days);
                void updateItem(item.id, { expiresAt: base.toISOString() });
              }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: t.line,
                backgroundColor: t.bg0,
              }}
            >
              <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.ink }}>
                {days > 0 ? `+${days}d` : `${days}d`}
              </Text>
            </PressScale>
          ))}
        </View>
        <PressScale
          onPress={() => updateItem(item.id, { openedAt: new Date().toISOString() })}
          style={{ marginTop: 10 }}
        >
          <Text style={{ fontFamily: fonts.sansMd, color: t.mint, fontSize: 13 }}>
            {item.openedAt ? 'Opened' : 'Mark opened'}
          </Text>
        </PressScale>
      </View>

      <PressScale
        onPress={() => updateItem(item.id, { flaggedForRestock: !item.flaggedForRestock })}
        style={{
          ...card(t),
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontFamily: fonts.sansMd, color: t.ink }}>Flag for restock</Text>
        <Text style={{ fontFamily: fonts.sans, color: item.flaggedForRestock ? t.mint : t.muted }}>
          {item.flaggedForRestock ? 'On list' : 'Off'}
        </Text>
      </PressScale>

      <PressScale
        onPress={() =>
          Alert.alert('Delete item?', item.name, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                void removeItem(item.id);
                router.back();
              },
            },
          ])
        }
        style={{ alignSelf: 'center', marginTop: 8, padding: 10 }}
      >
        <Text style={{ fontFamily: fonts.sansMd, color: t.rust }}>Delete</Text>
      </PressScale>
    </ScrollView>
  );
}

function Label({ children }: { children: string }) {
  const t = useTheme();
  return (
    <Text
      style={{
        fontFamily: fonts.sansMd,
        fontSize: 11,
        color: t.muted,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 4,
      }}
    >
      {children}
    </Text>
  );
}

function Wrap({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>{children}</View>;
}

function card(t: ReturnType<typeof useTheme>) {
  return {
    backgroundColor: t.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: t.line,
    padding: 12,
    marginBottom: 12,
  };
}

function field(t: ReturnType<typeof useTheme>) {
  return {
    marginTop: 10,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: t.ink,
    backgroundColor: t.bg0,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: t.line,
  };
}
