import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BasketListComponent } from '../core/basket-list.component';
import { CityMapComponent, MapPin } from '../core/city-map.component';
import { CityStore } from '../core/city.store';
import { Basket, Merchant, MerchantKind, formatClock } from '../core/model';
import { CITIZEN_POS, KINDS, KIND_ICON, KIND_LONG, distanceM, formatDistance } from '../core/ui';

@Component({
  selector: 'jr-explore',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CityMapComponent, RouterLink, BasketListComponent],
  template: `
    <!-- ── En-tête de page ──────────────────────────────────────── -->
    <section class="page-head">
      <div class="shell-lg head-inner">
        <span class="eco-badge" style="background:var(--secondary-container);border:0;color:var(--on-secondary-container);padding:.35rem .8rem">
          <span class="ms" style="font-size:15px">payments</span>
          Paiement direct sur place (Espèces &amp; TPE local) • Aucune carte bancaire requise
        </span>

        <div class="head-cols">
          <div>
            <h1>Panier frais &amp; invendus du soir à proximité</h1>
            <p class="body-lg muted" style="margin-top:var(--space-sm);max-width:44rem">
              Repérez les disponibilités en direct chez vos artisans de quartier et réglez sur place, au comptoir, sans
              aucun frais intermédiaire.
            </p>
          </div>
          <div class="update-card">
            <span class="dot-live"></span>
            <div>
              <span class="label-sm muted" style="text-transform:uppercase">Mise à jour directe</span>
              <p class="headline-sm mono-num">{{ clock() }} • Gabès</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Barre d'outils collante ──────────────────────────────── -->
    <section class="toolbar">
      <div class="shell-lg">
        <div class="tool-grid">
          <div class="field-group" style="grid-column:span 6">
            <span class="ms ms-20">search</span>
            <label class="sr" for="qSearch">Rechercher un commerce ou un quartier</label>
            <input
              id="qSearch"
              class="input"
              type="search"
              placeholder="Boulangerie, quartier, artisan…"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
          </div>

          <div class="field-group" style="grid-column:span 3">
            <span class="ms ms-20">near_me</span>
            <label class="sr" for="qRadius">Rayon</label>
            <select id="qRadius" class="select" [value]="radius()" (change)="radius.set(+$any($event.target).value)">
              <option [value]="2000">Rayon &lt; 2 km (à pied)</option>
              <option [value]="5000">Rayon &lt; 5 km (environs)</option>
              <option [value]="99999">Tout Gabès</option>
            </select>
          </div>

          <div class="field-group" style="grid-column:span 3">
            <span class="ms ms-20">schedule</span>
            <label class="sr" for="qSlot">Créneau</label>
            <select id="qSlot" class="select" [value]="slot()" (change)="slot.set($any($event.target).value)">
              <option value="all">Tous horaires</option>
              <option value="evening">Retrait ce soir (18h – 21h)</option>
              <option value="late">Tardif (après 20h30)</option>
            </select>
          </div>
        </div>

        <div class="chips">
          <button class="fchip" type="button" [attr.aria-pressed]="kindFilter() === 'all'" (click)="kindFilter.set('all')">
            <span class="ms ms-18">apps</span>Tous les invendus <b>{{ totalLive() }}</b>
          </button>
          @for (k of kinds; track k) {
            <button class="fchip" type="button" [attr.aria-pressed]="kindFilter() === k" (click)="kindFilter.set(k)">
              <span class="ms ms-18">{{ iconOf(k) }}</span>{{ labelOf(k) }} <b>{{ countOf(k) }}</b>
            </button>
          }
        </div>
      </div>
    </section>

    <!-- ── Corps : liste + carte ────────────────────────────────── -->
    <section class="shell-lg body-grid">
      <div class="col-list">
        <!-- Bandeau prévision IA -->
        <div class="ai-banner">
          <span class="ai-ico"><span class="ms ms-24">auto_awesome</span></span>
          <div>
            <div class="ai-title">
              <span class="label-sm" style="color:var(--on-secondary-container);text-transform:uppercase">IA Prédictive Jarra Pulse</span>
              <span class="dot-live" style="width:6px;height:6px"></span>
              <span class="label-sm muted">Confiance {{ confidence() }} %</span>
            </div>
            <p class="body-md" style="margin-top:6px">
              Prédiction de surplus en cours sur la prochaine heure :
              <b class="mono-num">+{{ coming() }} paniers attendus</b> à Gabès après les fins de fournée.
            </p>
            <div class="prob">
              <span class="label-sm" style="color:var(--on-secondary-container)">Fourchette</span>
              <span class="bar"><i [style.width.%]="confidence()"></i></span>
              <span class="pc">{{ coming() }} – {{ coming() + 6 }}</span>
            </div>
          </div>
        </div>

        <div class="list-head">
          <p class="label-lg">Paniers confirmés disponibles immédiatement</p>
          <div class="row gap-sm">
            <span class="label-sm muted">Trier par</span>
            <label class="sr" for="sortSel">Trier les résultats</label>
            <select id="sortSel" class="select" style="height:2.25rem;width:auto" [value]="sortMode()" (change)="sortMode.set($any($event.target).value)">
              <option value="price">Prix croissant</option>
              <option value="distance">Plus proche de vous</option>
              <option value="slot">Créneau le plus tôt</option>
            </select>
          </div>
        </div>

        @if (filtered().length === 0) {
          <div class="empty">
            <span class="ms ms-40">search_off</span>
            <b>Aucun invendu ne correspond à ces filtres.</b>
            <span class="body-sm">Élargissez le rayon ou revenez en fin de service — la ville bouge vite.</span>
            <button class="btn btn-ghost btn-sm" type="button" (click)="reset()">Réinitialiser les filtres</button>
          </div>
        } @else {
          <jr-basket-list [baskets]="filtered()" [pickedId]="selectedId()" />
        }

        <p class="body-sm muted">
          {{ filtered().length }} panier(s) affiché(s) sur {{ totalLive() }} publiés aujourd'hui dans la zone.
        </p>
      </div>

      <!-- Colonne carte -->
      <div class="col-map">
        <div class="map-card">
          <div class="map-head">
            <div>
              <p class="label-sm muted" style="text-transform:uppercase">Carte en direct</p>
              <p class="label-lg">{{ mapCount() }} commerces · {{ totalLive() }} paniers</p>
            </div>
            <span class="eco-badge"><span class="ms" style="font-size:14px">radar</span>Live</span>
          </div>

          <jr-city-map
            [pins]="pins()"
            [selectedId]="selectedId()"
            [kindFilter]="kindFilter()"
            (select)="selectPin($event)"
            (background)="selectedId.set(null)"
          />

          @if (picked(); as m) {
            <div class="map-pop">
              <div class="row between" style="align-items:flex-start">
                <div>
                  <p class="label-sm muted" style="text-transform:uppercase">{{ labelOf(m.kind) }} · {{ m.area }}</p>
                  <h3 style="margin-top:2px">{{ m.name }}</h3>
                </div>
                <button class="btn btn-quiet btn-sm" type="button" aria-label="Fermer" (click)="selectedId.set(null)">
                  <span class="ms ms-18">close</span>
                </button>
              </div>
              <div class="row between" style="margin-top:var(--space-sm)">
                <span class="eco-badge"><span class="ms" style="font-size:14px">shopping_basket</span>{{ unitsOf(m.id) }} unités</span>
                <a class="btn btn-primary btn-sm" [routerLink]="['/boutique', m.id]">
                  <span class="ms ms-18">storefront</span>Voir la boutique
                </a>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── Alerte quartier ──────────────────────────────────────── -->
    <section class="shell-lg section-tight">
      <div class="panel-ink alert-band">
        <div>
          <span class="eco-badge" style="background:rgba(255,255,255,.14);border:0;color:#c9f3dd">
            <span class="ms" style="font-size:15px">notifications_active</span>Alerte de quartier
          </span>
          <h2 style="color:var(--on-primary);margin-top:var(--space-sm)">Ne ratez plus aucun panier du soir dans votre quartier</h2>
          <p class="body-md" style="color:var(--on-primary-container);margin-top:var(--space-sm);max-width:48rem">
            Recevez une alerte dès qu'un artisan publie un invendu à moins de 500 mètres, sans installer d'application.
          </p>
        </div>
        <button class="btn btn-invert" type="button">
          <span class="ms ms-18">chat</span>Activer mes alertes WhatsApp
        </button>
      </div>
    </section>
  `,
  styles: [`
    .page-head { background: var(--surface-container-low); padding: var(--space-xl) 0; }
    .head-inner { display: grid; gap: var(--space-md); }
    .head-cols { display: grid; gap: var(--space-md); align-items: end; }
    @media (min-width: 1024px) { .head-cols { grid-template-columns: minmax(0, 1fr) auto; } }
    .update-card {
      display: flex; align-items: center; gap: var(--space-sm);
      background: var(--surface-container-lowest); border-radius: var(--r-lg);
      padding: var(--space-sm) var(--space-md); box-shadow: var(--shadow-1); width: fit-content;
    }

    .toolbar {
      position: sticky; top: 5rem; z-index: 40;
      background: rgba(250, 248, 255, .95); backdrop-filter: blur(12px);
      box-shadow: 0 1px 8px rgba(0, 0, 0, .05);
      padding: var(--space-md) 0;
    }
    @media (max-width: 767px) { .toolbar { top: 4rem; } }
    .tool-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--space-sm); }
    @media (max-width: 1023px) { .tool-grid > * { grid-column: span 6 !important; } }
    @media (max-width: 640px) { .tool-grid > * { grid-column: span 12 !important; } }
    .chips { display: flex; gap: var(--space-sm); overflow-x: auto; padding: var(--space-md) 0 2px; scrollbar-width: none; }
    .chips::-webkit-scrollbar { display: none; }
    @media (max-width: 1280px) {
      .chips { -webkit-mask-image: linear-gradient(90deg, #000 0, #000 calc(100% - 40px), transparent 100%);
               mask-image: linear-gradient(90deg, #000 0, #000 calc(100% - 40px), transparent 100%); }
    }

    .body-grid { display: grid; gap: var(--space-lg); padding: var(--space-lg) 0; align-items: start; }
    @media (min-width: 1024px) { .body-grid { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); } }
    .col-list { display: grid; gap: var(--space-md); min-width: 0; }
    .list-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-md); flex-wrap: wrap; }
    .col-map { min-width: 0; }
    @media (min-width: 1024px) { .col-map { position: sticky; top: 14rem; } }
    .map-card {
      background: var(--surface-container-lowest); border: 1px solid var(--hairline);
      border-radius: var(--r-lg); box-shadow: var(--shadow-1); padding: var(--space-md);
    }
    .map-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); margin-bottom: var(--space-md); }
    .map-pop { margin-top: var(--space-md); padding: var(--space-md); border-radius: var(--r-md); background: var(--surface-container-low); }

    .alert-band {
      display: grid; gap: var(--space-lg); align-items: center; padding: var(--space-xl) var(--gutter-lg);
    }
    @media (min-width: 900px) { .alert-band { grid-template-columns: minmax(0, 1fr) auto; } }
  `],
})
export class ExploreComponent {
  private readonly store = inject(CityStore);

