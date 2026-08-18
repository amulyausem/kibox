import type { HouseholdBackup } from './backup';

export function remoteIsNewer(localExportedAt: string | undefined, remoteExportedAt: string): boolean {
  if (!localExportedAt) return true;
  return remoteExportedAt > localExportedAt;
}

export function householdInviteMessage(code: string): string {
  return [
    'Join my Kibox household.',
    `Code: ${code}`,
    `Or open: kibox://join?code=${code}`,
    'Settings → Household → Join. Both phones need the same companion server.',
  ].join('\n');
}

export function snapshotFromRemote(payload: unknown): HouseholdBackup | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const rec = payload as { snapshot?: HouseholdBackup };
  return rec.snapshot;
}
