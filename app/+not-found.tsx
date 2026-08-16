import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { fonts, useTheme } from '@/lib/theme';

export default function NotFoundScreen() {
  const t = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Oops' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg0 }}>
        <Text style={{ fontFamily: fonts.serifBd, fontSize: 22, color: t.ink }}>This screen is empty.</Text>
        <Link href="/" style={{ marginTop: 12 }}>
          <Text style={{ fontFamily: fonts.sansMd, color: t.mint }}>Back to pantry</Text>
        </Link>
      </View>
    </>
  );
}
