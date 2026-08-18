import { PhotoRecognitionSource } from '@/data/ingestion/sources';
import { IngestCaptureScreen } from '@/components/IngestCapture';

export default function PhotoAddScreen() {
  return (
    <IngestCaptureScreen
      emptyCopy="Photograph groceries on the counter. We’ll suggest what we see so you can confirm."
      busyLabel="Reading groceries…"
      makeSource={(uri) => new PhotoRecognitionSource(uri)}
    />
  );
}
