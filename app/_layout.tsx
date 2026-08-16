import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Newsreader_600SemiBold, Newsreader_700Bold } from '@expo-google-fonts/newsreader';
import { useColorScheme } from '@/components/useColorScheme';
import { configureAndroidChannel } from '@/lib/notifications';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const hydrate = useAppStore((s) => s.hydrate);
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    void hydrate();
    void configureAndroidChannel();
  }, [hydrate]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;
  return <RootNav />;
}

function RootNav() {
  const scheme = useColorScheme();
  const t = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg0 }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: t.ink,
          headerStyle: { backgroundColor: t.bg0 },
          headerTitleStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
          contentStyle: { backgroundColor: t.bg0 },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add"
          options={{ presentation: 'modal', title: 'Quick add', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="add-barcode"
          options={{ presentation: 'fullScreenModal', title: 'Scan barcode' }}
        />
        <Stack.Screen
          name="add-photo"
          options={{ presentation: 'fullScreenModal', title: 'Photo add' }}
        />
        <Stack.Screen name="item/[id]" options={{ title: 'Item' }} />
      </Stack>
    </View>
  );
}
