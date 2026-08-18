import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { confidenceLabel } from '@/domain/confidence';
import { expiryLabel, getExpiryStatus } from '@/domain/expiry';
import type { Item } from '@/domain/types';
import { listEntering, listExiting, listLayout } from '@/lib/animations';
import { qtyLabel } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';
import { ExpiryPill } from './ExpiryPill';
import { PressScale } from './PressScale';

interface Props {
  item: Item;
  index: number;
}

export function ItemRow({ item, index }: Props) {
  const t = useTheme();
  const router = useRouter();
  const settings = useAppStore((s) => s.settings);
  const confirmItem = useAppStore((s) => s.confirmItem);
  const dismissItem = useAppStore((s) => s.dismissItem);
  const markUsed = useAppStore((s) => s.markUsed);
  const suggested = item.status === 'suggested';
  const now = new Date();
  const status = getExpiryStatus(item, now, settings);
  const label = expiryLabel(item, now, settings.shelfLifeDays);

  return (
    <Animated.View
      entering={listEntering(index)}
      exiting={listExiting}
      layout={listLayout}
      style={{
        backgroundColor: t.paper,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: suggested ? t.sage : t.line,
        borderStyle: suggested ? 'dashed' : 'solid',
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <PressScale onPress={() => router.push(`/item/${item.id}`)} style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={{ fontFamily: fonts.sansMd, fontSize: 15, color: t.ink }}
              >
                {item.name}
              </Text>
              <Text
                numberOfLines={1}
                style={{ fontFamily: fonts.sans, fontSize: 12, color: t.muted, marginTop: 2 }}
              >
                {qtyLabel(item.quantity, item.unit)} · {item.location}
                {suggested ? ` · ${confidenceLabel(item.confidence)}` : ''}
              </Text>
            </View>
            <ExpiryPill status={status} label={label} />
          </View>
        </PressScale>
        {!suggested ? (
          <PressScale
            onPress={() => markUsed(item.id)}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: t.bg0,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, fontSize: 11, color: t.ink }}>Used</Text>
          </PressScale>
        ) : null}
      </View>
      {suggested ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <PressScale
            onPress={() => confirmItem(item.id)}
            style={{
              flex: 1,
              backgroundColor: t.mint,
              borderRadius: 10,
              paddingVertical: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: '#fff' }}>Confirm</Text>
          </PressScale>
          <PressScale
            onPress={() => dismissItem(item.id)}
            style={{
              flex: 1,
              backgroundColor: t.bg0,
              borderRadius: 10,
              paddingVertical: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: t.ink }}>Dismiss</Text>
          </PressScale>
        </View>
      ) : null}
    </Animated.View>
  );
}
