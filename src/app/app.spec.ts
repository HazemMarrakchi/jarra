import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { LandingComponent } from './landing/landing.component';
import { ExploreComponent } from './explore/explore.component';
import { ImpactComponent } from './impact/impact.component';
import { MerchantComponent } from './merchant/merchant.component';

function setup(): void {
  TestBed.configureTestingModule({
    providers: [provideRouter(routes), provideAnimations()],
  });
}

describe('AppComponent (shell)', () => {
  beforeEach(async () => {
    setup();
    await TestBed.configureTestingModule({ imports: [AppComponent] }).compileComponents();
  });

  it('affiche la marque et la navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Jarra');
    expect(text).toContain('Explorer');
    expect(text).toContain('Impact');
  });
});

describe('LandingComponent', () => {
  beforeEach(async () => {
    setup();
    await TestBed.configureTestingModule({ imports: [LandingComponent] }).compileComponents();
  });

  it('présente la proposition de valeur et les compteurs d\'impact', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('seconde vie');
    expect(text).toContain('repas sauvés');
    expect(text).toContain('CO₂');
  });

  it('remplit la jarre proportionnellement aux repas sauvés', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    const y = fixture.componentInstance.fillY();
    expect(y).toBeGreaterThanOrEqual(110);
    expect(y).toBeLessThanOrEqual(260);
  });
});

describe('ExploreComponent', () => {
  beforeEach(async () => {
    setup();
    await TestBed.configureTestingModule({ imports: [ExploreComponent] }).compileComponents();
  });

  it('affiche la carte de Tunis et des paniers au chargement', () => {
    const fixture = TestBed.createComponent(ExploreComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('jr-city-map')).toBeTruthy();
    expect(fixture.componentInstance.pins().length).toBe(14);
    expect(fixture.componentInstance.totalLive()).toBeGreaterThan(0);
  });

  it('filtre les paniers par type de commerce', () => {
    const fixture = TestBed.createComponent(ExploreComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    const all = component.totalLive();
    component.kindFilter.set('bakery');
    fixture.detectChanges();

    expect(component.filtered().length).toBeLessThanOrEqual(all);
    expect(component.filtered().every((b) => component.merchantOf(b).kind === 'bakery')).toBeTrue();
  });

  it('sélectionne et désélectionne un pin de la carte', () => {
    const fixture = TestBed.createComponent(ExploreComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const pin = component.pins()[0];

    component.selectPin(pin);
    expect(component.selectedId()).toBe(pin.merchant.id);

    component.selectPin(pin);
    expect(component.selectedId()).toBeNull();
  });

  it('trie les paniers par prix croissant', () => {
    const fixture = TestBed.createComponent(ExploreComponent);
    fixture.detectChanges();
    const prices = fixture.componentInstance.filtered().map((b) => b.rescuePrice);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});

describe('ImpactComponent', () => {
  beforeEach(async () => {
    setup();
    await TestBed.configureTestingModule({ imports: [ImpactComponent] }).compileComponents();
  });

  it('affiche les KPI et la tendance hebdomadaire', () => {
    const fixture = TestBed.createComponent(ImpactComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('repas sauvés');
    expect(text).toContain('Tendance de la semaine');
    expect(component.trend().length).toBe(7);
    expect(component.weekTotal()).toBeGreaterThan(0);
  });

  it('normalise la hauteur des barres entre 0 et 100', () => {
    const fixture = TestBed.createComponent(ImpactComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    for (const d of component.trend()) {
      const h = component.barHeight(d.meals);
      expect(h).toBeGreaterThan(0);
      expect(h).toBeLessThanOrEqual(100);
    }
  });

  it('estime le CO₂ évité de la semaine', () => {
    const fixture = TestBed.createComponent(ImpactComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.weekCo2()).toBeGreaterThan(0);
  });
});

describe('MerchantComponent (dashboard)', () => {
  beforeEach(async () => {
    setup();
    await TestBed.configureTestingModule({ imports: [MerchantComponent] }).compileComponents();
  });

  it('affiche le commerce sélectionné et une prédiction d\'invendus', () => {
    const fixture = TestBed.createComponent(MerchantComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.me()).toBeTruthy();
    expect(component.prediction().expected).toBeGreaterThan(0);
    expect(component.prediction().confidence).toBeGreaterThanOrEqual(45);
  });

  it('publie un panier qui apparaît immédiatement dans la liste du commerçant', () => {
    const fixture = TestBed.createComponent(MerchantComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const before = component.myBaskets().length;

    component.draftTitle = 'Panier test';
    component.publish();
    fixture.detectChanges();

    expect(component.myBaskets().length).toBe(before + 1);
    expect(component.myBaskets()[0].title).toBe('Panier test');
    expect(component.publishMsg()).toContain('en ligne');
  });

  it('valide un retrait via le code client et incrémente les repas sauvés', () => {
    const fixture = TestBed.createComponent(MerchantComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    const basket = component.myBaskets().find((b) => b.status === 'live')!;
    const order = component.store.reserve(basket.id, 'Client test')!;

    component.codeInput = order.pickupCode;
    component.collect();
    fixture.detectChanges();

    expect(component.collectOk()).toBeTrue();
    expect(component.collectMsg()).toContain('sauvé');
  });

  it('signale un code invalide', () => {
    const fixture = TestBed.createComponent(MerchantComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.codeInput = 'ZZZZ';
    component.collect();

    expect(component.collectOk()).toBeFalse();
    expect(component.collectMsg()).toContain('introuvable');
  });

  it('calcule un taux de sauvetage entre 0 et 100', () => {
    const fixture = TestBed.createComponent(MerchantComponent);
    fixture.detectChanges();
    const rate = fixture.componentInstance.stats().rescueRate;
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(100);
  });

  it('change de commerce et recharge ses paniers', () => {
    const fixture = TestBed.createComponent(MerchantComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.selectShop('m05');
    fixture.detectChanges();

    expect(component.me()!.id).toBe('m05');
    expect(component.myBaskets().every((b) => b.merchantId === 'm05')).toBeTrue();
  });
});
