// ═══════════════════════════════════════════════════════════════════
// JARRA — Tests du contrat DataProvider et de la façade CityStore
// Le provider démo doit satisfaire exactement le même contrat que le
// provider Supabase : c'est ce qui rend le backend interchangeable.
// ═══════════════════════════════════════════════════════════════════

import { TestBed } from '@angular/core/testing';
import { CityStore } from './city.store';
import { DemoProvider } from './demo.provider';

describe('DemoProvider (contrat DataProvider)', () => {
  it('expose un snapshot complet et cohérent dès la construction', () => {
    const provider = new DemoProvider(7);
    const s = provider.snapshot();
    expect(s.merchants.length).toBe(14);
    expect(s.baskets.length).toBe(s.merchants.length);
    expect(s.impact.mealsSaved).toBeGreaterThanOrEqual(0);
    expect(s.trend.length).toBe(7);
    expect(s.clockMin).toBeGreaterThan(0);
  });

  it('réserve de façon asynchrone avec un code à 4 caractères', async () => {
    const provider = new DemoProvider(7);
    const basket = provider.snapshot().baskets.find((b) => b.status === 'live')!;
    const before = basket.quantityLeft;
    const order = await provider.reserve(basket.id, 'Yasmine');
    expect(order).not.toBeNull();
    expect(order!.pickupCode.length).toBe(4);
    expect(provider.snapshot().baskets.find((b) => b.id === basket.id)!.quantityLeft)
      .toBe(before - 1);
  });

  it('publie, valide un retrait et annule en respectant le cycle de vie', async () => {
    const provider = new DemoProvider(7);
    const draft = {
      title: 'Panier contrat', description: 'Test du contrat provider.',
      originalPrice: 9000, rescuePrice: 3000, quantity: 2, pickupUntil: '23:30',
    };
    const basket = await provider.publish('m01', draft);
    expect(basket).not.toBeNull();
    expect(provider.snapshot().baskets.some((b) => b.id === basket!.id)).toBeTrue();

    const order = await provider.reserve(basket!.id, 'Client contrat');
    expect(order).not.toBeNull();

    const collected = await provider.collect(order!.pickupCode);
    expect(collected).not.toBeNull();
    expect(collected!.status).toBe('collected');

    const order2 = await provider.reserve(basket!.id, 'Client contrat 2');
    expect(await provider.cancel(order2!.id)).toBeTrue();
    expect(await provider.cancel(order2!.id)).toBeFalse(); // déjà annulée
  });

  it('avance le temps via tick() et signale les changements', () => {
    const provider = new DemoProvider(7);
    const before = provider.snapshot().clockMin;
    provider.tick();
    expect(provider.snapshot().clockMin).toBeGreaterThanOrEqual(before);
  });
});

describe('CityStore (façade)', () => {
  it('utilise le provider démo tant que Supabase n’est pas configuré', () => {
    TestBed.configureTestingModule({});
    const store = TestBed.inject(CityStore);
    expect(store.mode).toBe('demo');
    // État disponible immédiatement (synchrone) en mode démo.
    expect(store.merchants().length).toBe(14);
    expect(store.baskets().length).toBeGreaterThan(0);
  });

  it('expose merchant() et basketsOf() depuis le snapshot', () => {
    TestBed.configureTestingModule({});
    const store = TestBed.inject(CityStore);
    const first = store.merchants()[0];
    expect(store.merchant(first.id)?.name).toBe(first.name);
    expect(store.basketsOf(first.id).every((b) => b.merchantId === first.id)).toBeTrue();
  });

  it('propage une réservation dans les signals', async () => {
    TestBed.configureTestingModule({});
    const store = TestBed.inject(CityStore);
    const basket = store.baskets().find((b) => b.status === 'live')!;
    const before = basket.quantityLeft;
    const versionBefore = store.version();

    const order = await store.reserve(basket.id, 'Test facade');

    expect(order).not.toBeNull();
    expect(store.version()).toBeGreaterThan(versionBefore);
    expect(store.baskets().find((b) => b.id === basket.id)!.quantityLeft)
      .toBe(before - 1);
  });
});