  readonly kinds = KINDS;
  readonly kindFilter = signal<MerchantKind | 'all'>('all');
  readonly selectedId = signal<string | null>(null);
  readonly query = signal('');
  readonly radius = signal(5000);
  readonly slot = signal<'all' | 'evening' | 'late'>('all');
  readonly sortMode = signal<'price' | 'distance' | 'slot'>('price');

  /** Pins de la carte : un par commerçant, avec stock agrégé. */
  readonly pins = computed<MapPin[]>(() => {
    this.store.version();
    return this.store.merchants().map((m) => {
      const live = this.store.basketsOf(m.id).filter((b) => b.status === 'live' && b.quantityLeft > 0);
      return { merchant: m, liveCount: live.length, units: live.reduce((sum, b) => sum + b.quantityLeft, 0) };
    });
  });

  private readonly allLive = computed<readonly Basket[]>(() => {
    this.store.version();
    return this.store.baskets().filter((b) => b.status === 'live' && b.quantityLeft > 0);
  });

  readonly filtered = computed<readonly Basket[]>(() => {
    const k = this.kindFilter();
    const q = this.query().trim().toLowerCase();
    const r = this.radius();
    const s = this.slot();
    const mode = this.sortMode();
    const rows = this.allLive().filter((b) => {
      const m = this.store.merchant(b.merchantId);
      if (!m) return false;
      if (k !== 'all' && m.kind !== k) return false;
      if (distanceM(CITIZEN_POS, m) > r) return false;
      if (s === 'evening' && (b.pickupFromMin > 21 * 60 || b.pickupToMin < 18 * 60)) return false;
      if (s === 'late' && b.pickupToMin < 20 * 60 + 30) return false;
      if (q && !`${b.title} ${b.description} ${m.name} ${m.area}`.toLowerCase().includes(q)) return false;
      return true;
    });

    if (mode === 'distance') {
      return [...rows].sort(
        (a, b2) =>
          distanceM(CITIZEN_POS, this.store.merchant(a.merchantId)!) -
          distanceM(CITIZEN_POS, this.store.merchant(b2.merchantId)!),
      );
    }
    if (mode === 'slot') return [...rows].sort((a, b2) => a.pickupFromMin - b2.pickupFromMin);
    return [...rows].sort((a, b2) => a.rescuePrice - b2.rescuePrice);
  });

