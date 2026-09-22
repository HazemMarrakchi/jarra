// ═══════════════════════════════════════════════════════════════════
// JARRA — Provider Supabase (production)
// Implémente DataProvider contre le backend PostgreSQL/Supabase :
//   · lecture directe des tables/vues (RLS ouvert en lecture)
//   · mutations UNIQUEMENT via fonctions RPC transactionnelles
//     (reserve_basket, publish_basket, collect_order, cancel_order)
//   · temps réel via Supabase Realtime (postgres_changes)
// La librairie supabase-js est chargée dynamiquement : les visiteurs
// de la démo ne téléchargent jamais ce chunk.
// ═══════════════════════════════════════════════════════════════════

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { DataProvider, MerchantAuth, ProviderSnapshot, PublishDraft } from './data.provider';
import {
  Basket, BasketStatus, ImpactStats, Merchant, MerchantKind, Order, OrderStatus, WeeklyTrend,
} from './model';

/** Clé localStorage mémorisant les commandes passées depuis CET appareil. */
const LS_OWN_ORDERS = 'jarra:own-orders';

const EMPTY_IMPACT: ImpactStats = {
  mealsSaved: 0, co2KgAvoided: 0, tndSaved: 0, merchantsActive: 0, byArea: [],
};

// ── Lignes SQL (snake_case) ─────────────────────────────────────────
interface MerchantRow {
  id: string; name: string; kind: string; lat: number; lon: number;
  area: string; verified: boolean; rating: number; rating_count: number;
  owner_id: string | null;
}
interface BasketRow {
  id: string; merchant_id: string; title: string; description: string;
  original_price: number; rescue_price: number;
  quantity_total: number; quantity_left: number;
  pickup_from: string; pickup_to: string; status: string;
}
interface OrderRow {
  id: string; basket_id: string; customer_name: string;
  pickup_code: string; status: string; created_at: string;
}
/** JSON renvoyé par les RPC de mutation. */
interface RpcOrder {
  id: string; basketId: string; customerName: string;
  pickupCode: string; status: string; createdAt: string;
}

