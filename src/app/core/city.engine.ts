// ═══════════════════════════════════════════════════════════════════
// JARRA — Moteur de simulation de la ville (démo in-browser)
// Une journée tunisienne accélérée : les commerçants ouvrent, publient
// leurs invendus en fin de service, les citoyens réservent, les créneaux
// expirent. Déterministe (seed) → même ville pour tous les visiteurs.
// ═══════════════════════════════════════════════════════════════════

import {
  Basket, ImpactStats, Merchant, MerchantKind, Order, WeeklyTrend,
} from './model';

/** RNG déterministe (mulberry32) — même seed, même ville, tout navigateur. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── La ville : 14 commerçants types avec de vraies coordonnées ─────
// Répartis sur 8 quartiers réels de Gabès (WGS84).
const CITY: Array<Omit<Merchant, 'verified' | 'rating' | 'ratingCount'>> = [
  { id: 'm01', name: 'Fournil de la Médina', kind: 'bakery', lat: 33.8815, lon: 10.0982, area: 'Médina' },
  { id: 'm02', name: 'Boulangerie Chott Salem', kind: 'bakery', lat: 33.9080, lon: 10.1140, area: 'Chott Salem' },
  { id: 'm03', name: 'Le Pain de Teboulbou', kind: 'bakery', lat: 33.9770, lon: 10.0570, area: 'Teboulbou' },
  { id: 'm04', name: 'Le Croissant de Gabès', kind: 'patisserie', lat: 33.8830, lon: 10.1010, area: 'Médina' },
  { id: 'm05', name: 'Délices de l\'Oasis', kind: 'patisserie', lat: 33.9040, lon: 10.1060, area: 'Chott Salem' },
  { id: 'm06', name: 'Sucré-Salé Menzel', kind: 'patisserie', lat: 33.8900, lon: 10.0870, area: 'Menzel' },
  { id: 'm07', name: 'Le Comptoir du Port', kind: 'restaurant', lat: 33.8760, lon: 10.1060, area: 'Médina' },
  { id: 'm08', name: 'Chez Salah — Cheniki', kind: 'restaurant', lat: 33.8690, lon: 10.1130, area: 'Cheniki' },
  { id: 'm09', name: 'La Table de Ghannouch', kind: 'restaurant', lat: 33.9270, lon: 10.0550, area: 'Ghannouch' },
  { id: 'm10', name: 'Épicerie du Souk', kind: 'grocery', lat: 33.9110, lon: 10.1180, area: 'Chott Salem' },
  { id: 'm11', name: 'Marché Bio de l\'Oasis', kind: 'grocery', lat: 33.8650, lon: 10.0820, area: 'Sidi Driss' },
  { id: 'm12', name: 'Supérette El Menzel', kind: 'grocery', lat: 33.8930, lon: 10.0910, area: 'Menzel' },
  { id: 'm13', name: 'Fournil Sidi Driss', kind: 'bakery', lat: 33.8670, lon: 10.0780, area: 'Sidi Driss' },
  { id: 'm14', name: 'Couscous House Oued Akhrich', kind: 'restaurant', lat: 33.8730, lon: 10.1040, area: 'Oued Akhrich' },
];

// Catalogue de paniers par type de commerce (prix en millimes TND).
const CATALOGUE: Record<MerchantKind, Array<{
  title: string; description: string; original: number; rescue: number;
}>> = {
  bakery: [
    { title: 'Panier du fournil', description: 'Baguettes tradition, pain au seigle, croissants du jour.', original: 8500, rescue: 3000 },
    { title: 'Invendus de la fournée', description: 'Pains spéciaux (complet, aux céréales) + petits pains.', original: 6000, rescue: 2000 },
    { title: 'Panier viennoiseries', description: 'Croissants, pains au chocolat, chaussons aux pommes.', original: 12000, rescue: 4500 },
  ],
  patisserie: [
    { title: 'Douceurs du jour', description: 'Parts de gâteaux, éclairs et tartelettes du jour.', original: 15000, rescue: 5500 },
    { title: 'Panier pâtissier surprise', description: 'Sélection du chef : makroud, baklawa, gâteaux modernes.', original: 18000, rescue: 6500 },
  ],
  restaurant: [
    { title: 'Plat du jour à emporter', description: 'Le plat du jour complet, préparé à midi, jamais servi.', original: 16000, rescue: 6000 },
    { title: 'Panier du chef', description: 'Couscous, ojja ou grille selon le service du jour.', original: 20000, rescue: 7500 },
  ],
  grocery: [
    { title: 'Panier fruits & légumes', description: 'Fruits et légumes de saison à consommer sous 48h.', original: 14000, rescue: 5000 },
    { title: 'Panier épicerie fine', description: 'Produits à date courte : yaourts, fromages, charcuterie.', original: 22000, rescue: 8000 },
  ],
};

/** Durée d'une journée simulée en secondes réelles. */
export const DAY_SECONDS = 300;
/** La journée simulée démarre à 8h00 (480 min) et finit à 23h00 (1380 min). */
export const DAY_START_MIN = 480;
export const DAY_END_MIN = 1380;

