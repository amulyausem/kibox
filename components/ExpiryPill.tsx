import { Text, View } from 'react-native';
import type { ExpiryStatus } from '@/domain/types';
import { fonts, useTheme } from '@/lib/theme';

interface Props {
  status: ExpiryStatus;
  label: string;
}

export function ExpiryPill({ status, label }: Props) {
  const t = useTheme();
  const bg =
    status === 'expired' ? t.rustSoft : status === 'expiring_soon' ? t.claySoft : t.mintSoft;
  const fg = status === 'expired' ? t.rust : status === 'expiring_soon' ? '#7A5E3A' : t.mint;

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg }} />
      <Text style={{ fontFamily: fonts.sansMd, fontSize: 11, color: fg }}>{label}</Text>
    </View>
  );
}
