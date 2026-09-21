import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityMapComponent, MapPin } from '../core/city-map.component';
import { CityStore } from '../core/city.store';
import { FoodArtComponent } from '../core/food-art.component';
import {
  Basket, KIND_ICON, KIND_LABEL, Merchant, MerchantKind,
  discountPct, formatClock, formatTnd,
} from '../core/model';

@Component({
  selector: 'jr-explore',
  standalone: true,
  imports: [CityMapComponent, RouterLink, FoodArtComponent],
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
              <a class="b-banner" [routerLink]="['/basket', b.id]" [attr.aria-label]="'Voir ' + b.title">
                <jr-food-art [kind]="merchantOf(b).kind" />
                <span class="discount">−{{ discountOf(b) }}%</span>
                <span class="qty-pill" [class.low]="b.quantityLeft <= 2">
                  {{ b.quantityLeft }} restant{{ b.quantityLeft > 1 ? 's' : '' }}
                </span>
              </a>
              <div class="b-body">
                <h3>{{ b.title }}</h3>
                <span class="b-merchant">{{ merchantOf(b).name }} · {{ merchantOf(b).area }}</span>
                <p class="b-desc">{{ b.description }}</p>
                <div class="b-foot">
                  <div class="b-price">
                    <strong>{{ price(b.rescuePrice) }}<i>TND</i></strong>
                    <s>{{ price(b.originalPrice) }}</s>
                  </div>
                  <span class="pickup">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>
                    {{ window(b) }}
                  </span>
                </div>
                <a class="btn btn-primary b-cta" [routerLink]="['/basket', b.id]">Réserver ce panier</a>
              </div>
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
      color: var(--olive); border: 1px solid rgba(76, 122, 56, 0.35);
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

    .list-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.95rem; align-content: start; }

    .basket {
      overflow: hidden;
      transition: border-color .2s, transform .25s var(--ease-out), box-shadow .25s;
    }
    .basket:hover { transform: translateY(-4px); box-shadow: var(--shadow-2); }
    .basket.selected { border-color: var(--clay); box-shadow: var(--shadow-clay); }

    .b-banner {
      position: relative; display: block;
      aspect-ratio: 16 / 9.5;
      overflow: hidden;
      border-radius: calc(var(--r-lg) - 1px) calc(var(--r-lg) - 1px) 0 0;
    }
    .b-banner jr-food-art { height: 100%; }
    .b-banner jr-food-art svg { height: 100%; width: 100%; object-fit: cover; }

    .discount {
      position: absolute; top: 10px; right: 10px;
      font-family: var(--font-display); font-weight: 700; font-size: 0.82rem;
      color: #fff; background: var(--grad-clay);
      padding: 0.28rem 0.62rem; border-radius: 999px;
      box-shadow: 0 3px 10px rgba(217, 111, 54, .4);
    }
    .qty-pill {
      position: absolute; bottom: 10px; left: 10px;
      font-size: 0.68rem; font-weight: 700;
      color: var(--sand); background: rgba(255, 255, 255, .92);
      backdrop-filter: blur(6px);
      padding: 0.24rem 0.6rem; border-radius: 999px;
      border: 1px solid var(--border);
    }
    .qty-pill.low { color: var(--danger); border-color: rgba(214, 69, 60, .35); }

    .b-body { padding: 0.95rem 1rem 1.05rem; display: flex; flex-direction: column; }
    .b-body h3 { font-size: 1.02rem; font-weight: 600; }
    .b-merchant { font-size: 0.78rem; color: var(--muted); display: block; margin-top: 2px; }
    .b-desc {
      color: var(--muted); font-size: 0.82rem; line-height: 1.55; font-weight: 300;
      margin: 0.55rem 0 0.8rem;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .b-foot {
      display: flex; align-items: center; justify-content: space-between; gap: 0.6rem;
      margin-bottom: 0.85rem; margin-top: auto;
    }
    .b-price { display: flex; align-items: baseline; gap: 0.35rem; }
    .b-price strong { font-family: var(--font-display); font-size: 1.15rem; color: var(--clay); font-weight: 700; }
    .b-price strong i { font-style: normal; font-size: 0.62rem; color: var(--muted); margin-left: 2px; }
    .b-price s { font-size: 0.74rem; color: var(--faint); }
    .pickup {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.74rem; color: var(--sand-dim); font-weight: 500; white-space: nowrap;
    }
    .pickup svg { width: 14px; height: 14px; fill: none; stroke: var(--clay); stroke-width: 1.8; stroke-linecap: round; }
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
      .list-col { grid-template-columns: 1fr; }
      .b-desc { font-size: .8rem; }
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