const CO2_KG_PER_MEAL = 2.5;

const FIRST_NAMES = ['Yasmine', 'Mohamed', 'Amine', 'Sara', 'Karim', 'Ines', 'Bilel', 'Nour', 'Mehdi', 'Rania', 'Walid', 'Syrine'];

/**
 * Moteur de la ville. On avance `tick()` à intervalle régulier ;
 * chaque tick = 1 minute de journée simulée.
 */
export class CityEngine {
  readonly merchants: Merchant[] = [];
  baskets: Basket[] = [];
  orders: Order[] = [];

  /** Minutes de journée simulée écoulées. */
  clockMin = DAY_START_MIN;

  private rng: () => number;
  private seq = 0;
  private completedMeals = 0;
  private completedSavings = 0;
  private byArea = new Map<string, number>();

  constructor(seed = 7) {
    this.rng = mulberry32(seed);
    const rng = this.rng;
    this.merchants = CITY.map((m) => ({
      ...m,
      verified: rng() > 0.15,
      rating: Math.round((3.8 + rng() * 1.2) * 10) / 10,
      ratingCount: 14 + Math.floor(rng() * 220),
    }));
    // Pré-remplissage : chaque commerçant publie son premier panier.
    for (const m of this.merchants) this.publishFor(m, true);
  }

  /** Avance la ville d'une minute simulée. Retourne true si quelque chose a changé. */
  tick(): boolean {
    this.clockMin += 1;
    let changed = false;

    // Expiration des créneaux
    for (const b of this.baskets) {
      if (b.status === 'live' && this.clockMin >= b.pickupToMin) {
        b.status = 'expired';
        changed = true;
      }
    }

    // Les commerçants republient régulièrement (environ toutes les 40-90 min)
    for (const m of this.merchants) {
      if (this.rng() < 0.015 && !this.hasLiveBasket(m.id)) {
        this.publishFor(m, false);
        changed = true;
      }
    }

    // Des citoyens (simulés) réservent de temps en temps
    for (const b of this.baskets) {
      if (b.status === 'live' && b.quantityLeft > 0 && this.rng() < 0.05) {
        this.reserveInternal(b, FIRST_NAMES[Math.floor(this.rng() * FIRST_NAMES.length)]);
        changed = true;
      }
      // Certaines réservations sont récupérées (comptées dans l'impact)
      if (this.rng() < 0.06) {
        const pending = this.orders.find(
          (o) => o.basketId === b.id && o.status === 'reserved' && o.customerName !== '__you__',
        );
        if (pending) {
          pending.status = 'collected';
          this.countImpact(pending.basketId);
          changed = true;
        }
      }
    }
    return changed;
  }

  /** Publication par un commerçant (dashboard) — apparaît instantanément sur la carte. */
  publish(
    merchantId: string,
    draft: {
      title: string; description: string; originalPrice: number;
      rescuePrice: number; quantity: number; pickupUntil: string;
    },
  ): Basket | null {
    const merchant = this.merchant(merchantId);
    if (!merchant) return null;
    if (draft.rescuePrice <= 0 || draft.originalPrice <= 0) return null;

    // "21:30" → minutes de journée ; si l'heure est déjà passée, on met +1h.
    const [h, m] = draft.pickupUntil.split(':').map((v) => Number(v));
    let until = Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : this.clockMin + 120;
    if (until <= this.clockMin) until = this.clockMin + 120;

    const basket: Basket = {
      id: `b${++this.seq}`,
      merchantId,
      title: draft.title,
      description: draft.description,
      originalPrice: Math.round(draft.originalPrice),
      rescuePrice: Math.round(draft.rescuePrice),
      quantityTotal: draft.quantity,
      quantityLeft: draft.quantity,
      pickupFromMin: this.clockMin,
      pickupToMin: Math.min(until, DAY_END_MIN),
      status: 'live',
    };
    this.baskets.push(basket);
    return basket;
  }

