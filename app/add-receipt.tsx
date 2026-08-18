import { ReceiptIngestionSource } from '@/data/ingestion/sources';
import { IngestCaptureScreen } from '@/components/IngestCapture';

export default function ReceiptAddScreen() {
  return (
    <IngestCaptureScreen
      emptyCopy="Photograph a receipt. We’ll pull line items for you to confirm."
      busyLabel="Reading receipt…"
      makeSource={(uri) => new ReceiptIngestionSource(uri)}
    />
  );
}
