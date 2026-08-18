import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CandidateReview } from '@/components/CandidateReview';
import { PressScale } from '@/components/PressScale';
import { TextReceiptSource } from '@/data/ingestion/sources';
import { candidateToInput } from '@/data/ingestion/toInput';
import type { CandidateItem } from '@/data/repositories';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

export default function TextReceiptScreen() {
  const t = useTheme();
  const router = useRouter();
  const addItem = useAppStore((s) => s.addItem);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [candidates, setCandidates] = useState<CandidateItem[] | undefined>();

  const parse = async () => {
    setBusy(true);
    setError(undefined);
    try {
      setCandidates(await new TextReceiptSource(text).ingest());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not read that text.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg0, padding: 16 }}>
      <Text style={{ fontFamily: fonts.sansMd, fontSize: 18, color: t.ink }}>Paste a receipt</Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: t.muted, marginTop: 4, marginBottom: 12 }}>
        Email or SMS receipts work. If a Gemini key is set we clean the lines; otherwise we parse locally.
      </Text>
      {error ? (
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: t.rust, marginBottom: 8 }}>{error}</Text>
      ) : null}
      {candidates ? (
        <CandidateReview
          candidates={candidates}
          actionLabel="Add to pantry"
          busy={saving}
          onSubmit={async (selected) => {
            setSaving(true);
            try {
              const now = new Date();
              for (const candidate of selected) {
                await addItem(candidateToInput(candidate, now, 'confirmed'));
              }
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/(tabs)');
            } finally {
              setSaving(false);
            }
          }}
        />
      ) : (
        <>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={'MILK  $3.49\nEGGS  $5.29\nSPINACH  $2.99'}
            placeholderTextColor={t.muted}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 180,
              fontFamily: fonts.sans,
              fontSize: 14,
              color: t.ink,
              backgroundColor: t.paper,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: t.line,
              padding: 12,
              marginBottom: 12,
            }}
          />
          <PressScale
            disabled={busy}
            onPress={() => parse()}
            style={{
              backgroundColor: t.ink,
              borderRadius: radii.md,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>
              {busy ? 'Reading…' : 'Extract items'}
            </Text>
          </PressScale>
        </>
      )}
    </View>
  );
}
