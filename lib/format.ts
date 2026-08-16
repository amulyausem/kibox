import type { Category, Location } from '@/domain/types';

export function titleCase(value: string): string {
  return value.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

export function locationLabel(location: Location): string {
  return titleCase(location);
}

export function categoryLabel(category: Category): string {
  return titleCase(category);
}

export function qtyLabel(quantity: number, unit: string): string {
  const q = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1);
  return `${q} ${unit}`;
}

export function hourLabel(hour: number, minute: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${String(minute).padStart(2, '0')} ${ampm}`;
}
