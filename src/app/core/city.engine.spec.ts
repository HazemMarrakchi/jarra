import { CityEngine, mulberry32 } from './city.engine';
import { discountPct, formatClock, formatTnd } from './model';
import { predictWaste } from './predictor';

describe('CityEngine (déterminisme)', () => {
  it('produit la même ville pour la même seed', () => {
    const a = new CityEngine(7);
    const b = new CityEngine(7);
    expect(a.merchants.map((m) => m.name)).toEqual(b.merchants.map((m) => m.name));
    expect(a.baskets.length).toBe(b.baskets.length);
    expect(a.baskets.map((x) => x.title)).toEqual(b.baskets.map((x) => x.title));
  });

  it('pré-remplit un panier par commerçant à l\'ouverture', () => {
    const engine = new CityEngine(7);
    expect(engine.merchants.length).toBeGreaterThan(0);
    expect(engine.baskets.length).toBe(engine.merchants.length);
    expect(engine.liveBaskets().length).toBe(engine.baskets.length);
  });

  it('expose 14 commerçants répartis sur les quartiers de Gabès', () => {
    const engine = new CityEngine(7);
    expect(engine.merchants.length).toBe(14);
    const areas = new Set(engine.merchants.map((m) => m.area));
    expect(areas.size).toBeGreaterThanOrEqual(8);
    expect(areas.has('Médina')).toBeTrue();
  });
});

describe('CityEngine — cycle de vie d\'un panier', () => {
  it('décrémente le stock à la réservation et attribue un code à 4 caractères', () => {
    const engine = new CityEngine(7);
    const basket = engine.liveBaskets()[0];
    const before = basket.quantityLeft;

    const order = engine.reserve(basket.id, 'Yasmine');

    expect(order).not.toBeNull();
    expect(order!.pickupCode.length).toBe(4);
    expect(basket.quantityLeft).toBe(before - 1);
  });

  it('refuse de réserver un panier épuisé', () => {
    const engine = new CityEngine(7);
    const basket = engine.liveBaskets()[0];
    while (basket.quantityLeft > 0) engine.reserve(basket.id, 'Karim');

    expect(basket.status).toBe('soldout');
    expect(engine.reserve(basket.id, 'Karim')).toBeNull();
  });

  it('valide un retrait avec le code et compte l\'impact', () => {
    const engine = new CityEngine(7);
    const basket = engine.liveBaskets()[0];
    const order = engine.reserve(basket.id, 'Amine')!;
    const mealsBefore = engine.impact().mealsSaved;

    const collected = engine.collect(order.pickupCode);

    expect(collected).not.toBeNull();
    expect(collected!.status).toBe('collected');
    expect(engine.impact().mealsSaved).toBe(mealsBefore + 1);
    expect(engine.impact().tndSaved).toBeGreaterThan(0);
  });

  it('rejette un code inconnu', () => {
    const engine = new CityEngine(7);
    expect(engine.collect('ZZZZ')).toBeNull();
  });

  it('remet le stock en ligne après une annulation', () => {
    const engine = new CityEngine(7);
    const basket = engine.liveBaskets()[0];
    const before = basket.quantityLeft;
    const order = engine.reserve(basket.id, 'Sara')!;

    expect(basket.quantityLeft).toBe(before - 1);
    expect(engine.cancel(order.id)).toBeTrue();
    expect(basket.quantityLeft).toBe(before);
    expect(order.status).toBe('cancelled');
  });

  it('expire les paniers dont le créneau est dépassé', () => {
    const engine = new CityEngine(7);
    for (let i = 0; i < 1000; i++) engine.tick();

    const stillLive = engine.baskets.filter((b) => b.status === 'live');
    expect(stillLive.length).toBe(0);
    expect(engine.impact().mealsSaved).toBeGreaterThan(0);
  });
});

