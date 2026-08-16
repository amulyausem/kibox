import { useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { PressScale } from '@/components/PressScale';
import { FEATURES } from '@/data/featureFlags';
import { PhotoRecognitionSource } from '@/data/ingestion/sources';
import { addDaysIso } from '@/domain/dates';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

export default function PhotoAddScreen() {
  const t = useTheme();
  const router = useRouter();
  const addCandidatesAsSuggested = useAppStore((s) => s.addCandidatesAsSuggested);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const snapAndSuggest = async () => {
    setBusy(true);
    try {
      if (!photoUri && cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
        setPhotoUri(photo?.uri);
        await recognize(photo?.uri);
        return;
      }
      await recognize(photoUri);
    } finally {
      setBusy(false);
    }
  };

  const recognize = async (uri?: string) => {
    const source = new PhotoRecognitionSource(uri);
    const candidates = await source.ingest();
    await addCandidatesAsSuggested((now) =>
      candidates.map((c) => ({
        name: c.name,
        category: c.category,
        quantity: c.quantity,
        unit: c.unit,
        location: c.location,
        expiresAt: c.expiresInDays ? addDaysIso(now, c.expiresInDays) : undefined,
        source: 'photo',
        status: 'suggested',
        confidence: c.confidence,
        photoUri: uri,
      })),
    );
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg0 }}>
      <View
        style={{
          flex: 1,
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
              Photograph a grocery haul. Recognition is stubbed until a vision model is wired in.
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
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 28, gap: 10 }}>
        <Text style={{ fontFamily: fonts.sans, color: t.muted, fontSize: 13 }}>
          {FEATURES.realVisionRecognition
            ? 'Recognizing items…'
            : 'AI recognition is stubbed · sample items land as suggestions to confirm'}
        </Text>
        <PressScale
          disabled={busy}
          onPress={() => snapAndSuggest()}
          style={{
            backgroundColor: t.ink,
            borderRadius: radii.md,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>
            {busy ? 'Working…' : 'Snap & suggest'}
          </Text>
        </PressScale>
      </View>
    </View>
  );
}
