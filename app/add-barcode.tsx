import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { PressScale } from '@/components/PressScale';
import { productLookup } from '@/data/lookup/productLookup';
import { addDaysIso } from '@/domain/dates';
import { guessFromName } from '@/domain/groceryCatalog';
import { useAppStore } from '@/lib/store';
import { fonts, radii, useTheme } from '@/lib/theme';

export default function BarcodeScreen() {
  const t = useTheme();
  const router = useRouter();
  const addItem = useAppStore((s) => s.addItem);
  const settings = useAppStore((s) => s.settings);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manual, setManual] = useState('');
  const [status, setStatus] = useState('Point at a barcode');

  const handleCode = async (barcode: string) => {
    if (!barcode) return;
    setScanned(true);
    const product = await productLookup.lookup(barcode);
    if (product) {
      await addItem({
        name: product.name,
        category: product.category,
        quantity: 1,
        unit: product.unit,
        location: product.location,
        expiresAt: addDaysIso(new Date(), product.shelfLifeDays),
        source: 'barcode',
        status: 'confirmed',
        barcode,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
      return;
    }
    const guess = guessFromName(manual);
    setStatus(`Unknown code ${barcode}. Type a name to add it.`);
    setManual((prev) => prev || barcode);
    void guess;
    setScanned(false);
  };

  const addUnknown = async () => {
    const name = manual.trim();
    if (!name) return;
    const catalog = guessFromName(name);
    const category = catalog?.category ?? 'other';
    await addItem({
      name: catalog?.name ?? name,
      category,
      quantity: 1,
      unit: catalog?.unit ?? 'ea',
      location: catalog?.location ?? settings.defaultLocations[category],
      expiresAt: addDaysIso(new Date(), catalog?.shelfLifeDays ?? settings.shelfLifeDays[category]),
      source: 'barcode',
      status: 'confirmed',
      barcode: name.match(/^\d+$/) ? name : undefined,
    });
    router.replace('/(tabs)');
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
              if (scanned) return;
              void handleCode(data);
            }}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text style={{ fontFamily: fonts.sans, color: '#fff', textAlign: 'center', marginBottom: 12 }}>
              Camera access lets you scan barcodes. You can still type a code below.
            </Text>
            <PressScale
              onPress={() => requestPermission()}
              style={{ backgroundColor: t.mint, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}
            >
              <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>Allow camera</Text>
            </PressScale>
          </View>
        )}
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 28, gap: 10 }}>
        <Text style={{ fontFamily: fonts.sans, color: t.muted, fontSize: 13 }}>{status}</Text>
        <TextInput
          value={manual}
          onChangeText={setManual}
          placeholder="Or type a barcode / product name"
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
        <PressScale
          onPress={() => addUnknown()}
          style={{ backgroundColor: t.ink, borderRadius: radii.md, paddingVertical: 12, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: fonts.sansMd, color: '#fff' }}>Add anyway</Text>
        </PressScale>
      </View>
    </View>
  );
}
