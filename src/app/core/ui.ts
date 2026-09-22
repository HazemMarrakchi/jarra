import { MerchantKind } from './model';

/** Icône Material Symbols associée à chaque type de commerce. */
export const KIND_ICON: Record<MerchantKind, string> = {
  bakery: 'bakery_dining',
  patisserie: 'cake',
  restaurant: 'restaurant',
  grocery: 'nutrition',
};

/** Libellé long, repris du vocabulaire des écrans de référence. */
export const KIND_LONG: Record<MerchantKind, string> = {
  bakery: 'Boulangeries & Pains',
  patisserie: 'Pâtisseries Fines',
  restaurant: 'Traiteurs & Plats Cuisinés',
  grocery: 'Primeurs & Fruits Locaux',
};

/** Libellé court, pour les étiquettes compactes. */
export const KIND_SHORT: Record<MerchantKind, string> = {
  bakery: 'Pain & viennoiserie',
  patisserie: 'Pâtisserie fine',
  restaurant: 'Plats traiteur',
  grocery: 'Primeurs & fruits',
};

export const KINDS: MerchantKind[] = ['bakery', 'patisserie', 'restaurant', 'grocery'];

/** Icône de la fenêtre de retrait, selon l'heure de fin. */
export function slotIcon(toMin: number): string {
  if (toMin < 11 * 60) return 'wb_sunny';
  if (toMin < 19 * 60) return 'schedule';
  if (toMin < 21 * 60) return 'wb_twilight';
  return 'nightlight';
}

/** Position de référence du citoyen (centre de Gabès). */
export const CITIZEN_POS = { lat: 33.8815, lon: 10.0982 } as const;

/** Distance lisible entre deux points WGS84, en mètres. */
export function distanceM(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** « 420 m » ou « 2,1 km ». */
export function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${m} m`;
}
