import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityMapComponent, MapPin } from '../core/city-map.component';
import { CityStore } from '../core/city.store';
import {
  Basket, KIND_ICON, KIND_LABEL, Merchant, MerchantKind,
  discountPct, formatClock, formatTnd,
} from '../core/model';

@Component({
  selector: 'jr-explore',
  standalone: true,
  imports: [CityMapComponent, RouterLink],
  template: `
    <div class="shell">
      <header class="page-head rise">
        <div>
          <h1>La carte du sauvetage</h1>
          <p class="sub">
            {{ liveCount() }} paniers disponibles à Gabès — il est
            <span class="clock">{{ clock() }}</span> en ville.
          </p>
        </div>
        <span class="live-chip"><i></i>LIVE</span>
      </header>

      <!-- filtres -->
      <div class="filters rise">
        <button class="fchip" [class.on]="kindFilter() === 'all'" (click)="kindFilter.set('all')">
          Tous <b>{{ totalLive() }}</b>
        </button>
        @for (k of kinds; track k) {
          <button class="fchip" [class.on]="kindFilter() === k" (click)="kindFilter.set(k)">
            {{ iconOf(k) }} {{ labelOf(k) }} <b>{{ countOf(k) }}</b>
          </button>
        }
      </div>

      <div class="explore-grid">
        <!-- carte -->
        <div class="map-col rise">
          <jr-city-map
            [pins]="pins()"
            [selectedId]="selectedId()"
            [kindFilter]="kindFilter()"
            (select)="selectPin($event)"
            (background)="selectedId.set(null)"
          />
        </div>

        <!-- liste des paniers -->
        <div class="list-col">
          @if (filtered().length === 0) {
            <div class="empty card">
              <span class="e-ico">🏺</span>
              <p><strong>Plus rien par ici pour l'instant.</strong></p>
              <p class="sub">Les commerçants republient en fin de service — la ville bouge, revenez dans un instant.</p>
            </div>
          }
          @for (b of filtered(); track b.id) {
            <article class="basket card rise" [class.selected]="b.merchantId === selectedId()">
              <div class="b-top">
                <span class="b-ico">{{ iconOf(merchantOf(b).kind) }}</span>
                <div class="b-id">
                  <h3>{{ b.title }}</h3>
                  <span class="b-merchant">{{ merchantOf(b).name }} · {{ merchantOf(b).area }}</span>
                </div>
                <span class="discount">−{{ discountOf(b) }}%</span>
              </div>
              <p class="b-desc">{{ b.description }}</p>
              <div class="b-meta">
                <span class="price">
                  <strong>{{ price(b.rescuePrice) }}</strong>
                  <s>{{ price(b.originalPrice) }}</s>
                </span>
                <span class="pickup">🕐 {{ window(b) }}</span>
                <span class="qty" [class.low]="b.quantityLeft <= 2">
                  {{ b.quantityLeft }}/{{ b.quantityTotal }} restants
                </span>
              </div>
              <a class="btn btn-primary b-cta" [routerLink]="['/basket', b.id]">Réserver ce panier</a>
            </article>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-head {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem; padding: 1.8rem 0 1rem;
    }
    .page-head h1 { font-size: clamp(1.6rem, 3.4vw, 2.3rem); }
    .sub { color: var(--muted); font-size: 0.92rem; margin: 0.4rem 0 0; font-weight: 300; }
    .clock { color: var(--gold); font-family: var(--font-mono); font-weight: 600; }
    .live-chip {
      display: inline-flex; align-items: center; gap: 0.45rem;
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.14em;
      color: var(--olive); border: 1px solid rgba(168, 185, 127, 0.35);
      background: var(--olive-ghost); padding: 0.4rem 0.85rem; border-radius: 999px;
    }
    .live-chip i {
      width: 7px; height: 7px; border-radius: 50%; background: var(--olive);
      animation: pulse-dot 2s ease-in-out infinite;
    }

    .filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.2rem; }
    .fchip {
      display: inline-flex; align-items: center; gap: 0.4rem;
      font-size: 0.82rem; font-weight: 500; cursor: pointer;
      padding: 0.5rem 0.95rem; border-radius: 999px;
      color: var(--muted); background: var(--border-soft);
      border: 1px solid var(--border); transition: all 0.18s var(--ease-out);
      min-height: 40px;
    }
    .fchip b { color: var(--sand-dim); font-size: 0.74rem; }
    .fchip:hover { color: var(--sand); border-color: var(--clay); }
    .fchip.on {
      color: #1d0f06; font-weight: 600;
      background: linear-gradient(160deg, var(--clay-strong), var(--clay-deep));
      border-color: transparent; box-shadow: var(--shadow-clay);
    }
    .fchip.on b { color: #1d0f06; }

    .explore-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr); gap: 1.4rem; align-items: start; }
    .map-col { position: sticky; top: 1rem; }

    .list-col { display: flex; flex-direction: column; gap: 0.9rem; }

    .basket { padding: 1.1rem 1.2rem; transition: border-color 0.2s, transform 0.2s var(--ease-out); }
    .basket:hover { transform: translateY(-2px); }
    .basket.selected { border-color: rgba(232, 129, 79, 0.5); box-shadow: var(--shadow-clay); }
    .b-top { display: flex; align-items: flex-start; gap: 0.75rem; }
    .b-ico { font-size: 1.5rem; line-height: 1; }
    .b-id { flex: 1; min-width: 0; }
    .b-id h3 { font-size: 1.02rem; font-weight: 600; }
    .b-merchant { font-size: 0.78rem; color: var(--muted); }
    .discount {
      font-family: var(--font-display); font-weight: 700; font-size: 0.95rem;
      color: var(--olive); background: var(--olive-ghost);
      border: 1px solid rgba(168, 185, 127, 0.3);
      padding: 0.25rem 0.6rem; border-radius: 999px; white-space: nowrap;
    }
    .b-desc { color: var(--muted); font-size: 0.86rem; line-height: 1.55; margin: 0.6rem 0; font-weight: 300; }
    .b-meta {
      display: flex; flex-wrap: wrap; gap: 0.4rem 1.1rem; align-items: center;
      font-size: 0.8rem; color: var(--sand-dim); margin-bottom: 0.85rem;
    }
    .price strong { font-size: 1.05rem; color: var(--clay-strong); font-weight: 700; }
    .price strong::after { content: ' TND'; font-size: 0.66rem; font-weight: 600; }
    .price s { color: var(--faint); margin-left: 0.45rem; font-size: 0.78rem; }
    .qty.low { color: var(--danger); font-weight: 600; }
    .b-cta { width: 100%; }

    .empty { padding: 2.4rem 1.6rem; text-align: center; }
    .empty .e-ico { font-size: 2.2rem; }
    .empty p { margin: 0.5rem 0 0; }

    @media (max-width: 900px) {
      .explore-grid { grid-template-columns: 1fr; }
      .map-col { position: static; }
    }
    @media (max-width: 720px) {
      .page-head { padding: 1.3rem 0 0.9rem; }
      .filters { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; }
      .filters::-webkit-scrollbar { display: none; }
      .fchip { flex-shrink: 0; }
    }
  `],
})
export class ExploreComponent {
  private readonly store = inject(CityStore);

