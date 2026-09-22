import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityStore } from '../core/city.store';
import { Basket, discountPct, formatClock, formatTnd } from '../core/model';
import { PHOTOS } from '../core/photos';
import { CITIZEN_POS, distanceM, formatDistance, slotIcon } from '../core/ui';

/** Liste de paniers au format « carte artisan » du système de référence. */
@Component({
  selector: 'jr-basket-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @for (b of baskets; track b.id) {
      <article class="food-card" [class.horizontal]="horizontal" [class.is-picked]="b.merchantId === pickedId">
        <a class="food-media" [routerLink]="['/basket', b.id]" [attr.aria-label]="'Réserver ' + b.title">
          <img [src]="photo(b)" width="800" height="600" loading="lazy" [attr.alt]="'Invendus chez ' + shop(b).name" />
          <span class="discount-chip">-{{ pct(b) }}%</span>
          <span class="window-chip">
            <span class="ms" style="font-size:14px">{{ icon(b) }}</span>
            {{ windowOf(b) }}
          </span>
          <span class="eco-badge eco-float">
            <span class="ms" style="font-size:14px">eco</span>-{{ co2(b) }} kg CO₂
          </span>
        </a>

        <div class="food-body">
          <div class="row between" style="align-items:flex-start;gap:var(--space-sm)">
            <h3>{{ b.title }}</h3>
            <span class="price">
              <span class="price-old">{{ price(b.originalPrice) }} DT</span>
              <span class="price-now">{{ price(b.rescuePrice) }}</span>
              <span class="price-cur">DT</span>
            </span>
          </div>

          <div class="food-meta">
            <span><span class="ms" style="font-size:15px">storefront</span>{{ shop(b).name }}</span>
            <span><span class="ms" style="font-size:15px">location_on</span>{{ shop(b).area }}</span>
            <span><span class="ms" style="font-size:15px">directions_walk</span>{{ dist(b) }}</span>
          </div>

          <p class="food-desc">{{ b.description }}</p>

          <div class="food-foot">
            <span class="food-stock">
              <span class="ms" style="font-size:16px">shopping_basket</span>
              {{ b.quantityLeft }} sur {{ b.quantityTotal }} encore disponibles
            </span>
            <a class="btn btn-urgent btn-sm" [routerLink]="['/basket', b.id]">
              <span class="ms ms-18">flash_on</span>Réserver d'urgence
            </a>
          </div>
        </div>
      </article>
    }
  `,
  styles: [`
    :host { display: grid; gap: var(--space-md); }
  `],
})
export class BasketListComponent {
  private readonly store = inject(CityStore);

  @Input() baskets: readonly Basket[] = [];
  /** Présentation en carte large (image à gauche). */
  @Input() horizontal = false;
  /** Commerçant mis en avant depuis la carte. */
  @Input() pickedId: string | null = null;

  shop(b: Basket) {
    return this.store.merchant(b.merchantId)!;
  }

  photo(b: Basket): string {
    const k = this.shop(b).kind;
    return k === 'patisserie' ? PHOTOS.patisserie : k === 'restaurant' ? PHOTOS.traiteur : k === 'grocery' ? PHOTOS.primeur : PHOTOS.boulangerie;
  }

  pct(b: Basket): number {
    return discountPct(b);
  }

  price(millimes: number): string {
    return formatTnd(millimes);
  }

  co2(b: Basket): string {
    return (1.2 + b.quantityTotal * 0.08).toFixed(1).replace('.', ',');
  }

  windowOf(b: Basket): string {
    return `${formatClock(b.pickupFromMin)} – ${formatClock(b.pickupToMin)}`;
  }

  icon(b: Basket): string {
    return slotIcon(b.pickupToMin);
  }

  dist(b: Basket): string {
    return formatDistance(distanceM(CITIZEN_POS, this.shop(b)));
  }
}
