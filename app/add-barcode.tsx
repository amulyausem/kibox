import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { PressScale } from '@/components/PressScale';
import { BarcodeIngestionSource } from '@/data/ingestion/barcode';
import { ManualIngestionSource } from '@/data/ingestion/manual';
import { candidateToInput } from '@/data/ingestion/toInput';
import { LOCAL_BARCODES, productLookup } from '@/data/lookup/productLookup';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

export default function BarcodeScreen() {
  const t = useTheme();
  const router = useRouter();
  const addItem = useAppStore((s) => s.addItem);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manual, setManual] = useState('');
  const [status, setStatus] = useState('Point at a barcode, or tap a sample code');

  const addFromBarcode = async (barcode: string) => {
    const source = new BarcodeIngestionSource(barcode, productLookup);
    const [candidate] = await source.ingest();
    if (candidate) {
      await addItem(candidateToInput(candidate, new Date(), 'confirmed'));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus(`Added ${candidate.name}. Scan another.`);
      setManual('');
      setScanned(false);
      return true;
    }
    return false;
  };

  const handleCode = async (barcode: string) => {
    if (!barcode || scanned) return;
    setScanned(true);
    const found = await addFromBarcode(barcode);
    if (!found) {
      setStatus(`Unknown code ${barcode}. Type a name to add it.`);
      setManual((prev) => prev || barcode);
      setScanned(false);
    }
  };

  const addUnknown = async () => {
    const value = manual.trim();
    if (!value) return;
    const found = await addFromBarcode(value);
    if (found) return;
    const source = new ManualIngestionSource(value, 1);
    const [candidate] = await source.ingest();
    if (!candidate) return;
    await addItem({
      ...candidateToInput(candidate, new Date(), 'confirmed'),
      source: 'barcode',
      barcode: /^\d+$/.test(value) ? value : undefined,
    });
    setStatus(`Added ${candidate.name}. Scan another.`);
    setManual('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg0 }}>
      <View style={{ flex: 1, overflow: 'hidden', margin: 16, borderRadius: radii.lg }}>
        {permission?.granted ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128'],
            }}
            onBarcodeScanned={({ data }) => {
              void handleCode(data);
            }}
          />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: t.ink,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sans,
                color: '#fff',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              Camera access lets you scan. Sample codes below work without a camera.
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
        <Text style={{ fontFamily: fonts.sans, color: t.muted, fontSize: 13 }}>{status}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(LOCAL_BARCODES).slice(0, 4).map(([code, name]) => (
            <PressScale
              key={code}
              onPress={() => handleCode(code)}
              style={{
                backgroundColor: t.paper,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: t.line,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ fontFamily: fonts.sansMd, fontSize: 12, color: t.ink }}>{name}</Text>
            </PressScale>
          ))}
        </View>
        <TextInput
          value={manual}
          onChangeText={setManual}
          placeholder="Barcode or product name"
          placeholderTextColor={t.muted}
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            color: t.ink,
            backgroundColor: t.paper,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: t.line,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PressScale
            onPress={() => addUnknown()}
            style={{
              flex: 1,
              backgroundColor: t.ink,
              borderRadius: radii.md,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>Add</Text>
          </PressScale>
          <PressScale
            onPress={() => router.back()}
            style={{
              paddingHorizontal: 16,
              borderRadius: radii.md,
              paddingVertical: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: t.line,
              backgroundColor: t.paper,
            }}
          >
            <Text style={{ fontFamily: fonts.sansMd, color: t.ink }}>Done</Text>
          </PressScale>
        </View>
      </View>
    </View>
  );
}
