// ═══════════════════════════════════════════════════════════════════
// JARRA — Store de données réactif (façade)
// Expose l'état de la plateforme via des signals Angular. Délègue à un
// DataProvider : DemoProvider (simulation in-browser) ou
// SupabaseProvider (production) selon src/environments/environment.ts.
// Le UI ne sait pas à quel backend il parle.
// ═══════════════════════════════════════════════════════════════════

import { Injectable, OnDestroy, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { DAY_START_MIN } from './city.engine';
import { DataProvider, MerchantAuth, PublishDraft } from './data.provider';
import { DemoProvider } from './demo.provider';
import { SupabaseProvider } from './supabase.provider';
import { Basket, ImpactStats, Merchant, Order, WeeklyTrend } from './model';

/** Démo : 350 ms par minute simulée. Live : rafraîchit horloge/statuts. */
const DEMO_TICK_MS = 350;
const LIVE_TICK_MS = 20_000;

const EMPTY_IMPACT: ImpactStats = {
  mealsSaved: 0, co2KgAvoided: 0, tndSaved: 0, merchantsActive: 0, byArea: [],
};

/** Détecte l'exécution sous Karma/Jasmine (tests unitaires). */
function isTestRun(): boolean {
  return typeof window !== 'undefined' && '__karma__' in window;
}

/** Choisit le backend : Supabase si configuré, sinon simulation démo.
 *  En test, toujours la démo : jamais de réseau dans les specs. */
function createProvider(): DataProvider {
  if (!isTestRun() && environment.supabaseUrl && environment.supabaseAnonKey) {
    return new SupabaseProvider(environment.supabaseUrl, environment.supabaseAnonKey);
  }
  return new DemoProvider(7);
}

@Injectable({ providedIn: 'root' })
export class CityStore implements OnDestroy {
  private readonly provider: DataProvider = createProvider();

  /** 'demo' = ville simulée · 'live' = backend Supabase temps réel. */
  readonly mode = this.provider.mode;

  readonly merchants = signal<readonly Merchant[]>([]);
  readonly baskets = signal<readonly Basket[]>([]);
  readonly orders = signal<readonly Order[]>([]);
  readonly clockMin = signal(DAY_START_MIN);
  readonly impact = signal<ImpactStats>(EMPTY_IMPACT);
  readonly trend = signal<readonly WeeklyTrend[]>([]);

  /** Version qui s'incrémente à chaque changement — pour les computed. */
  readonly version = signal(0);

  /** Session commerçant connectée (OTP) — null en démo ou déconnecté. */
  readonly merchantAuth = signal<MerchantAuth | null>(null);

  private timer = 0;

  constructor() {
    // Le provider démo est prêt immédiatement (synchrone) ; le provider
    // live pousse son état via onChange une fois le chargement terminé.
    this.applySnapshot();
    void this.provider.init(() => this.applySnapshot());
    // En test (Jasmine) on ne démarre pas la boucle de temps.
    if (!isTestRun()) {
      this.timer = window.setInterval(
        () => this.advance(),
        this.mode === 'demo' ? DEMO_TICK_MS : LIVE_TICK_MS,
      );
    }
  }

  ngOnDestroy(): void {
    window.clearInterval(this.timer);
    this.provider.destroy();
  }

  /** Avance le temps ; ne notifie que si quelque chose a changé. */
  advance(): void {
    if (this.provider.tick?.()) {
      this.applySnapshot();
    } else {
      this.clockMin.set(this.provider.snapshot().clockMin);
    }
  }

  async reserve(basketId: string, customerName: string): Promise<Order | null> {
    const order = await this.provider.reserve(basketId, customerName);
    if (order) this.applySnapshot();
    return order;
  }

  async collect(code: string): Promise<Order | null> {
    const order = await this.provider.collect(code);
    if (order) this.applySnapshot();
    return order;
  }

  /**
   * Publication express d'un commerçant. En mode live, `pin` est le code
   * commerçant vérifié par le backend (ignoré en démo).
   */
  async publish(merchantId: string, draft: PublishDraft, pin?: string): Promise<Basket | null> {
    const basket = await this.provider.publish(merchantId, draft, pin);
    if (basket) this.applySnapshot();
    return basket;
  }

  async cancel(orderId: string): Promise<boolean> {
    const ok = await this.provider.cancel(orderId);
    if (ok) this.applySnapshot();
    return ok;
  }

  // ── Auth commerçant (OTP téléphone — live uniquement) ─────────────

  /** Envoie le code OTP par SMS. Faux en mode démo (pas d'auth). */
  async requestOtp(phone: string): Promise<boolean> {
    return (await this.provider.requestOtp?.(phone)) ?? false;
  }

  /** Vérifie le code reçu par SMS → session commerçant ouverte. */
  async verifyOtp(phone: string, code: string): Promise<MerchantAuth | null> {
    const auth = (await this.provider.verifyOtp?.(phone, code)) ?? null;
    this.applySnapshot();
    return auth;
  }

  /** Lie le commerce sélectionné au numéro connecté (une fois, via PIN). */
  async claimMerchant(merchantId: string, pin: string): Promise<boolean> {
    const ok = (await this.provider.claimMerchant?.(merchantId, pin)) ?? false;
    if (ok) this.applySnapshot();
    return ok;
  }

  async signOut(): Promise<void> {
    await this.provider.signOut?.();
    this.applySnapshot();
  }

  // ── Notifications push (live uniquement) ──────────────────────────

  /** Enregistre l'abonnement Web Push de cet appareil. Faux en démo. */
  async savePushSubscription(sub: {
    endpoint: string;
    keys?: { p256dh?: string; auth?: string };
  }): Promise<boolean> {
    return (await this.provider.savePushSubscription?.(sub)) ?? false;
  }

  /** Supprime l'abonnement Web Push de cet appareil. */
  async deletePushSubscription(endpoint: string): Promise<boolean> {
    return (await this.provider.deletePushSubscription?.(endpoint)) ?? false;
  }

  merchant(id: string): Merchant | undefined {
    return this.merchants().find((m) => m.id === id);
  }

  basketsOf(merchantId: string): readonly Basket[] {
    return this.baskets().filter((b) => b.merchantId === merchantId);
  }

  private applySnapshot(): void {
    const s = this.provider.snapshot();
    this.merchants.set(s.merchants);
    this.baskets.set(s.baskets);
    this.orders.set(s.orders);
    this.impact.set(s.impact);
    this.trend.set(s.trend);
    this.clockMin.set(s.clockMin);
    this.merchantAuth.set(this.provider.auth?.() ?? null);
    this.version.update((v) => v + 1);
  }
}
