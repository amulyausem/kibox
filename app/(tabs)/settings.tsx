import type { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressScale } from '@/components/PressScale';
import { ScreenHeader } from '@/components/ScreenHeader';
import { FEATURES } from '@/data/featureFlags';
import { createId } from '@/domain/ids';
import { hourLabel } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

export default function SettingsScreen() {
  const t = useTheme();
  const settings = useAppStore((s) => s.settings);
  const rules = useAppStore((s) => s.rules);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const resetSeed = useAppStore((s) => s.resetSeed);
  const upsertRule = useAppStore((s) => s.upsertRule);
  const removeRule = useAppStore((s) => s.removeRule);
  const [stapleName, setStapleName] = useState('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg0 }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Settings" subtitle="Quiet defaults. Change only what you need." />

        <Card title="Daily digest">
          <Row
            label="Notifications"
            right={
              <Switch
                value={settings.digestEnabled}
                onValueChange={(digestEnabled) => saveSettings({ digestEnabled })}
                trackColor={{ true: t.mint, false: t.line }}
              />
            }
          />
          <Row
            label="Time"
            right={
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <PressScale
                  onPress={() =>
                    saveSettings({
                      notificationHour: (settings.notificationHour + 23) % 24,
                    })
                  }
                >
                  <Text style={{ color: t.mint, fontFamily: fonts.sansMd }}>−</Text>
                </PressScale>
                <Text style={{ fontFamily: fonts.sansMd, color: t.ink }}>
                  {hourLabel(settings.notificationHour, settings.notificationMinute)}
                </Text>
                <PressScale
                  onPress={() =>
                    saveSettings({
                      notificationHour: (settings.notificationHour + 1) % 24,
                    })
                  }
                >
                  <Text style={{ color: t.mint, fontFamily: fonts.sansMd }}>+</Text>
                </PressScale>
              </View>
            }
          />
        </Card>

        <Card title="Sample pantry">
          <Row
            label="Seed on empty launch"
            right={
              <Switch
                value={settings.seedDataEnabled}
                onValueChange={(seedDataEnabled) => saveSettings({ seedDataEnabled })}
                trackColor={{ true: t.mint, false: t.line }}
              />
            }
          />
          <PressScale
            onPress={() =>
              Alert.alert('Reset sample pantry?', 'Replaces current items with the demo set.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => resetSeed() },
              ])
            }
            style={{
              marginTop: 8,
              alignSelf: 'flex-start',
              backgroundColor: t.bg0,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: t.ink }}>
              Restore sample items
            </Text>
          </PressScale>
        </Card>

        <Card title="Staple rules">
          {rules.map((rule) => (
            <Row
              key={rule.id}
              label={`${rule.itemName}${
                rule.minQuantityThreshold != null
                  ? ` · ≤${rule.minQuantityThreshold}`
                  : rule.typicalIntervalDays != null
                    ? ` · ${rule.typicalIntervalDays}d`
                    : ''
              }`}
              right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Switch
                    value={rule.enabled}
                    onValueChange={(enabled) => upsertRule({ ...rule, enabled })}
                    trackColor={{ true: t.mint, false: t.line }}
                  />
                  <PressScale onPress={() => removeRule(rule.id)}>
                    <Text style={{ color: t.rust, fontFamily: fonts.sansMd, fontSize: 12 }}>
                      Remove
                    </Text>
                  </PressScale>
                </View>
              }
            />
          ))}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TextInput
              value={stapleName}
              onChangeText={setStapleName}
              placeholder="Add staple name"
              placeholderTextColor={t.muted}
              style={{
                flex: 1,
                fontFamily: fonts.sans,
                fontSize: 14,
                color: t.ink,
                backgroundColor: t.bg0,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: t.line,
              }}
            />
            <PressScale
              onPress={() => {
                if (!stapleName.trim()) return;
                void upsertRule({
                  id: createId(),
                  itemName: stapleName.trim(),
                  typicalIntervalDays: 14,
                  enabled: true,
                });
                setStapleName('');
              }}
              style={{
                backgroundColor: t.ink,
                borderRadius: 10,
                paddingHorizontal: 12,
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.sansMd, color: '#fff', fontSize: 13 }}>Add</Text>
            </PressScale>
          </View>
        </Card>

        <Card title="Integrations (stubbed)">
          {Object.entries(FEATURES).map(([key, on]) => (
            <Row
              key={key}
              label={key.replace(/([A-Z])/g, ' $1').replace(/^real /, 'real ')}
              right={
                <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: on ? t.mint : t.muted }}>
                  {on ? 'on' : 'stub'}
                </Text>
              }
            />
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.paper,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: t.line,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansMd,
          fontSize: 11,
          color: t.mint,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, right }: { label: string; right: ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: t.line,
      }}
    >
      <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: t.ink, flex: 1 }}>{label}</Text>
      {right}
    </View>
  );
}