describe('CityEngine — publication commerçant', () => {
  it('publie un panier visible immédiatement et calcule son créneau', () => {
    const engine = new CityEngine(7);
    const before = engine.liveBaskets().length;

    const basket = engine.publish('m01', {
      title: 'Test panier',
      description: 'desc',
      originalPrice: 12000,
      rescuePrice: 4000,
      quantity: 2,
      pickupUntil: '23:00',
    });

    expect(basket).not.toBeNull();
    expect(basket!.status).toBe('live');
    expect(basket!.pickupFromMin).toBe(engine.clockMin);
    expect(basket!.pickupToMin).toBe(23 * 60);
    expect(engine.liveBaskets().length).toBe(before + 1);
  });

  it('refuse un prix nul ou négatif', () => {
    const engine = new CityEngine(7);
    expect(
      engine.publish('m01', {
        title: 'x', description: 'x', originalPrice: 0, rescuePrice: 0, quantity: 1, pickupUntil: '23:00',
      }),
    ).toBeNull();
  });

  it('refuse un commerçant inconnu', () => {
    const engine = new CityEngine(7);
    expect(
      engine.publish('inconnu', {
        title: 'x', description: 'x', originalPrice: 9000, rescuePrice: 3000, quantity: 1, pickupUntil: '23:00',
      }),
    ).toBeNull();
  });
});

describe('Impact & métriques', () => {
  it('agrège les repas par quartier après retrait', () => {
    const engine = new CityEngine(7);
    const basket = engine.liveBaskets()[0];
    const merchant = engine.merchant(basket.merchantId)!;
    const order = engine.reserve(basket.id, 'Nour')!;
    engine.collect(order.pickupCode);

    const byArea = engine.impact().byArea;
    expect(byArea.some((a) => a.area === merchant.area && a.meals >= 1)).toBeTrue();
    expect(engine.impact().co2KgAvoided).toBeGreaterThan(0);
  });

  it('produit une tendance hebdo déterministe de 7 jours', () => {
    const a = new CityEngine(7).weeklyTrend();
    const b = new CityEngine(7).weeklyTrend();
    expect(a.length).toBe(7);
    expect(a).toEqual(b);
    expect(a.every((d) => d.meals > 0)).toBeTrue();
  });

  it('compte les commerçants actifs', () => {
    const engine = new CityEngine(7);
    expect(engine.impact().merchantsActive).toBe(engine.merchants.length);
  });
});

describe('Prédiction des invendus', () => {
  const history = [8, 9, 7, 10, 8, 9];

  it('augmente la prévision le week-end (saisonnalité)', () => {
    const monday = predictWaste({ history, weekday: 0 });
    const saturday = predictWaste({ history, weekday: 5 });

    expect(saturday.expected).toBeGreaterThan(monday.expected);
    expect(saturday.weekdayFactor).toBeGreaterThan(monday.weekdayFactor);
  });

  it('fournit un intervalle ordonné et une confiance bornée', () => {
    const p = predictWaste({ history: [...history, 6, 7, 6, 5, 6, 7, 6, 8], weekday: 2 });
    expect(p.low).toBeLessThanOrEqual(p.expected);
    expect(p.high).toBeGreaterThanOrEqual(p.expected);
    expect(p.confidence).toBeGreaterThanOrEqual(45);
    expect(p.confidence).toBeLessThanOrEqual(96);
  });

  it('reste prudent sans historique', () => {
    const p = predictWaste({ history: [], weekday: 3 });
    expect(p.expected).toBeGreaterThanOrEqual(1);
    expect(p.tip.length).toBeGreaterThan(0);
  });

  it('nomme correctement le jour visé', () => {
    expect(predictWaste({ history, weekday: 5 }).weekday).toBe('samedi');
    expect(predictWaste({ history, weekday: 0 }).weekday).toBe('lundi');
  });
});

describe('Helpers de formatting', () => {
  it('formate les millimes en dinars à 3 décimales', () => {
    expect(formatTnd(2500)).toBe('2.500');
    expect(formatTnd(10000)).toBe('10.000');
    expect(formatTnd(500)).toBe('0.500');
  });

  it('formate les minutes de journée en horloge', () => {
    expect(formatClock(480)).toBe('08:00');
    expect(formatClock(1290)).toBe('21:30');
  });

  it('calcule la remise d\'un panier', () => {
    expect(discountPct({ originalPrice: 10000, rescuePrice: 3000 })).toBe(70);
    expect(discountPct({ originalPrice: 0, rescuePrice: 0 })).toBe(0);
  });
});

describe('RNG déterministe', () => {
  it('génère la même séquence pour la même seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
    expect(seqA.every((v) => v >= 0 && v < 1)).toBeTrue();
  });
});