/** Minutes depuis minuit (heure locale du navigateur). */
function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export class SupabaseProvider implements DataProvider {
  readonly mode = 'live' as const;

  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;

  private merchantRows: MerchantRow[] = [];
  private basketRows: BasketRow[] = [];
  private orderRows: OrderRow[] = [];
  private impactData: ImpactStats = EMPTY_IMPACT;
  private trendData: WeeklyTrend[] = [];

  /** Commandes passées depuis cet appareil → affichées « Vous ». */
  private readonly ownOrders = new Set<string>(SupabaseProvider.loadOwnOrders());

  /** Session commerçant (Supabase Auth, OTP téléphone). */
  private userId: string | null = null;
  private userPhone: string | null = null;

  constructor(
    private readonly url: string,
    private readonly anonKey: string,
  ) {}

  async init(onChange: () => void): Promise<void> {
    try {
      // Import dynamique : chunk chargé uniquement en mode live.
      const { createClient } = await import('@supabase/supabase-js');
      this.client = createClient(this.url, this.anonKey);
      // Restaure une éventuelle session commerçant (localStorage) et
      // suit ses changements (connexion/déconnexion, autre onglet…).
      const { data } = await this.client.auth.getSession();
      this.setSessionUser(data.session?.user?.id ?? null, data.session?.user?.phone ?? null);
      this.client.auth.onAuthStateChange((_event, session) => {
        this.setSessionUser(session?.user?.id ?? null, session?.user?.phone ?? null);
        onChange();
      });
      await this.reload();
      onChange();
      this.channel = this.client
        .channel('jarra-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'baskets' }, () => this.pushReload(onChange))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => this.pushReload(onChange))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'merchants' }, () => this.pushReload(onChange))
        .subscribe();
    } catch (err) {
      // On ne fait pas tomber l'app : l'UI affiche le dernier état connu.
      console.error('[Jarra] Connexion Supabase impossible — vérifiez environment.ts', err);
    }
  }

  /** Recalcule horloge et statuts effectifs → toujours un nouvel état. */
  tick(): boolean {
    return true;
  }

  snapshot(): ProviderSnapshot {
    const now = new Date();
    return {
      merchants: this.merchantRows.map((m) => this.toMerchant(m)),
      baskets: this.basketRows.map((b) => this.toBasket(b, now)),
      orders: this.orderRows.map((o) => this.toOrder(o)),
      impact: this.impactData,
      trend: this.trendData,
      clockMin: minutesOf(now),
    };
  }

  async reserve(basketId: string, customerName: string): Promise<Order | null> {
    const data = await this.rpc<RpcOrder>('reserve_basket', {
      p_basket_id: basketId,
      p_customer_name: customerName || 'Client Jarra',
    });
    if (!data) return null;
    this.rememberOwn(data.id);
    await this.reloadSafe();
    return this.rpcToOrder(data);
  }

  async publish(merchantId: string, draft: PublishDraft, pin?: string): Promise<Basket | null> {
    const pickupTo = this.resolvePickupTo(draft.pickupUntil);
    if (!pickupTo) return null;
    const data = await this.rpc<{ id: string }>('publish_basket', {
      p_merchant_id: merchantId,
      p_pin: pin ?? '',
      p_title: draft.title,
      p_description: draft.description,
      p_original: draft.originalPrice,
      p_rescue: draft.rescuePrice,
      p_quantity: draft.quantity,
      p_pickup_to: pickupTo.toISOString(),
    });
    if (!data) return null;
    await this.reloadSafe();
    const row = this.basketRows.find((b) => b.id === data.id);
    return row ? this.toBasket(row, new Date()) : null;
  }

  async collect(pickupCode: string): Promise<Order | null> {
    const data = await this.rpc<RpcOrder>('collect_order', { p_code: pickupCode });
    if (!data) return null;
    await this.reloadSafe();
    return this.rpcToOrder(data);
  }

  async cancel(orderId: string): Promise<boolean> {
    const ok = await this.rpc<boolean>('cancel_order', { p_order_id: orderId });
    if (ok === true) await this.reloadSafe();
    return ok === true;
  }

  destroy(): void {
    if (this.client && this.channel) void this.client.removeChannel(this.channel);
    this.channel = null;
  }

  // ── Auth commerçant (OTP téléphone — étape 2) ─────────────────────

  auth(): MerchantAuth | null {
    if (!this.userId || !this.userPhone) return null;
    const owned = this.merchantRows.find((m) => m.owner_id === this.userId);
    return { phone: this.userPhone, merchantId: owned?.id ?? null };
  }

  async requestOtp(phone: string): Promise<boolean> {
    if (!this.client) return false;
    const { error } = await this.client.auth.signInWithOtp({ phone });
    return !error;
  }

  async verifyOtp(phone: string, code: string): Promise<MerchantAuth | null> {
    if (!this.client) return null;
    const { data, error } = await this.client.auth.verifyOtp({
      phone, token: code, type: 'sms',
    });
    if (error || !data.user) return null;
    this.setSessionUser(data.user.id, data.user.phone ?? null);
    return this.auth();
  }

  async claimMerchant(merchantId: string, pin: string): Promise<boolean> {
    if (!this.userId) return false;
    const ok = await this.rpc<boolean>('claim_merchant', {
      p_merchant_id: merchantId,
      p_pin: pin,
    });
    if (ok === true) await this.reloadSafe(); // owner_id → auth().merchantId
    return ok === true;
  }

  async signOut(): Promise<void> {
    await this.client?.auth.signOut();
    this.setSessionUser(null, null);
  }

  /** Supabase renvoie le téléphone sans « + » — on normalise en E.164. */
  private setSessionUser(id: string | null, phone: string | null): void {
    this.userId = id;
    this.userPhone = phone ? (phone.startsWith('+') ? phone : `+${phone}`) : null;
  }

  // ── interne ──────────────────────────────────────────────────────

  private async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T | null> {
    if (!this.client) return null;
    const { data, error } = await this.client.rpc(fn, args);
    if (error) {
      console.warn(`[Jarra] RPC ${fn} a échoué`, error.message);
      return null;
    }
    return (data ?? null) as T | null;
  }

  private pushReload(onChange: () => void): void {
    void this.reloadSafe().then(onChange);
  }

  private async reloadSafe(): Promise<void> {
    try {
      await this.reload();
    } catch (err) {
      console.warn('[Jarra] Rechargement impossible, état conservé', err);
    }
  }

  /** Recharge toutes les lectures en parallèle depuis PostgREST. */
  private async reload(): Promise<void> {
    if (!this.client) return;
    const [merchants, baskets, orders, impact, byArea, trend] = await Promise.all([
      this.client.from('merchants').select('*').order('name'),
      this.client.from('baskets').select('*').order('created_at', { ascending: false }).limit(200),
      this.client.from('orders').select('*').order('created_at', { ascending: false }).limit(300),
      this.client.from('v_impact').select('*').maybeSingle(),
      this.client.from('v_impact_by_area').select('*'),
      this.client.from('v_weekly_trend').select('*'),
    ]);
    const firstError = [merchants, baskets, orders, impact, byArea, trend].find((r) => r.error)?.error;
    if (firstError) throw new Error(firstError.message);

    this.merchantRows = (merchants.data ?? []) as MerchantRow[];
    this.basketRows = (baskets.data ?? []) as BasketRow[];
    this.orderRows = (orders.data ?? []) as OrderRow[];

    const impactRow = impact.data as
      | { meals_saved: number; co2_kg_avoided: number; tnd_saved: number; merchants_active: number }
      | null;
    this.impactData = {
      mealsSaved: Number(impactRow?.meals_saved ?? 0),
      co2KgAvoided: Number(impactRow?.co2_kg_avoided ?? 0),
      tndSaved: Number(impactRow?.tnd_saved ?? 0),
      merchantsActive: Number(impactRow?.merchants_active ?? 0),
      byArea: ((byArea.data ?? []) as Array<{ area: string; meals: number }>).map((r) => ({
        area: r.area,
        meals: Number(r.meals),
      })),
    };

    this.trendData = ((trend.data ?? []) as Array<{ day: string; meals: number }>).map((r) => ({
      day: DAY_LABELS[new Date(`${r.day}T12:00:00`).getDay()],
      meals: Number(r.meals),
    }));
  }

  /** Statut effectif : un panier « live » dont le créneau est passé est expiré. */
  private effectiveStatus(row: BasketRow, now: Date): BasketStatus {
    if (row.status === 'live') {
      if (row.quantity_left <= 0) return 'soldout';
      if (now >= new Date(row.pickup_to)) return 'expired';
    }
    return row.status as BasketStatus;
  }

  private toMerchant(m: MerchantRow): Merchant {
    return {
      id: m.id, name: m.name, kind: m.kind as MerchantKind,
      lat: Number(m.lat), lon: Number(m.lon), area: m.area,
      verified: m.verified, rating: Number(m.rating), ratingCount: m.rating_count,
    };
  }

  private toBasket(b: BasketRow, now: Date): Basket {
    return {
      id: b.id,
      merchantId: b.merchant_id,
      title: b.title,
      description: b.description,
      originalPrice: b.original_price,
      rescuePrice: b.rescue_price,
      quantityTotal: b.quantity_total,
      quantityLeft: b.quantity_left,
      pickupFromMin: minutesOf(new Date(b.pickup_from)),
      pickupToMin: minutesOf(new Date(b.pickup_to)),
      status: this.effectiveStatus(b, now),
    };
  }

  private toOrder(o: OrderRow): Order {
    return {
      id: o.id,
      basketId: o.basket_id,
      customerName: this.ownOrders.has(o.id) ? '__you__' : o.customer_name,
      pickupCode: o.pickup_code,
      status: o.status as OrderStatus,
      createdAtTick: minutesOf(new Date(o.created_at)),
    };
  }

  private rpcToOrder(o: RpcOrder): Order {
    return this.toOrder({
      id: o.id, basket_id: o.basketId, customer_name: o.customerName,
      pickup_code: o.pickupCode, status: o.status, created_at: o.createdAt,
    });
  }

  /**
   * Convertit "HH:MM" en Date du jour. Si l'heure est déjà passée,
   * le créneau est décalé à +2 h (aligné sur le comportement du moteur démo).
   */
  private resolvePickupTo(until: string): Date | null {
    const match = /^(\d{1,2}):(\d{2})/.exec(until.trim());
    if (!match) return null;
    const to = new Date();
    to.setHours(Number(match[1]) % 24, Number(match[2]), 0, 0);
    if (to.getTime() <= Date.now()) to.setTime(Date.now() + 2 * 60 * 60 * 1000);
    return to;
  }

  private rememberOwn(orderId: string): void {
    this.ownOrders.add(orderId);
    try {
      localStorage.setItem(LS_OWN_ORDERS, JSON.stringify([...this.ownOrders].slice(-50)));
    } catch {
      /* localStorage indisponible (tests) — non bloquant */
    }
  }

  private static loadOwnOrders(): string[] {
    try {
      const raw = localStorage.getItem(LS_OWN_ORDERS);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }
}