  /** Réservation par le visiteur — décrément atomique, code de retrait. */
  reserve(basketId: string, customerName: string): Order | null {
    const b = this.baskets.find((x) => x.id === basketId);
    if (!b || b.status !== 'live' || b.quantityLeft <= 0) return null;
    return this.reserveInternal(b, customerName, true);
  }

  /** Le commerçant valide un retrait via le code → impact compté. */
  collect(code: string): Order | null {
    const o = this.orders.find((x) => x.pickupCode === code.toUpperCase() && x.status === 'reserved');
    if (!o) return null;
    o.status = 'collected';
    this.countImpact(o.basketId);
    return o;
  }

  /** Annulation : la quantité revient dans le panier. */
  cancel(orderId: string): boolean {
    const o = this.orders.find((x) => x.id === orderId);
    if (!o || o.status !== 'reserved') return false;
    o.status = 'cancelled';
    const b = this.baskets.find((x) => x.id === o.basketId);
    if (b && b.status === 'live') b.quantityLeft += 1;
    return true;
  }

  liveBaskets(): Basket[] {
    return this.baskets.filter((b) => b.status === 'live' && b.quantityLeft > 0);
  }

  basketsOf(merchantId: string): Basket[] {
    return this.baskets.filter((b) => b.merchantId === merchantId);
  }

  merchant(id: string): Merchant | undefined {
    return this.merchants.find((m) => m.id === id);
  }

  /** Impact agrégé — calculé depuis les commandes collectées. */
  impact(): ImpactStats {
    return {
      mealsSaved: this.completedMeals,
      co2KgAvoided: Math.round(this.completedMeals * CO2_KG_PER_MEAL * 10) / 10,
      tndSaved: this.completedSavings / 1000,
      merchantsActive: this.merchants.filter((m) => this.hasLiveBasket(m.id)).length,
      byArea: [...this.byArea.entries()]
        .map(([area, meals]) => ({ area, meals }))
        .sort((a, b) => b.meals - a.meals),
    };
  }

  /** Tendance hebdomadaire (déterministe, pour la page Impact). */
  weeklyTrend(): WeeklyTrend[] {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const rng = mulberry32(99);
    return days.map((day, i) => ({
      day,
      meals: Math.round(120 + i * 14 + rng() * 40 + (i >= 4 ? 55 : 0)),
    }));
  }

  // ── interne ──────────────────────────────────────────────────────

  private countImpact(basketId: string): void {
    this.completedMeals += 1;
    const basket = this.baskets.find((x) => x.id === basketId);
    if (!basket) return;
    this.completedSavings += basket.originalPrice - basket.rescuePrice;
    const merchant = this.merchants.find((m) => m.id === basket.merchantId);
    if (merchant) this.byArea.set(merchant.area, (this.byArea.get(merchant.area) ?? 0) + 1);
  }

  private hasLiveBasket(merchantId: string): boolean {
    return this.baskets.some((b) => b.merchantId === merchantId && b.status === 'live');
  }
  private publishFor(m: Merchant, opening: boolean): void {
    const catalog = CATALOGUE[m.kind];
    const tpl = catalog[Math.floor(this.rng() * catalog.length)];
    // Créneaux typiques : restos après le service du midi, épiceries en soirée, boulangeries/pâtisseries en fin de journée
    const span = m.kind === 'restaurant' ? [780, 840] : m.kind === 'grocery' ? [1020, 1140] : [1080, 1320];
    const from = opening ? Math.max(this.clockMin, span[0] - 120) : this.clockMin + 10;
    const to = Math.min(span[1] + Math.floor(this.rng() * 60), DAY_END_MIN);
    const qty = 1 + Math.floor(this.rng() * 5);
    this.baskets.push({
      id: `b${++this.seq}`,
      merchantId: m.id,
      title: tpl.title,
      description: tpl.description,
      originalPrice: tpl.original,
      rescuePrice: tpl.rescue,
      quantityTotal: qty,
      quantityLeft: qty,
      pickupFromMin: from,
      pickupToMin: to,
      status: 'live',
    });
  }

  private reserveInternal(b: Basket, customerName: string, byVisitor = false): Order {
    b.quantityLeft -= 1;
    if (b.quantityLeft <= 0) b.status = 'soldout';
    const order: Order = {
      id: `o${++this.seq}`,
      basketId: b.id,
      customerName: byVisitor ? '__you__' : customerName,
      pickupCode: this.pickupCode(),
      status: 'reserved',
      createdAtTick: this.clockMin,
    };
    this.orders.push(order);
    return order;
  }

  private pickupCode(): string {
    const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += letters[Math.floor(this.rng() * letters.length)];
    return code;
  }
}
