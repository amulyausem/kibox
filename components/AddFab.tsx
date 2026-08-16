import { Text } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { fonts, useTheme } from '@/lib/theme';
import { PressScale } from './PressScale';

export function AddFab() {
  const t = useTheme();
  const router = useRouter();
  return (
    <PressScale
      onPress={() => router.push('/add')}
      style={{
        position: 'absolute',
        right: 16,
        bottom: 18,
        backgroundColor: t.ink,
        borderRadius: 22,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: t.ink,
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <Plus size={16} color="#fff" />
      <Text style={{ fontFamily: fonts.sansMd, fontSize: 14, color: '#fff' }}>Add</Text>
    </PressScale>
  );
}
