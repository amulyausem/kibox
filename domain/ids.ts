export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function makeDeviceId(): string {
  return `dev-${createId()}`;
}

export function makeHouseholdCode(): string {
  return createId().replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase().padEnd(6, 'X');
}
