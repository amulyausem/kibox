import { useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CandidateReview } from '@/components/CandidateReview';
import { PressScale } from '@/components/PressScale';
import { candidateToInput } from '@/data/ingestion/toInput';
import type { CandidateItem, IngestionSource } from '@/data/repositories';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

interface Props {
  emptyCopy: string;
  busyLabel: string;
  makeSource: (uri?: string) => IngestionSource;
}

export function IngestCaptureScreen({ emptyCopy, busyLabel, makeSource }: Props) {
  const t = useTheme();
  const router = useRouter();
  const addItem = useAppStore((s) => s.addItem);
  const visionConsent = useAppStore((s) => s.settings.visionConsent);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<CandidateItem[] | undefined>();
  const [error, setError] = useState<string | undefined>();

  const run = async (uri?: string) => {
    setBusy(true);
    setError(undefined);
    setCandidates(undefined);
    try {
      const source = makeSource(uri);
      const next = await source.ingest();
      setCandidates(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not read that photo.');
    } finally {
      setBusy(false);
    }
  };

  const snap = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      setPhotoUri(photo?.uri);
      await run(photo?.uri);
      return;
    }
    await run(photoUri);
  };

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    setPhotoUri(result.assets[0].uri);
    await run(result.assets[0].uri);
  };

  const save = async (selected: CandidateItem[]) => {
    setSaving(true);
    try {
      const now = new Date();
      for (const candidate of selected) {
        await addItem({
          ...candidateToInput(candidate, now, 'confirmed'),
          photoUri,
        });
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg0 }}>
      <View
        style={{
          flex: candidates ? 0.42 : 1,
          margin: 16,
          borderRadius: radii.lg,
          overflow: 'hidden',
          backgroundColor: t.ink,
        }}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ flex: 1 }} />
        ) : permission?.granted ? (
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text
              style={{
                fontFamily: fonts.sans,
                color: '#fff',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              {emptyCopy}
            </Text>
            <PressScale
              onPress={() => requestPermission()}
              style={{
                backgroundColor: t.mint,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>Allow camera</Text>
            </PressScale>
          </View>
        )}
        {busy ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15,20,22,0.62)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, color: '#fff', fontSize: 16 }}>{busyLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 28, gap: 10 }}>
        {!visionConsent ? (
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: t.muted, lineHeight: 18 }}>
              This photo is sent to Google Gemini to read items. It is not stored on a Kibox server.
            </Text>
            <PressScale
              onPress={() => saveSettings({ visionConsent: true })}
              style={{
                backgroundColor: t.ink,
                borderRadius: radii.md,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>Allow and continue</Text>
            </PressScale>
          </View>
        ) : (
          <>
        {error ? (
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: t.rust, lineHeight: 18 }}>
            {error}
          </Text>
        ) : null}
        {candidates ? (
          <CandidateReview
            candidates={candidates}
            actionLabel="Add to pantry"
            onSubmit={save}
            busy={saving}
          />
        ) : (
          <View style={{ gap: 10 }}>
          {error && photoUri ? (
            <PressScale
              disabled={busy}
              onPress={() => run(photoUri)}
              style={{
                backgroundColor: t.mint,
                borderRadius: radii.md,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>Try this photo again</Text>
            </PressScale>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <PressScale
              disabled={busy}
              onPress={() => snap()}
              style={{
                flex: 1,
                backgroundColor: t.ink,
                borderRadius: radii.md,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>
                {busy ? busyLabel : photoUri ? 'Retake' : 'Capture'}
              </Text>
            </PressScale>
            <PressScale
              disabled={busy}
              onPress={() => pick()}
              style={{
                flex: 1,
                backgroundColor: t.paper,
                borderRadius: radii.md,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: t.line,
              }}
            >
              <Text style={{ fontFamily: fonts.sansMd, color: t.ink }}>Photo library</Text>
            </PressScale>
          </View>
          </View>
        )}
          </>
        )}
      </View>
    </View>
  );
}
