import { Text, View } from 'react-native';
import { fonts, useTheme } from '@/lib/theme';
import { PressScale } from './PressScale';

interface Props {
  message: string;
  onPress?: () => void;
}

export function ToastBar({ message, onPress }: Props) {
  const t = useTheme();
  return (
    <PressScale
      onPress={onPress}
      style={{
        position: 'absolute',
        left: 16,
        right: 88,
        bottom: 18,
        backgroundColor: t.ink,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
      }}
    >
      <View>
        <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: '#fff' }}>{message}</Text>
      </View>
    </PressScale>
  );
}
