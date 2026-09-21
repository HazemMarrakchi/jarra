// ═══════════════════════════════════════════════════════════════════
// JARRA — Modèle de domaine
// Types partagés par le moteur simulé (démo) et le provider Supabase
// (production). Le front ne connaît que ces types.
// ═══════════════════════════════════════════════════════════════════

/** Type de commerce — détermine l'icône, la couleur, le catalogue de paniers. */
export type MerchantKind = 'bakery' | 'patisserie' | 'restaurant' | 'grocery';

export interface Merchant {
  id: string;
  name: string;
  kind: MerchantKind;
  /** Coordonnées réelles du commerce (WGS84). */
  lat: number;
  lon: number;
  area: string; // quartier de Gabès
  verified: boolean;
  rating: number; // 0-5
  ratingCount: number;
}

export type BasketStatus = 'live' | 'soldout' | 'expired';

export interface Basket {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  /** Prix d'origine en millimes tunisiens (1000 millimes = 1 TND). */
  originalPrice: number;
  /** Prix Jarra (prix de sauvetage) en millimes. */
  rescuePrice: number;
  quantityTotal: number;
  quantityLeft: number;
  /** Créneau de retrait, en minutes depuis le début du "jour simulé". */
  pickupFromMin: number;
  pickupToMin: number;
  status: BasketStatus;
}

export type OrderStatus = 'reserved' | 'collected' | 'cancelled';

export interface Order {
  id: string;
  basketId: string;
  customerName: string;
  pickupCode: string; // 4 caractères, présenté au commerçant
  status: OrderStatus;
  createdAtTick: number;
}

/** Impact agrégé de la plateforme (calculé depuis les commandes validées). */
export interface ImpactStats {
  mealsSaved: number;
  co2KgAvoided: number;
  tndSaved: number; // dinars économisés par les citoyens
  merchantsActive: number;
  /** Repas sauvés par quartier, pour le classement. */
  byArea: Array<{ area: string; meals: number }>;
}

/** Repas sauvés par jour de la semaine écoulée (page Impact). */
export interface WeeklyTrend {
  day: string; // "Lun", "Mar", …
  meals: number;
}

// ── Helpers partagés ────────────────────────────────────────────────

/** Formatage dinar tunisien : 2500 millimes → "2.500" */
export function formatTnd(millimes: number): string {
  return (millimes / 1000).toFixed(3);
}

/** Pourcentage de réduction d'un panier. */
export function discountPct(basket: Pick<Basket, 'originalPrice' | 'rescuePrice'>): number {
  if (basket.originalPrice <= 0) return 0;
  return Math.round((1 - basket.rescuePrice / basket.originalPrice) * 100);
}

/** "17:30" depuis des minutes de journée simulée. */
export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Labels FR des types de commerce. */
export const KIND_LABEL: Record<MerchantKind, string> = {
  bakery: 'Boulangerie',
  patisserie: 'Pâtisserie',
  restaurant: 'Restaurant',
  grocery: 'Épicerie',
};

/** Icônes (emoji) des types de commerce — cohérentes sur toute la plateforme. */
export const KIND_ICON: Record<MerchantKind, string> = {
  bakery: '🥖',
  patisserie: '🍰',
  restaurant: '🍲',
  grocery: '🫒',
};
