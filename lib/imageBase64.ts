export async function imageUriToBase64(uri: string): Promise<{ base64: string; mime: string }> {
  if (uri.startsWith('data:')) {
    const match = uri.match(/^data:([^;]+);base64,(.*)$/);
    if (!match?.[1] || match[2] == null) throw new Error('Could not read that image.');
    return { mime: match[1], base64: match[2] };
  }

  const response = await fetch(uri);
  if (!response.ok) throw new Error('Could not read the photo.');
  const mime = mimeFromUri(uri, response.headers.get('Content-Type'));
  const buffer = await response.arrayBuffer();
  return { mime, base64: arrayBufferToBase64(buffer) };
}

function mimeFromUri(uri: string, header: string | null): string {
  if (header && header.startsWith('image/')) return header.split(';')[0] ?? 'image/jpeg';
  if (uri.toLowerCase().includes('.png')) return 'image/png';
  if (uri.toLowerCase().includes('.webp')) return 'image/webp';
  if (uri.toLowerCase().includes('.heic')) return 'image/heic';
  return 'image/jpeg';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
