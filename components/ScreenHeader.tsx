import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { fonts, useTheme } from '@/lib/theme';

interface Props {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: Props) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 14,
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.serifBd, fontSize: 28, color: t.ink, letterSpacing: -0.4 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: t.muted, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
