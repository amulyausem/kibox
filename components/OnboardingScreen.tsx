import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressScale } from '@/components/PressScale';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

const PAGES = [
  {
    title: 'Keep the fridge honest',
    body: 'Kibox is a pantry, not a shopping social network. Add what you have, tap Used when it’s gone, and we’ll nag only when something is actually expiring or running low.',
  },
  {
    title: 'Guesses stay guesses',
    body: 'Anything we infer — a staple that might be low, an item from a blurry photo — shows up as a suggestion. Confirm before you trust it.',
  },
  {
    title: 'Receipts leave the phone',
    body: 'Photographing a receipt or groceries sends that image to Google Gemini so we can read line items. Nothing is uploaded until you capture. You can paste receipt text instead.',
  },
];

export function OnboardingScreen() {
  const t = useTheme();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;
  const current = PAGES[page] ?? PAGES[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg0 }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View>
          <Text
            style={{
              fontFamily: fonts.sansMd,
              fontSize: 11,
              color: t.mint,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Kibox
          </Text>
          <Text
            style={{
              fontFamily: fonts.sansBd,
              fontSize: 28,
              color: t.ink,
              letterSpacing: -0.4,
              marginBottom: 12,
            }}
          >
            {current.title}
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: t.muted, lineHeight: 24 }}>
            {current.body}
          </Text>
        </View>
        <View style={{ gap: 10 }}>
          {last ? (
            <>
              <PressScale
                onPress={() => completeOnboarding({ seed: false })}
                style={{
                  backgroundColor: t.ink,
                  borderRadius: radii.md,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>Start empty</Text>
              </PressScale>
              <PressScale
                onPress={() => completeOnboarding({ seed: true })}
                style={{
                  backgroundColor: t.paper,
                  borderRadius: radii.md,
                  paddingVertical: 14,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: t.line,
                }}
              >
                <Text style={{ fontFamily: fonts.sansMd, color: t.ink }}>Load a sample pantry</Text>
              </PressScale>
            </>
          ) : (
            <PressScale
              onPress={() => setPage(page + 1)}
              style={{
                backgroundColor: t.ink,
                borderRadius: radii.md,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>Continue</Text>
            </PressScale>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
