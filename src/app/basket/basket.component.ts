import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CityStore } from '../core/city.store';
import { FoodArtComponent } from '../core/food-art.component';
import {
  KIND_ICON, KIND_LABEL, Order, discountPct, formatClock, formatTnd,
} from '../core/model';

@Component({
  selector: 'jr-basket',
  standalone: true,
  imports: [RouterLink, FormsModule, FoodArtComponent],
  template: `
    <div class="shell narrow">
      @if (basket(); as b) {
        <a class="back" routerLink="/explorer">← Retour à la carte</a>

        @if (!order()) {
          <article class="card sheet rise">
            <jr-food-art [kind]="merchant()?.kind ?? 'bakery'" class="hero-art" />
            <header class="sheet-head">
              <span class="kind-ico">{{ iconOf() }}</span>
              <div>
                <span class="kind">{{ kindLabel() }}</span>
                <h1>{{ b.title }}</h1>
                <span class="merchant-line">
                  {{ merchantName() }} · {{ merchantArea() }}
                  @if (merchantVerified()) { <span class="verified">✓ vérifié</span> }
                </span>
              </div>
            </header>

            <p class="desc">{{ b.description }}</p>

            <div class="price-band">
              <div class="p-col">
                <span class="p-label">Prix Jarra</span>
                <strong class="p-rescue">{{ price(b.rescuePrice) }} <small>TND</small></strong>
              </div>
              <div class="p-col dim">
                <span class="p-label">Prix d'origine</span>
                <s>{{ price(b.originalPrice) }} TND</s>
              </div>
              <div class="p-col save">
                <span class="p-label">Vous économisez</span>
                <strong>−{{ discountOf() }}%</strong>
              </div>
            </div>

            <div class="facts">
              <div class="fact"><span>🕐 Retrait</span><strong>{{ windowOf(b) }}</strong></div>
              <div class="fact">
                <span>📦 Disponibles</span>
                <strong [class.low]="b.quantityLeft <= 2">{{ b.quantityLeft }} panier{{ b.quantityLeft > 1 ? 's' : '' }}</strong>
              </div>
              <div class="fact"><span>⭐ Note</span><strong>{{ merchantRating() }}/5 ({{ merchantRatingCount() }} avis)</strong></div>
            </div>

            <div class="reserve-box">
              <div class="field">
                <label for="name">Votre prénom (pour le retrait)</label>
                <input id="name" name="name" [(ngModel)]="customerName" placeholder="ex. Yasmine" autocomplete="given-name" />
              </div>
              <button
                class="btn btn-primary reserve-btn"
                [disabled]="!customerName.trim() || b.quantityLeft <= 0"
                (click)="reserve()"
              >
                🧺 Réserver — {{ price(b.rescuePrice) }} TND à payer sur place
              </button>
              <p class="note">Paiement à la collecte, en espèces. Annulation gratuite avant le retrait.</p>
            </div>
          </article>
        } @else {
          <article class="card confirm rise">
            <span class="c-ico">🎉</span>
            <h1>Panier réservé !</h1>
            <p class="c-sub">
              Présentez ce code à <strong>{{ merchantName() }}</strong> entre {{ windowOf(b) }}.
            </p>
            <div class="code" aria-label="Code de retrait">{{ order()!.pickupCode }}</div>
            <div class="c-meta">
              <span>{{ b.title }}</span>
              <span>{{ price(b.rescuePrice) }} TND · {{ merchantArea() }}</span>
            </div>
            <div class="c-actions">
              <button class="btn btn-ghost" (click)="cancelOrder()">Annuler la réservation</button>
              <a class="btn btn-primary" routerLink="/explorer">Réserver un autre panier</a>
            </div>
            <p class="note">💡 Astuce : faites une capture d'écran du code.</p>
          </article>
        }
      } @else {
        <article class="card sheet gone rise">
          <span class="c-ico">⌛</span>
          <h1>Ce panier a été sauvé… par quelqu'un d'autre</h1>
          <p class="c-sub">Il est épuisé ou son créneau de retrait est terminé. La ville bouge vite !</p>
          <a class="btn btn-primary" routerLink="/explorer">Voir les paniers encore disponibles</a>
        </article>
      }
    </div>
  `,
  styles: [`
    .narrow { max-width: 640px; }
    .back { display: inline-block; margin: 1.4rem 0 1rem; color: var(--muted); font-size: 0.88rem; transition: color 0.15s; }
    .back:hover { color: var(--sand); }

    .sheet { padding: 1.6rem; }
    .hero-art {
      margin: -1.6rem -1.6rem 1.2rem;
      border-radius: var(--r-lg) var(--r-lg) 0 0;
      overflow: hidden;
    }
    .sheet-head { display: flex; gap: 0.9rem; align-items: flex-start; }
    .kind-ico { font-size: 2rem; line-height: 1.1; }
    .kind { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--clay-strong); }
    .sheet-head h1 { font-size: 1.5rem; margin: 0.15rem 0 0.3rem; }
    .merchant-line { font-size: 0.85rem; color: var(--muted); }
    .verified { color: var(--olive); font-weight: 600; font-size: 0.76rem; margin-left: 0.4rem; }
    .desc { color: var(--sand-dim); line-height: 1.65; margin: 1.1rem 0; font-weight: 300; }

    .price-band {
      display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 0.8rem;
      padding: 1rem; border-radius: var(--r-md);
      background: var(--bg-raised); border: 1px solid var(--border-soft);
      margin-bottom: 1rem;
    }
    .p-col { display: flex; flex-direction: column; gap: 3px; }
    .p-label { font-size: 0.66rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); }
    .p-rescue { font-family: var(--font-display); font-size: 1.7rem; color: var(--clay-strong); }
    .p-rescue small { font-size: 0.7rem; }
    .p-col.dim s { color: var(--faint); font-size: 1.05rem; }
    .p-col.save strong { color: var(--olive); font-size: 1.25rem; font-family: var(--font-display); }

    .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.7rem; margin-bottom: 1.3rem; }
    .fact { display: flex; flex-direction: column; gap: 3px; font-size: 0.82rem; padding: 0.7rem 0.8rem; border-radius: var(--r-sm); background: var(--border-soft); }
    .fact span { color: var(--faint); font-size: 0.72rem; }
    .fact strong { color: var(--sand); font-weight: 600; }
    .fact strong.low { color: var(--danger); }

    .reserve-box { display: grid; gap: 0.9rem; }
    .reserve-btn { width: 100%; font-size: 1rem; padding: 0.95rem; }
    .note { color: var(--faint); font-size: 0.78rem; text-align: center; margin: 0; }

    .confirm { padding: 2.2rem 1.6rem; text-align: center; }
    .c-ico { font-size: 2.6rem; }
    .confirm h1 { font-size: 1.7rem; margin: 0.7rem 0 0.4rem; }
    .c-sub { color: var(--muted); font-weight: 300; margin: 0 0 1.4rem; }
    .c-sub strong { color: var(--sand); }
    .code {
      font-family: var(--font-mono); font-size: 2.6rem; font-weight: 700;
      letter-spacing: 0.35em; color: var(--clay-strong);
      background: var(--bg-raised); border: 1px dashed rgba(232, 129, 79, 0.5);
      border-radius: var(--r-md); padding: 0.9rem 0.35em 0.9rem 0.7em;
      margin: 0 auto 1rem; max-width: 320px;
    }
    .c-meta { display: flex; flex-direction: column; gap: 2px; color: var(--muted); font-size: 0.86rem; margin-bottom: 1.5rem; }
    .c-actions { display: flex; gap: 0.7rem; justify-content: center; flex-wrap: wrap; }

    .gone { padding: 2.2rem 1.6rem; text-align: center; }
    .gone h1 { font-size: 1.4rem; margin: 0.7rem 0 0.5rem; }
    .gone .btn { margin-top: 1.2rem; }

    @media (max-width: 720px) {
      .sheet { padding: 1.2rem; }
      .price-band { grid-template-columns: 1fr 1fr; }
      .p-col.save { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; align-items: baseline; }
      .facts { grid-template-columns: 1fr; }
      .code { font-size: 2rem; }
      .c-actions .btn { width: 100%; }
    }
  `],
})
export class BasketComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CityStore);

  customerName = '';
  readonly order = signal<Order | null>(null);

  /** Le panier courant — null s'il a été épuisé ou si son créneau est passé. */
  readonly basket = computed(() => {
    this.store.version();
    const id = this.route.snapshot.paramMap.get('id');
    const b = this.store.baskets().find((x) => x.id === id);
    return b && b.status === 'live' && b.quantityLeft > 0 ? b : null;
  });

  merchant() {
    const b = this.basket();
    return b ? this.store.merchant(b.merchantId) : undefined;
  }

  iconOf(): string { return KIND_ICON[this.merchant()?.kind ?? 'bakery']; }
  kindLabel(): string { return KIND_LABEL[this.merchant()?.kind ?? 'bakery']; }
  merchantName(): string { return this.merchant()?.name ?? ''; }
  merchantArea(): string { return this.merchant()?.area ?? ''; }
  merchantVerified(): boolean { return this.merchant()?.verified ?? false; }
  merchantRating(): number { return this.merchant()?.rating ?? 0; }
  merchantRatingCount(): number { return this.merchant()?.ratingCount ?? 0; }

  price(millimes: number): string { return formatTnd(millimes); }

  discountOf(): number {
    const b = this.basket();
    return b ? discountPct(b) : 0;
  }

  windowOf(b: { pickupFromMin: number; pickupToMin: number }): string {
    return `${formatClock(b.pickupFromMin)} – ${formatClock(b.pickupToMin)}`;
  }

  reserve(): void {
    const b = this.basket();
    if (!b) return;
    const order = this.store.reserve(b.id, this.customerName.trim());
    if (order) this.order.set(order);
  }

  cancelOrder(): void {
    const o = this.order();
    if (o && this.store.cancel(o.id)) this.order.set(null);
  }
}
