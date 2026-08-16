import { Text, View } from 'react-native';
import { fonts, radii, useTheme } from '@/lib/theme';
import { PressScale } from './PressScale';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: Props) {
  const t = useTheme();
  return (
    <PressScale
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radii.pill,
        backgroundColor: selected ? t.mintSoft : t.paper,
        borderWidth: 1,
        borderColor: selected ? t.mint : t.line,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansMd,
          fontSize: 12,
          color: selected ? t.mint : t.muted,
        }}
      >
        {label}
      </Text>
    </PressScale>
  );
}
