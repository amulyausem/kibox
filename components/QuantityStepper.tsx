import { Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { fonts, useTheme } from '@/lib/theme';
import { PressScale } from './PressScale';

interface Props {
  value: number;
  onChange: (next: number) => void;
  min?: number;
}

export function QuantityStepper({ value, onChange, min = 1 }: Props) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.bg0,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: t.line,
      }}
    >
      <PressScale onPress={() => onChange(Math.max(min, value - 1))} style={{ padding: 8 }}>
        <Minus size={14} color={t.ink} />
      </PressScale>
      <Text
        style={{
          fontFamily: fonts.sansMd,
          fontSize: 13,
          color: t.ink,
          minWidth: 22,
          textAlign: 'center',
        }}
      >
        {value}
      </Text>
      <PressScale onPress={() => onChange(value + 1)} style={{ padding: 8 }}>
        <Plus size={14} color={t.ink} />
      </PressScale>
    </View>
  );
}