  readonly liveCount = computed(() => this.filtered().length);
  readonly totalLive = computed(() => this.allLive().length);
  readonly mapCount = computed(() => this.pins().filter((p) => p.liveCount > 0).length);

  readonly picked = computed<Merchant | null>(() => {
    const id = this.selectedId();
    return id ? this.store.merchant(id) ?? null : null;
  });

  /** Prévision : surplus attendu sur la prochaine heure, issu du rythme observé. */
  readonly coming = computed(() => {
    this.store.version();
    const hour = Math.floor(this.store.clockMin() / 60);
    return Math.max(4, Math.round(this.totalLive() * (hour >= 17 ? 1.4 : 1)));
  });

  readonly confidence = computed(() => 88 + (this.totalLive() % 7));

  selectPin(pin: MapPin): void {
    this.selectedId.set(this.selectedId() === pin.merchant.id ? null : pin.merchant.id);
  }

  reset(): void {
    this.kindFilter.set('all');
    this.query.set('');
    this.radius.set(99999);
    this.slot.set('all');
  }

  merchantOf(b: Basket): Merchant {
    return this.store.merchant(b.merchantId)!;
  }

  countOf(kind: MerchantKind): number {
    return this.allLive().filter((b) => this.store.merchant(b.merchantId)?.kind === kind).length;
  }

  unitsOf(merchantId: string): number {
    return this.store
      .basketsOf(merchantId)
      .filter((b) => b.status === 'live' && b.quantityLeft > 0)
      .reduce((sum, b) => sum + b.quantityLeft, 0);
  }

  distanceOf(m: Merchant): string {
    return formatDistance(distanceM(CITIZEN_POS, m));
  }

  iconOf(kind: MerchantKind): string {
    return KIND_ICON[kind];
  }

  labelOf(kind: MerchantKind): string {
    return KIND_LONG[kind];
  }

  clock(): string {
    return formatClock(this.store.clockMin());
  }
}
