import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PressScale } from '@/components/PressScale';
import { ExpiryPill } from '@/components/ExpiryPill';
import { getExpiryStatus, expiryLabel } from '@/domain/expiry';
import { runningLowRules } from '@/domain/restock';
import { listEntering, listLayout } from '@/lib/animations';
import { qtyLabel } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

export default function AlertsScreen() {
  const t = useTheme();
  const items = useAppStore((s) => s.items);
  const rules = useAppStore((s) => s.rules);
  const settings = useAppStore((s) => s.settings);
  const markUsed = useAppStore((s) => s.markUsed);
  const removeItem = useAppStore((s) => s.removeItem);
  const updateItem = useAppStore((s) => s.updateItem);
  const now = new Date();
  const confirmed = items.filter((item) => item.status === 'confirmed');
  const expired = confirmed.filter((item) => getExpiryStatus(item, now, settings) === 'expired');
  const soon = confirmed.filter((item) => getExpiryStatus(item, now, settings) === 'expiring_soon');
  const low = runningLowRules(confirmed, rules, now);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg0 }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Today"
          subtitle={`${expired.length + soon.length + low.length} things to glance at`}
        />

        <Section title="Expired" empty="Nothing expired.">
          {expired.map((item, i) => (
            <AlertCard
              key={item.id}
              index={i}
              title={item.name}
              meta={`${qtyLabel(item.quantity, item.unit)} · probably used`}
              pill={<ExpiryPill status="expired" label={expiryLabel(item, now, settings.shelfLifeDays)} />}
              actions={[
                { label: 'Used it', onPress: () => markUsed(item.id) },
                { label: 'Toss', onPress: () => removeItem(item.id) },
              ]}
            />
          ))}
        </Section>

        <Section title="Expiring soon" empty="Nothing due soon.">
          {soon.map((item, i) => (
            <AlertCard
              key={item.id}
              index={i}
              title={item.name}
              meta={`${qtyLabel(item.quantity, item.unit)} · ${item.location}`}
              pill={
                <ExpiryPill
                  status="expiring_soon"
                  label={expiryLabel(item, now, settings.shelfLifeDays)}
                />
              }
              actions={[
                { label: 'Used it', onPress: () => markUsed(item.id) },
                { label: 'Toss', onPress: () => removeItem(item.id) },
              ]}
            />
          ))}
        </Section>

        <Section title="Running low" empty="Staples look fine.">
          {low.map((rule, i) => (
            <AlertCard
              key={rule.id}
              index={i}
              title={rule.itemName}
              meta="Suggested · confirm before you trust it"
              pill={<ExpiryPill status="fresh" label="Low" />}
              actions={[
                {
                  label: 'Restock',
                  onPress: () => {
                    const match = confirmed.find(
                      (item) => item.name.toLowerCase() === rule.itemName.toLowerCase(),
                    );
                    if (match) void updateItem(match.id, { flaggedForRestock: true });
                  },
                },
              ]}
            />
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const t = useTheme();
  const has = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <View style={{ marginBottom: 18 }}>
      <Text
        style={{
          fontFamily: fonts.sansMd,
          fontSize: 11,
          color: t.muted,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      {has ? children : (
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: t.muted }}>{empty}</Text>
      )}
    </View>
  );
}

function AlertCard({
  title,
  meta,
  pill,
  actions,
  index,
}: {
  title: string;
  meta: string;
  pill: ReactNode;
  actions: { label: string; onPress: () => void }[];
  index: number;
}) {
  const t = useTheme();
  return (
    <Animated.View
      entering={listEntering(index)}
      layout={listLayout}
      style={{
        backgroundColor: t.paper,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: t.line,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.sansMd, fontSize: 15, color: t.ink }}>{title}</Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: t.muted, marginTop: 2 }}>
            {meta}
          </Text>
        </View>
        {pill}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        {actions.map((action) => (
          <PressScale
            key={action.label}
            onPress={action.onPress}
            style={{
              backgroundColor: t.bg0,
              borderRadius: 10,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, fontSize: 13, color: t.ink }}>
              {action.label}
            </Text>
          </PressScale>
        ))}
      </View>
    </Animated.View>
  );
}
