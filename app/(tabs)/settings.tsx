import type { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Clipboard, ScrollView, Share, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressScale } from '@/components/PressScale';
import { ScreenHeader } from '@/components/ScreenHeader';
import { syncBaseUrl } from '@/data/householdSync';
import { householdInviteMessage } from '@/domain/household';
import { createId } from '@/domain/ids';
import { formatCents, wasteCentsInMonth } from '@/domain/money';
import { CATEGORIES, LOCATIONS } from '@/domain/types';
import { hourLabel } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

export default function SettingsScreen() {
  const t = useTheme();
  const settings = useAppStore((s) => s.settings);
  const rules = useAppStore((s) => s.rules);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const resetSeed = useAppStore((s) => s.resetSeed);
  const exportBackup = useAppStore((s) => s.exportBackup);
  const importBackup = useAppStore((s) => s.importBackup);
  const createHousehold = useAppStore((s) => s.createHousehold);
  const joinHousehold = useAppStore((s) => s.joinHousehold);
  const leaveHousehold = useAppStore((s) => s.leaveHousehold);
  const pullHouseholdNow = useAppStore((s) => s.pullHouseholdNow);
  const waste = useAppStore((s) => s.waste);
  const [stapleName, setStapleName] = useState('');
  const [backupDraft, setBackupDraft] = useState('');
  const [joinDraft, setJoinDraft] = useState('');
  const upsertRule = useAppStore((s) => s.upsertRule);
  const removeRule = useAppStore((s) => s.removeRule);

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

        <Card title="Expiring-soon window">
          <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: t.muted, marginBottom: 8 }}>
            Days before expiry that count as “soon.”
          </Text>
          {CATEGORIES.map((category) => (
            <Row
              key={category}
              label={category}
              right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <PressScale
                    onPress={() =>
                      saveSettings({
                        soonWindowsDays: {
                          ...settings.soonWindowsDays,
                          [category]: Math.max(1, settings.soonWindowsDays[category] - 1),
                        },
                      })
                    }
                  >
                    <Text style={{ color: t.mint, fontFamily: fonts.sansMd }}>−</Text>
                  </PressScale>
                  <Text style={{ fontFamily: fonts.sansMd, color: t.ink, minWidth: 28, textAlign: 'center' }}>
                    {settings.soonWindowsDays[category]}d
                  </Text>
                  <PressScale
                    onPress={() =>
                      saveSettings({
                        soonWindowsDays: {
                          ...settings.soonWindowsDays,
                          [category]: settings.soonWindowsDays[category] + 1,
                        },
                      })
                    }
                  >
                    <Text style={{ color: t.mint, fontFamily: fonts.sansMd }}>+</Text>
                  </PressScale>
                </View>
              }
            />
          ))}
        </Card>

        <Card title="Default locations">
          {CATEGORIES.map((category) => {
            const current = settings.defaultLocations[category];
            const next = LOCATIONS[(LOCATIONS.indexOf(current) + 1) % LOCATIONS.length];
            return (
              <Row
                key={category}
                label={category}
                right={
                  <PressScale onPress={() => saveSettings({
                    defaultLocations: { ...settings.defaultLocations, [category]: next },
                  })}>
                    <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: t.mint }}>
                      {current}
                    </Text>
                  </PressScale>
                }
              />
            );
          })}
        </Card>

        <Card title="Units">
          <Row
            label={settings.units === 'imperial' ? 'US (imperial)' : 'Metric'}
            right={
              <PressScale
                onPress={() =>
                  saveSettings({ units: settings.units === 'imperial' ? 'metric' : 'imperial' })
                }
              >
                <Text style={{ fontFamily: fonts.sansMd, color: t.mint }}>Switch</Text>
              </PressScale>
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

        <Card title="Privacy">
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: t.muted, lineHeight: 18, marginBottom: 8 }}>
            Receipt and grocery photos are sent to Google Gemini to extract items. Kibox has no account and no
            cloud of your pantry. Toggle off to block new photo reads.
          </Text>
          <Row
            label="Allow photo reading"
            right={
              <Switch
                value={settings.visionConsent}
                onValueChange={(visionConsent) => saveSettings({ visionConsent })}
                trackColor={{ true: t.mint, false: t.line }}
              />
            }
          />
        </Card>

        <Card title="Household">
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: t.muted, lineHeight: 18, marginBottom: 8 }}>
            Live pantry + list between phones on the same companion server
            {syncBaseUrl() ? ` (${syncBaseUrl()})` : '. Set EXPO_PUBLIC_SYNC_URL, then restart Expo.'}
          </Text>
          {settings.householdCode ? (
            <>
              <Row
                label="Code"
                right={
                  <Text style={{ fontFamily: fonts.sansMd, fontSize: 14, color: t.ink, letterSpacing: 1 }}>
                    {settings.householdCode}
                  </Text>
                }
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                <PressScale
                  onPress={() =>
                    void Share.share({
                      title: 'Kibox household',
                      message: householdInviteMessage(settings.householdCode ?? ''),
                    })
                  }
                >
                  <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: t.mint }}>Share invite</Text>
                </PressScale>
                <PressScale onPress={() => void pullHouseholdNow().then(() => Alert.alert('Synced', 'Pulled the latest household snapshot.'))}>
                  <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: t.mint }}>Pull now</Text>
                </PressScale>
                <PressScale
                  onPress={() =>
                    Alert.alert('Leave household?', 'This phone keeps its pantry. It stops syncing.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Leave', style: 'destructive', onPress: () => void leaveHousehold() },
                    ])
                  }
                >
                  <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: t.mint }}>Leave</Text>
                </PressScale>
              </View>
            </>
          ) : (
            <>
              <PressScale
                onPress={() => {
                  if (!syncBaseUrl()) {
                    Alert.alert(
                      'Companion required',
                      'Run `npm run proxy` on a computer both phones can reach, then set EXPO_PUBLIC_SYNC_URL in .env and restart Expo.',
                    );
                    return;
                  }
                  void createHousehold().catch((err: unknown) =>
                    Alert.alert('Could not create', err instanceof Error ? err.message : 'Try again'),
                  );
                }}
                style={{ alignSelf: 'flex-start', marginBottom: 10 }}
              >
                <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: t.mint }}>Create household</Text>
              </PressScale>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={joinDraft}
                  onChangeText={setJoinDraft}
                  placeholder="Join code"
                  placeholderTextColor={t.muted}
                  autoCapitalize="characters"
                  autoCorrect={false}
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
                    if (!syncBaseUrl()) {
                      Alert.alert(
                        'Companion required',
                        'Both phones need EXPO_PUBLIC_SYNC_URL pointing at the same proxy.',
                      );
                      return;
                    }
                    void joinHousehold(joinDraft)
                      .then(() => setJoinDraft(''))
                      .catch((err: unknown) =>
                        Alert.alert('Could not join', err instanceof Error ? err.message : 'Check the code'),
                      );
                  }}
                  style={{
                    backgroundColor: t.ink,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: fonts.sansMd, color: '#fff', fontSize: 13 }}>Join</Text>
                </PressScale>
              </View>
            </>
          )}
        </Card>

        <Card title="Siri & widget">
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: t.muted, lineHeight: 18, marginBottom: 8 }}>
            In Shortcuts, add Open URL. Say “Used milk” to hit kibox://used?name=Milk — that marks it used, or adds it to
            the list. Home Screen widget needs a development or TestFlight build, not Expo Go.
          </Text>
          <PressScale
            onPress={() => {
              Clipboard.setString('kibox://used?name=Milk');
              Alert.alert('Copied', 'Paste into Shortcuts → Open URL. Change Milk to any item name.');
            }}
            style={{ alignSelf: 'flex-start' }}
          >
            <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: t.mint }}>Copy Used shortcut</Text>
          </PressScale>
        </Card>

        <Card title="Backup">
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: t.muted, lineHeight: 18, marginBottom: 8 }}>
            This month tossed {formatCents(wasteCentsInMonth(waste, new Date()))}. Export is a JSON file you can
            share or paste back in.
          </Text>
          <PressScale
            onPress={() => {
              const payload = JSON.stringify(exportBackup(), null, 2);
              void Share.share({ title: 'Kibox backup', message: payload });
            }}
            style={{
              alignSelf: 'flex-start',
              backgroundColor: t.ink,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: '#fff' }}>Export backup</Text>
          </PressScale>
          <TextInput
            value={backupDraft}
            onChangeText={setBackupDraft}
            placeholder="Paste a backup JSON to restore"
            placeholderTextColor={t.muted}
            multiline
            style={{
              minHeight: 72,
              fontFamily: fonts.sans,
              fontSize: 12,
              color: t.ink,
              backgroundColor: t.bg0,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: t.line,
              marginBottom: 8,
            }}
          />
          <PressScale
            onPress={() => {
              if (!backupDraft.trim()) return;
              Alert.alert('Restore backup?', 'Replaces pantry, list, and settings on this phone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Restore',
                  style: 'destructive',
                  onPress: () => {
                    void importBackup(backupDraft.trim())
                      .then(() => setBackupDraft(''))
                      .catch((err: unknown) =>
                        Alert.alert('Could not restore', err instanceof Error ? err.message : 'Invalid file'),
                      );
                  },
                },
              ]);
            }}
            style={{ alignSelf: 'flex-start' }}
          >
            <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: t.mint }}>Restore from paste</Text>
          </PressScale>
        </Card>

        <Card title="Add-ins">
          <Row label="Barcode lookup" right={<Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.mint }}>Open Food Facts + local</Text>} />
          <Row label="Receipt / photo" right={<Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.mint }}>Gemini vision</Text>} />
          <Row label="Pasted receipt" right={<Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.mint }}>Text extract</Text>} />
          <Row label="List + stores" right={<Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.mint }}>Share · Instacart cart · Amazon · Walmart</Text>} />
          <Row label="Household" right={<Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.mint }}>Companion sync</Text>} />
          <Row label="Widget / Siri" right={<Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.mint }}>Dev build + Shortcuts</Text>} />
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
