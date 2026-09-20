// ═══════════════════════════════════════════════════════════════════
// JARRA — Store de données réactif
// Expose la ville simulée via des signals Angular. Demain, un
// SupabaseProvider implémentera les mêmes méthodes sans toucher au UI.
// ═══════════════════════════════════════════════════════════════════

import { Injectable, OnDestroy, signal } from '@angular/core';
import { CityEngine, DAY_START_MIN } from './city.engine';
import { Basket, ImpactStats, Merchant, Order, WeeklyTrend } from './model';

/** Intervalle réel entre deux minutes simulées (la journée est accélérée). */
const TICK_MS = 350;

@Injectable({ providedIn: 'root' })
export class CityStore implements OnDestroy {
  private engine = new CityEngine(7);

  readonly merchants = signal<readonly Merchant[]>(this.engine.merchants);
  readonly baskets = signal<readonly Basket[]>([]);
  readonly orders = signal<readonly Order[]>([]);
  readonly clockMin = signal(DAY_START_MIN);
  readonly impact = signal<ImpactStats>(this.engine.impact());
  readonly trend = signal<readonly WeeklyTrend[]>(this.engine.weeklyTrend());

  /** Version qui s'incrémente à chaque changement — pour les computed. */
  readonly version = signal(0);

  private timer = 0;

  constructor() {
    this.refresh();
    // En test (Jasmine) on ne démarre pas la boucle de simulation.
    if (typeof window !== 'undefined' && !('__karma__' in window)) {
      this.timer = window.setInterval(() => this.advance(), TICK_MS);
    }
  }

  ngOnDestroy(): void {
    window.clearInterval(this.timer);
  }

  /** Avance la ville ; ne notifie que si quelque chose a changé. */
  advance(): void {
    if (this.engine.tick()) this.refresh();
    this.clockMin.set(this.engine.clockMin);
  }

  reserve(basketId: string, customerName: string): Order | null {
    const order = this.engine.reserve(basketId, customerName);
    if (order) this.refresh();
    return order;
  }

  collect(code: string): Order | null {
    const order = this.engine.collect(code);
    if (order) this.refresh();
    return order;
  }

  /** Publication express d'un commerçant (dashboard). */
  publish(
    merchantId: string,
    draft: {
      title: string; description: string; originalPrice: number;
      rescuePrice: number; quantity: number; pickupUntil: string;
    },
  ): Basket | null {
    const basket = this.engine.publish(merchantId, draft);
    if (basket) this.refresh();
    return basket;
  }

  cancel(orderId: string): boolean {
    const ok = this.engine.cancel(orderId);
    if (ok) this.refresh();
    return ok;
  }

  merchant(id: string): Merchant | undefined {
    return this.engine.merchant(id);
  }

  basketsOf(merchantId: string): readonly Basket[] {
    return this.engine.basketsOf(merchantId);
  }

  private refresh(): void {
    this.baskets.set([...this.engine.baskets]);
    this.orders.set([...this.engine.orders]);
    this.impact.set(this.engine.impact());
    this.version.update((v) => v + 1);
  }
}