  readonly kinds: MerchantKind[] = ['bakery', 'patisserie', 'restaurant', 'grocery'];
  readonly kindFilter = signal<MerchantKind | 'all'>('all');
  readonly selectedId = signal<string | null>(null);

  /** Pins de la carte : un par commerçant, avec stock agrégé. */
  readonly pins = computed<MapPin[]>(() => {
    this.store.version();
    return this.store.merchants().map((m) => {
      const live = this.store.basketsOf(m.id).filter((b) => b.status === 'live' && b.quantityLeft > 0);
      return {
        merchant: m,
        liveCount: live.length,
        units: live.reduce((sum, b) => sum + b.quantityLeft, 0),
      };
    });
  });

  /** Tous les paniers live. */
  private readonly allLive = computed<readonly Basket[]>(() => {
    this.store.version();
    return this.store.baskets().filter((b) => b.status === 'live' && b.quantityLeft > 0);
  });

  /** Paniers live, filtrés par type, triés par prix croissant. */
  readonly filtered = computed<readonly Basket[]>(() => {
    const k = this.kindFilter();
    return this.allLive()
      .filter((b) => k === 'all' || this.store.merchant(b.merchantId)?.kind === k)
      .sort((a, b2) => a.rescuePrice - b2.rescuePrice);
  });

  readonly liveCount = computed(() => this.filtered().length);
  readonly totalLive = computed(() => this.allLive().length);

  selectPin(pin: MapPin): void {
    this.selectedId.set(this.selectedId() === pin.merchant.id ? null : pin.merchant.id);
  }

  merchantOf(b: Basket): Merchant {
    return this.store.merchant(b.merchantId)!;
  }

  countOf(kind: MerchantKind): number {
    return this.allLive().filter((b) => this.store.merchant(b.merchantId)?.kind === kind).length;
  }

  iconOf(kind: MerchantKind): string { return KIND_ICON[kind]; }
  labelOf(kind: MerchantKind): string { return KIND_LABEL[kind]; }
  price(millimes: number): string { return formatTnd(millimes); }
  discountOf(b: Basket): number { return discountPct(b); }
  window(b: Basket): string { return `${formatClock(b.pickupFromMin)} – ${formatClock(b.pickupToMin)}`; }
  clock(): string { return formatClock(this.store.clockMin()); }
}
