import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { CandidateItem } from '@/data/repositories';
import { fonts, radii, useTheme } from '@/lib/theme';
import { PressScale } from './PressScale';

interface Props {
  candidates: CandidateItem[];
  actionLabel: string;
  onSubmit: (selected: CandidateItem[]) => void;
  busy?: boolean;
}

export function CandidateReview({ candidates, actionLabel, onSubmit, busy }: Props) {
  const t = useTheme();
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const selected = candidates.filter((item, index) => !skipped[`${item.name}-${index}`]);

  return (
    <View style={{ gap: 10 }}>
      <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
        {candidates.map((item, index) => {
          const key = `${item.name}-${index}`;
          const on = !skipped[key];
          return (
            <PressScale
              key={key}
              onPress={() => setSkipped((prev) => ({ ...prev, [key]: on }))}
              style={{
                backgroundColor: t.paper,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: on ? t.mint : t.line,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: on ? t.mint : t.line,
                  backgroundColor: on ? t.mint : 'transparent',
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.sansMd, fontSize: 15, color: t.ink }}>{item.name}</Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: t.muted, marginTop: 2 }}>
                  {item.quantity} {item.unit}
                  {item.detail ? ` · ${item.detail}` : ''}
                  {` · ${Math.round(item.confidence * 100)}%`}
                </Text>
              </View>
            </PressScale>
          );
        })}
      </ScrollView>
      <PressScale
        disabled={busy || selected.length === 0}
        onPress={() => onSubmit(selected)}
        style={{
          backgroundColor: t.ink,
          borderRadius: radii.md,
          paddingVertical: 12,
          alignItems: 'center',
          opacity: selected.length === 0 ? 0.5 : 1,
        }}
      >
        <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>
          {busy ? 'Adding…' : `${actionLabel} (${selected.length})`}
        </Text>
      </PressScale>
    </View>
  );
}
