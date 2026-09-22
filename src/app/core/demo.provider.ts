// ═══════════════════════════════════════════════════════════════════
// JARRA — Provider de démonstration
// Enroule le CityEngine déterministe derrière le contrat DataProvider.
// Zéro réseau : la démo publique et la CI utilisent ce provider.
// ═══════════════════════════════════════════════════════════════════

import { CityEngine } from './city.engine';
import { DataProvider, ProviderSnapshot, PublishDraft } from './data.provider';
import { Basket, Order } from './model';

export class DemoProvider implements DataProvider {
  readonly mode = 'demo' as const;

  private readonly engine: CityEngine;

  constructor(seed = 7) {
    this.engine = new CityEngine(seed);
  }

  /** Synchrone : l'état initial est déjà complet à la construction. */
  init(): void {
    /* rien à charger ni à abonner en mode démo */
  }

  tick(): boolean {
    return this.engine.tick();
  }

  snapshot(): ProviderSnapshot {
    return {
      merchants: this.engine.merchants,
      baskets: [...this.engine.baskets],
      orders: [...this.engine.orders],
      impact: this.engine.impact(),
      trend: this.engine.weeklyTrend(),
      clockMin: this.engine.clockMin,
    };
  }

  reserve(basketId: string, customerName: string): Promise<Order | null> {
    return Promise.resolve(this.engine.reserve(basketId, customerName));
  }

  publish(merchantId: string, draft: PublishDraft): Promise<Basket | null> {
    return Promise.resolve(this.engine.publish(merchantId, draft));
  }

  collect(pickupCode: string): Promise<Order | null> {
    return Promise.resolve(this.engine.collect(pickupCode));
  }

  cancel(orderId: string): Promise<boolean> {
    return Promise.resolve(this.engine.cancel(orderId));
  }

  destroy(): void {
    /* aucun abonnement à libérer */
  }
}
