import type { HouseholdBackup } from '@/domain/backup';
import { makeHouseholdCode } from '@/domain/ids';

export function syncBaseUrl(): string | undefined {
  const value =
    process.env.EXPO_PUBLIC_SYNC_URL?.trim() ||
    process.env.EXPO_PUBLIC_VISION_PROXY_URL?.trim();
  return value ? value.replace(/\/$/, '') : undefined;
}

export async function createHouseholdRemote(): Promise<string> {
  const base = syncBaseUrl();
  if (!base) throw new Error('Set EXPO_PUBLIC_SYNC_URL to the companion server.');
  const code = makeHouseholdCode();
  const response = await fetch(`${base}/household`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const json = (await response.json()) as { code?: string; error?: string };
  if (!response.ok) throw new Error(json.error ?? 'Could not create household.');
  return json.code ?? code;
}

export async function pushHousehold(code: string, deviceId: string, snapshot: HouseholdBackup): Promise<void> {
  const base = syncBaseUrl();
  if (!base) return;
  const response = await fetch(`${base}/household/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, snapshot }),
  });
  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? 'Could not sync household.');
  }
}

export async function pullHousehold(
  code: string,
): Promise<{ deviceId?: string; snapshot?: HouseholdBackup } | undefined> {
  const base = syncBaseUrl();
  if (!base) return undefined;
  const response = await fetch(`${base}/household/${encodeURIComponent(code)}`);
  if (response.status === 404) return undefined;
  if (!response.ok) return undefined;
  return (await response.json()) as { deviceId?: string; snapshot?: HouseholdBackup };
}
