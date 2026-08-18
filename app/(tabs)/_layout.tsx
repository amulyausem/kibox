import { Tabs } from 'expo-router';
import { Bell, ClipboardList, Refrigerator, Settings } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';

export default function TabLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.mint,
        tabBarInactiveTintColor: t.nav,
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: -2 },
        tabBarStyle: {
          backgroundColor: t.paper,
          borderTopColor: t.line,
          height: 58,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pantry',
          tabBarIcon: ({ color, size }) => <Refrigerator size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Bell size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="restock"
        options={{
          title: 'List',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}
