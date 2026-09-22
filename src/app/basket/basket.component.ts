import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CityStore } from '../core/city.store';
import { Order, discountPct, formatClock, formatTnd } from '../core/model';
import { PHOTOS } from '../core/photos';

@Component({
  selector: 'jr-basket',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="shell-lg">
      <nav class="crumbs" aria-label="Fil d'ariane">
        <a routerLink="/explorer">Explorer &amp; Carte Live</a>
        <span class="ms ms-18 muted">chevron_right</span>
        <a [routerLink]="['/boutique', merchantId()]">{{ merchantName() || 'Boutique' }}</a>
        <span class="ms ms-18 muted">chevron_right</span>
        <span class="muted">Réservation</span>
      </nav>

      @if (basket(); as b) {
        <div class="order">
          <!-- ── Colonne principale ─────────────────────────────────── -->
          <div class="stack gap-lg">
            <div>
              <span class="eco-badge"><span class="ms" style="font-size:15px">storefront</span>{{ kindLabel() }}</span>
              <h1 style="margin-top:var(--space-sm)">{{ b.title }}</h1>
              <p class="body-lg muted" style="margin-top:var(--space-sm);max-width:44rem">{{ b.description }}</p>
            </div>

            <figure class="media">
              <img [src]="photo()" width="800" height="600" [attr.alt]="'Invendus chez ' + merchantName()" />
              <span class="discount-chip">-{{ discountOf() }}%</span>
              <span class="window-chip"><span class="ms" style="font-size:14px">schedule</span>{{ windowOf(b) }}</span>
            </figure>

            <div class="facts-grid">
              <div class="card card-pad stack gap-xs">
                <span class="ms ms-24" style="color:var(--brand-mint-ink)">point_of_sale</span>
                <b class="label-lg">Paiement au comptoir</b>
                <p class="body-sm muted">Espèces ou TPE local, directement à l'artisan. Aucun prélèvement en ligne.</p>
              </div>
              <div class="card card-pad stack gap-xs">
                <span class="ms ms-24" style="color:var(--brand-mint-ink)">qr_code_2</span>
                <b class="label-lg">Code de retrait</b>
                <p class="body-sm muted">Un code court à 4 caractères, à présenter au comptoir pendant le créneau.</p>
              </div>
              <div class="card card-pad stack gap-xs">
                <span class="ms ms-24" style="color:var(--brand-mint-ink)">eco</span>
                <b class="label-lg">Impact mesuré</b>
                <p class="body-sm muted">Environ {{ co2() }} kg de CO₂ évités et un repas qui ne part pas à la poubelle.</p>
              </div>
            </div>

            <div class="card card-pad">
              <h2 class="headline-sm">Réserver ce panier</h2>
              <p class="body-sm muted" style="margin-top:4px">
                Aucun paiement en ligne. Vous réglez au comptoir, sur place, au moment du retrait.
              </p>
              <div class="form-grid">
                <div class="field">
                  <label for="bkName">Nom sur la réservation</label>
                  <input id="bkName" class="input" name="customerName" [(ngModel)]="customerName" placeholder="Ex. Amine B." autocomplete="name" />
                  <span class="hint">Annoncez ce nom au comptoir, avec votre code.</span>
                </div>
                <div class="field">
                  <label for="bkQty">Nombre de paniers</label>
                  <div class="row gap-sm">
                    <span class="stepper">
                      <button type="button" aria-label="Diminuer" (click)="setQty(qty() - 1)"><span class="ms ms-20">remove</span></button>
                      <label class="sr" for="bkQty">Quantité</label>
                      <input id="bkQty" [value]="qty()" readonly />
                      <button type="button" aria-label="Augmenter" (click)="setQty(qty() + 1)"><span class="ms ms-20">add</span></button>
                    </span>
                    <span class="hint">Maximum {{ maxQty(b) }} par personne sur ce créneau.</span>
                  </div>
                </div>
              </div>

              <button class="btn btn-urgent btn-lg" type="button" style="margin-top:var(--space-md)" [disabled]="!customerName.trim() || !!order()" (click)="reserve()">
                <span class="ms ms-18">flash_on</span>Confirmer la réservation
              </button>
              @if (!customerName.trim() && !order()) {
                <p class="hint" style="margin-top:var(--space-sm)">Indiquez votre nom pour activer la réservation.</p>
              }
            </div>
          </div>

          <!-- ── Colonne récapitulatif ──────────────────────────────── -->
          <div class="stack gap-md sticky-side">
            <div class="ticket">
              <div class="card-pad stack gap-sm">
                <div class="row between">
                  <span class="label-sm muted" style="text-transform:uppercase">Récapitulatif</span>
                  @if (order()) {
                    <span class="pill pill-forest">Réservé</span>
                  } @else {
                    <span class="pill pill-mint">En attente</span>
                  }
                </div>
                <div class="rows">
                  <div><span class="muted">Panier</span><span class="mono-num">{{ price(b.rescuePrice) }} DT</span></div>
                  <div><span class="muted">Quantité</span><span class="mono-num">{{ qty() }}</span></div>
                  <div><span class="muted">Frais de service</span><span class="mono-num">0,000 DT</span></div>
                  <div class="total"><span>À régler au comptoir</span><span class="price-now">{{ price(b.rescuePrice * qty()) }} <small>DT</small></span></div>
                </div>
                <div class="card-flat" style="padding:var(--space-sm) var(--space-md)">
                  <span class="label-sm muted" style="text-transform:uppercase">Créneau de retrait</span>
                  <p class="label-lg mono-num" style="margin-top:2px">Aujourd'hui · {{ windowOf(b) }}</p>
                </div>
              </div>

              @if (order(); as o) {
                <div class="ticket-code">
                  <span class="label-sm" style="color:#a9c6b8">Code à présenter au comptoir</span>
                  <b class="mono-num">{{ o.pickupCode }}</b>
                  <span class="body-sm" style="color:#d6e7de">{{ merchantName() }} · {{ merchantArea() }}, Gabès</span>
                  <button class="btn btn-invert btn-sm" type="button" (click)="cancelOrder()">Annuler la réservation</button>
                </div>
              }
            </div>

            <div class="ai-banner">
              <span class="ai-ico"><span class="ms ms-24">schedule</span></span>
              <div>
                <b class="label-lg">Préparer votre retrait</b>
                <ul class="tips">
                  <li>Prévoyez de quoi transporter le panier.</li>
                  <li>Présentez-vous dans la fenêtre choisie, pas avant.</li>
                  <li>Montrez votre code, puis réglez sur place.</li>
                </ul>
              </div>
            </div>

            <div class="card card-pad stack gap-sm">
              <span class="label-sm muted" style="text-transform:uppercase">Le commerce</span>
              <b class="label-lg">{{ merchantName() }}</b>
              <p class="body-sm muted">{{ kindLabel() }} · {{ merchantArea() }}, Gabès</p>
              <div class="row gap-sm wrap">
                @if (merchantVerified()) {
                  <span class="eco-badge"><span class="ms" style="font-size:14px">verified_user</span>Vérifié</span>
                }
                <span class="eco-badge"><span class="ms ms-fill" style="font-size:14px">star</span>{{ merchantRating() }} / 5</span>
              </div>
              <a class="btn btn-ghost btn-sm" [routerLink]="['/boutique', merchantId()]">
                <span class="ms ms-18">storefront</span>Voir la boutique
              </a>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty" style="margin:var(--space-xl) 0">
          <span class="ms ms-40">error_outline</span>
          <b>Ce panier n'est plus disponible</b>
          <span class="body-sm">Il a été entièrement réservé ou son créneau de retrait est terminé — l'inventaire ne ment jamais.</span>
          <a class="btn btn-primary" routerLink="/explorer"><span class="ms ms-18">map</span>Voir les paniers disponibles</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .crumbs { display: flex; align-items: center; gap: 6px; padding: var(--space-md) 0 var(--space-sm); font-size: 0.8125rem; color: var(--on-surface-variant); }
    .crumbs a:hover { color: var(--primary-container); }
    .order { display: grid; gap: var(--space-lg); align-items: start; padding-bottom: var(--space-xl); }
    @media (min-width: 1024px) { .order { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); } }
    .order > div { min-width: 0; }
    @media (min-width: 1024px) { .sticky-side { position: sticky; top: 13rem; } }

    .media { position: relative; margin: 0; border-radius: var(--r-lg); overflow: hidden; aspect-ratio: 16 / 9; background: var(--surface-container); box-shadow: var(--shadow-1); }
    .media img { width: 100%; height: 100%; object-fit: cover; }

    .facts-grid { display: grid; gap: var(--space-md); }
    @media (min-width: 700px) { .facts-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

    .form-grid { display: grid; gap: var(--space-md); margin-top: var(--space-md); }
    @media (min-width: 700px) { .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

    .ticket { background: var(--surface-container-lowest); border: 1px solid var(--hairline); border-radius: var(--r-lg); overflow: hidden; box-shadow: var(--shadow-1); }
    .rows { display: grid; }
    .rows > div { display: flex; justify-content: space-between; gap: var(--space-md); padding: .65rem 0; border-bottom: 1px solid var(--hairline); font-size: 0.875rem; }
    .rows > div:last-child { border-bottom: 0; }
    .rows .total { padding-top: var(--space-md); }
    .rows .total span:first-child { font-weight: 700; }
    .ticket-code { background: var(--primary-container); color: var(--on-primary); padding: var(--space-lg); display: grid; gap: var(--space-sm); justify-items: center; text-align: center; }
    .ticket-code b { font-size: 2.5rem; letter-spacing: .24em; line-height: 1; }
    .tips { display: grid; gap: 6px; margin-top: var(--space-sm); font-size: 0.8125rem; color: var(--on-surface-variant); }
    .tips li { padding-left: 1rem; position: relative; }
    .tips li::before { content: ''; position: absolute; left: 0; top: .5em; width: 5px; height: 5px; border-radius: 50%; background: var(--brand-mint); }
  `],
})
export class BasketComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CityStore);

  customerName = '';
  readonly order = signal<Order | null>(null);
  readonly qty = signal(1);

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

  merchantId(): string {
    return this.merchant()?.id ?? '';
  }

  kindLabel(): string {
    const k = this.merchant()?.kind ?? 'bakery';
    return { bakery: 'Boulangerie', patisserie: 'Pâtisserie', restaurant: 'Restaurant', grocery: 'Épicerie' }[k];
  }

  merchantName(): string {
    return this.merchant()?.name ?? '';
  }

  merchantArea(): string {
    return this.merchant()?.area ?? '';
  }

  merchantVerified(): boolean {
    return this.merchant()?.verified ?? false;
  }

  merchantRating(): number {
    return this.merchant()?.rating ?? 0;
  }

  photo(): string {
    const k = this.merchant()?.kind ?? 'bakery';
    return k === 'patisserie' ? PHOTOS.patisserie : k === 'restaurant' ? PHOTOS.traiteur : k === 'grocery' ? PHOTOS.primeur : PHOTOS.boulangerie;
  }

  co2(): string {
    return (2.4).toFixed(1).replace('.', ',');
  }

  price(millimes: number): string {
    return formatTnd(millimes);
  }

  discountOf(): number {
    const b = this.basket();
    return b ? discountPct(b) : 0;
  }

  maxQty(b: { quantityLeft: number }): number {
    return Math.max(1, Math.min(3, b.quantityLeft));
  }

  setQty(v: number): void {
    const b = this.basket();
    const max = b ? this.maxQty(b) : 1;
    this.qty.set(Math.max(1, Math.min(max, v)));
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
