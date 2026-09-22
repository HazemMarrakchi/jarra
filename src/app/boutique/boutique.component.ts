import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BasketListComponent } from '../core/basket-list.component';
import { CityStore } from '../core/city.store';
import { KIND_LABEL, formatClock, formatTnd } from '../core/model';
import { PHOTOS } from '../core/photos';
import { KIND_ICON } from '../core/ui';

@Component({
  selector: 'jr-boutique',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, BasketListComponent],
  template: `
    @if (shop(); as m) {
      <!-- ── Bandeau boutique ─────────────────────────────────────── -->
      <section class="shop-hero">
        <img class="hero-img" [src]="photo" width="860" height="645" [attr.alt]="'Devanture de ' + m.name + ' à ' + m.area" />
        <div class="hero-scrim"></div>
        <div class="shell-lg hero-inner">
          <span class="eco-badge" style="background:rgba(255,255,255,.16);border:0;color:#c9f3dd">
            <span class="ms" style="font-size:15px">bolt</span>Surplus confirmé pour la fournée du soir
          </span>
          <h1>{{ m.name }}</h1>
          <div class="hero-meta">
            <span><span class="ms" style="font-size:16px">storefront</span>{{ kindLabel() }}</span>
            <span><span class="ms" style="font-size:16px">location_on</span>{{ m.area }}, Gabès</span>
            <span><span class="ms" style="font-size:16px">star</span>{{ m.rating }} / 5 · {{ m.ratingCount }} retraits notés</span>
            @if (m.verified) {
              <span><span class="ms" style="font-size:16px">verified_user</span>Commerce vérifié</span>
            }
          </div>
          <div class="hero-actions">
            <a class="btn btn-invert" routerLink="/explorer"><span class="ms ms-18">map</span>Voir la carte</a>
            <a class="btn btn-invert" href="tel:+21675000000"><span class="ms ms-18">call</span>Appeler</a>
            <button class="btn btn-invert" type="button"><span class="ms ms-18">share</span>Partager</button>
          </div>
          <div class="hero-stats">
            <div><span class="mono-num">{{ mealsHere() }}</span><span>Repas sauvés ici</span></div>
            <div><span class="mono-num">{{ liveBaskets().length }}</span><span>Paniers en ligne</span></div>
            <div><span class="mono-num">{{ rescueRate() }} %</span><span>Taux de sauvetage</span></div>
            <div><span class="mono-num">{{ heldRate() }} %</span><span>Créneaux tenus</span></div>
          </div>
        </div>
      </section>

      <!-- ── Paniers du soir ──────────────────────────────────────── -->
      <section class="shell-lg section">
        <div class="section-head">
          <h2>Invendus &amp; lots frais disponibles ce soir</h2>
          <p class="body-md muted">
            Chaque panier est composé des invendus réels de la journée. Le stock affiché est celui du comptoir, décrémenté
            à chaque réservation.
          </p>
        </div>

        @if (liveBaskets().length === 0) {
          <div class="empty">
            <span class="ms ms-40">shopping_basket</span>
            <b>Aucun panier en ligne pour le moment.</b>
            <span class="body-sm">Ce commerce publie ses invendus en fin de service. Revenez plus tard.</span>
          </div>
        } @else {
          <jr-basket-list [baskets]="liveBaskets()" />
        }
      </section>

      <!-- ── Guide pratique ──────────────────────────────────────── -->
      <section class="guide">
        <div class="shell-lg">
          <div class="section-head">
            <h2>Guide pratique citoyen : comment ça marche sans paiement en ligne ?</h2>
            <p class="body-md muted">Trois étapes, aucun prélèvement, aucune application à installer.</p>
          </div>
          <div class="guide-grid">
            @for (s of steps; track s.title; let i = $index) {
              <div class="step-card">
                <span class="step-n mono-num">0{{ i + 1 }}</span>
                <span class="ai-ico"><span class="ms ms-24">{{ s.icon }}</span></span>
                <h3>{{ s.title }}</h3>
                <p class="body-sm muted">{{ s.text }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ── Engagements ─────────────────────────────────────────── -->
      <section class="shell-lg section">
        <div class="section-head">
          <h2>Pourquoi {{ m.name }} s'engage avec Jarra.tn ?</h2>
        </div>
        <div class="engage-grid">
          @for (e of engagements; track e.title) {
            <div class="card card-pad stack gap-sm">
              <span class="ai-ico"><span class="ms ms-24">{{ e.icon }}</span></span>
              <h4>{{ e.title }}</h4>
              <p class="body-sm muted">{{ e.text }}</p>
            </div>
          }
          <div class="card card-pad artisan">
            <img [src]="portrait" width="400" height="400" alt="Portrait de l'artisan derrière son comptoir." />
            <div>
              <h4>L'équipe {{ m.name }}</h4>
              <p class="body-sm muted">
                « On préfère vendre moins cher que jeter. Et voir les voisins repartir avec un panier, ça change le
                quartier. »
              </p>
              <span class="eco-badge" style="margin-top:var(--space-sm)">
                <span class="ms" style="font-size:14px">handshake</span>Parole d'artisan
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Avis ────────────────────────────────────────────────── -->
      <section class="avis-band">
        <div class="shell-lg">
          <div class="section-head">
            <h2>Avis de clients du quartier {{ m.area }}</h2>
            <p class="body-md muted">Notes déposées après un retrait réellement validé au comptoir.</p>
          </div>
          <div class="avis-grid">
            <div class="card card-pad stack gap-sm">
              <div class="row gap-sm">
                <img [src]="portrait" width="400" height="400" alt="" class="avatar" />
                <div>
                  <b class="label-lg">Amine B.</b>
                  <p class="label-sm muted">Retrait validé hier</p>
                </div>
                <span class="stars">
                  <span class="ms ms-18 ms-fill">star</span><span class="ms ms-18 ms-fill">star</span>
                  <span class="ms ms-18 ms-fill">star</span><span class="ms ms-18 ms-fill">star</span>
                  <span class="ms ms-18 ms-fill">star</span>
                </span>
              </div>
              <p class="body-sm">Paniers généreux et accueil impeccable. Tout était encore chaud à 19h.</p>
            </div>
            <div class="card card-pad stack gap-sm">
              <div class="row gap-sm">
                <img [src]="portrait" width="400" height="400" alt="" class="avatar" />
                <div>
                  <b class="label-lg">Salma T.</b>
                  <p class="label-sm muted">Retrait validé cette semaine</p>
                </div>
                <span class="stars">
                  <span class="ms ms-18 ms-fill">star</span><span class="ms ms-18 ms-fill">star</span>
                  <span class="ms ms-18 ms-fill">star</span><span class="ms ms-18 ms-fill">star</span>
                  <span class="ms ms-18">star</span>
                </span>
              </div>
              <p class="body-sm">Prix imbattable pour la même qualité qu'en vitrine. Je passe deux fois par semaine.</p>
            </div>
            <div class="card card-pad stack gap-sm">
              <div class="label-sm muted">Répartition des notes</div>
              @for (r of ratings(); track r.stars) {
                <div class="rating-row">
                  <span class="mono-num">{{ r.stars }}</span>
                  <span class="meter"><i [style.width.%]="r.share"></i></span>
                  <span class="mono-num muted">{{ r.share }} %</span>
                </div>
              }
            </div>
          </div>
          <p class="label-sm muted" style="margin-top:var(--space-md)">Avis simulés pour la démonstration.</p>
        </div>
      </section>

      <!-- ── Voisins ─────────────────────────────────────────────── -->
      <section class="shell-lg section">
        <div class="section-head">
          <h2>Autres artisans anti-gaspi dans le quartier</h2>
        </div>
        <div class="neighbors">
          @for (n of neighbors(); track n.id) {
            <a class="card card-pad card-hover neighbor" [routerLink]="['/boutique', n.id]">
              <span class="ai-ico"><span class="ms ms-24">{{ iconOf(n.kind) }}</span></span>
              <div class="grow">
                <b class="label-lg">{{ n.name }}</b>
                <p class="body-sm muted">{{ n.area }} · {{ n.kind === 'bakery' ? 'Pain & viennoiserie' : n.kind === 'patisserie' ? 'Pâtisserie fine' : n.kind === 'restaurant' ? 'Plats traiteur' : 'Primeurs & fruits' }}</p>
              </div>
              <span class="ms ms-20 muted">arrow_forward</span>
            </a>
          }
          <a class="card card-pad card-hover neighbor" routerLink="/explorer">
            <span class="ai-ico"><span class="ms ms-24">map</span></span>
            <div class="grow">
              <b class="label-lg">Voir les {{ totalShops }} adresses de Gabès</b>
              <p class="body-sm muted">Carte en direct et disponibilités</p>
            </div>
            <span class="ms ms-20 muted">arrow_forward</span>
          </a>
        </div>
      </section>

      <!-- ── Accès ───────────────────────────────────────────────── -->
      <section class="acces">
        <div class="shell-lg acces-grid">
          <div class="stack gap-sm">
            <h2>Se rendre à la boutique {{ m.name }}</h2>
            <p class="body-md muted">{{ m.area }}, Gabès — la boutique se trouve sur l'axe principal du quartier.</p>
            <div class="row gap-sm wrap" style="margin-top:var(--space-sm)">
              <a class="btn btn-primary" href="https://maps.google.com/?q=33.8815,10.0982" target="_blank" rel="noopener">
                <span class="ms ms-18">map</span>Ouvrir dans Google Maps
              </a>
              <a class="btn btn-ghost" href="tel:+21675000000"><span class="ms ms-18">call</span>+216 75 000 000</a>
            </div>
            <p class="label-sm muted" style="margin-top:var(--space-sm)">
              Paiement au comptoir uniquement : espèces ou TPE local.
            </p>
          </div>
          <div class="card card-pad acces-card">
            <p class="label-sm muted" style="text-transform:uppercase">Créneaux du jour</p>
            <div class="hours">
              @for (b of liveBaskets(); track b.id) {
                <div>
                  <span>{{ b.title }}</span>
                  <span class="mono-num">{{ windowOf(b) }}</span>
                </div>
              }
              @if (liveBaskets().length === 0) {
                <div><span class="muted">Aucun créneau ouvert</span><span class="mono-num muted">—</span></div>
              }
            </div>
          </div>
        </div>
      </section>
    } @else {
      <!-- Sans identifiant : annuaire des boutiques participantes -->
      <div class="shell-lg section">
        <div class="section-head">
          <span class="eco-badge"><span class="ms" style="font-size:15px">storefront</span>Annuaire des artisans</span>
          <h1>Les boutiques anti-gaspi de Gabès</h1>
          <p class="body-lg muted" style="max-width:48rem">
            Chaque fiche présente les invendus du soir, les créneaux de retrait et les avis des citoyens du quartier.
          </p>
        </div>
        <div class="neighbors">
          @for (m of allShops(); track m.id) {
            <a class="card card-pad card-hover neighbor" [routerLink]="['/boutique', m.id]">
              <span class="ai-ico"><span class="ms ms-24">{{ iconOf(m.kind) }}</span></span>
              <div class="grow">
                <b class="label-lg">{{ m.name }}</b>
                <p class="body-sm muted">{{ m.area }} · {{ unitsOf(m.id) }} unités disponibles</p>
              </div>
              <span class="ms ms-20 muted">arrow_forward</span>
            </a>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .shop-hero { position: relative; overflow: hidden; background: var(--primary-container); color: var(--on-primary); padding: var(--space-xl) 0; }
    .hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .38; }
    .hero-scrim { position: absolute; inset: 0; background: linear-gradient(120deg, rgba(1,45,29,.94) 0%, rgba(27,67,50,.82) 55%, rgba(27,67,50,.55) 100%); }
    .hero-inner { position: relative; display: grid; gap: var(--space-md); }
    .hero-inner h1 { color: var(--on-primary); }
    .hero-meta { display: flex; flex-wrap: wrap; gap: var(--space-sm) var(--space-lg); font-size: 0.875rem; color: #d6e7de; }
    .hero-meta span { display: inline-flex; align-items: center; gap: 6px; }
    .hero-actions { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
    .hero-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-md); border-top: 1px solid rgba(255,255,255,.16); padding-top: var(--space-md); }
    @media (min-width: 900px) { .hero-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .hero-stats .mono-num { display: block; font-size: 1.5rem; color: var(--on-primary); }
    .hero-stats span { font-size: 0.6875rem; letter-spacing: .08em; text-transform: uppercase; color: #a9c6b8; font-weight: 700; }

    .section { padding: var(--space-xl) 0; }
    .section-tight { padding: var(--space-lg) 0; }
    .section-head { display: grid; gap: var(--space-sm); margin-bottom: var(--space-lg); }

    .guide { background: var(--surface-container-low); padding: var(--space-xl) 0; }
    .guide-grid { display: grid; gap: var(--space-md); }
    @media (min-width: 900px) { .guide-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .step-card { background: var(--surface-container-lowest); border: 1px solid var(--hairline); border-radius: var(--r-lg); padding: var(--space-lg); display: grid; gap: var(--space-sm); align-content: start; box-shadow: var(--shadow-1); }
    .step-n { font-size: 0.75rem; color: var(--brand-mint-ink); letter-spacing: .1em; }

    .engage-grid { display: grid; gap: var(--space-md); }
    @media (min-width: 900px) { .engage-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .artisan { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--space-md); align-items: center; }
    .artisan img { width: 5rem; height: 5rem; border-radius: 9999px; object-fit: cover; }

    .avis-band { background: var(--surface-container-low); padding: var(--space-xl) 0; }
    .avis-grid { display: grid; gap: var(--space-md); }
    @media (min-width: 900px) { .avis-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .avatar { width: 2.5rem; height: 2.5rem; border-radius: 9999px; object-fit: cover; }
    .stars { margin-left: auto; display: inline-flex; color: var(--brand-terracotta); }
    .rating-row { display: grid; grid-template-columns: 18px minmax(0, 1fr) 44px; gap: var(--space-sm); align-items: center; font-size: 0.8125rem; }
    .meter { height: 6px; border-radius: 3px; background: var(--surface-container-high); overflow: hidden; }
    .meter i { display: block; height: 100%; background: var(--brand-mint); border-radius: 3px; }

    .neighbors { display: grid; gap: var(--space-sm); }
    .neighbor { display: flex; align-items: center; gap: var(--space-md); }

    .acces { background: var(--surface-container-low); padding: var(--space-xl) 0; }
    .acces-grid { display: grid; gap: var(--space-lg); align-items: start; }
    @media (min-width: 900px) { .acces-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
    .hours { display: grid; margin-top: var(--space-sm); }
    .hours div { display: flex; justify-content: space-between; gap: var(--space-md); padding: .7rem 0; border-bottom: 1px solid var(--hairline); font-size: 0.875rem; }
    .hours div:last-child { border-bottom: 0; }
  `],
})
export class BoutiqueComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CityStore);

  readonly photo = PHOTOS.vitrine;
  readonly portrait = PHOTOS.commercant;
  readonly totalShops = this.store.merchants().length;

  readonly steps = [
    { icon: 'radar', title: 'Repérez en direct', text: "La carte affiche les paniers réellement disponibles chez l'artisan, avec leur créneau de retrait." },
    { icon: 'directions_walk', title: 'Venez à la boutique', text: 'Présentez-vous pendant le créneau choisi, avec votre code de retrait à 4 caractères.' },
    { icon: 'point_of_sale', title: 'Payez au comptoir', text: 'Espèces ou TPE local, directement à l\'artisan. Jarra ne prélève rien en ligne.' },
  ];

  readonly engagements = [
    { icon: 'eco', title: 'Engagement zéro gaspillage actif', text: 'Publication quotidienne des invendus, mesurée et publiée dans le baromètre public.' },
    { icon: 'volunteer_activism', title: 'Solidarité de quartier', text: 'Les paniers non retirés sont proposés aux associations partenaires du quartier.' },
    { icon: 'savings', title: 'Soutien au pouvoir d\'achat', text: 'Des prix de sauvetage entre -50 % et -70 % sur la valeur de vitrine.' },
    { icon: 'verified_user', title: 'Transparence du stock', text: 'Le stock est décrémenté à chaque réservation. Aucun panier fantôme.' },
  ];

  readonly shop = computed(() => {
    this.store.version();
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.store.merchant(id) ?? null : null;
  });

  readonly liveBaskets = computed(() => {
    this.store.version();
    const id = this.shop()?.id;
    if (!id) return [];
    return this.store
      .basketsOf(id)
      .filter((b) => b.status === 'live' && b.quantityLeft > 0)
      .sort((a, b) => a.rescuePrice - b.rescuePrice);
  });

  readonly neighbors = computed(() => {
    this.store.version();
    const id = this.shop()?.id;
    return this.store
      .merchants()
      .filter((m) => m.id !== id)
      .filter((m) => this.store.basketsOf(m.id).some((b) => b.status === 'live' && b.quantityLeft > 0))
      .slice(0, 3);
  });

  readonly mealsHere = computed(() => {
    this.store.version();
    const id = this.shop()?.id;
    if (!id) return 0;
    const mine = this.store.basketsOf(id).map((b) => b.id);
    return this.store.orders().filter((o) => o.status === 'collected' && mine.includes(o.basketId)).length;
  });

  readonly rescueRate = computed(() => {
    this.store.version();
    const id = this.shop()?.id;
    if (!id) return 0;
    const mine = this.store.basketsOf(id);
    const total = mine.reduce((s, b) => s + b.quantityTotal, 0);
    const sold = this.store.orders().filter((o) => o.status !== 'cancelled' && mine.some((b) => b.id === o.basketId)).length;
    return total > 0 ? Math.round((sold / total) * 100) : 0;
  });

  readonly ratings = computed(() => {
    const base = this.shop()?.rating ?? 4.5;
    const five = Math.min(92, Math.max(40, Math.round(base * 18)));
    const four = Math.max(4, Math.round((100 - five) * 0.7));
    const three = Math.max(1, Math.round((100 - five - four) * 0.6));
    const two = Math.max(1, 100 - five - four - three - 1);
    return [
      { stars: 5, share: five },
      { stars: 4, share: four },
      { stars: 3, share: three },
      { stars: 2, share: two },
      { stars: 1, share: 1 },
    ];
  });

  kindLabel(): string {
    return KIND_LABEL[this.shop()?.kind ?? 'bakery'];
  }

  iconOf(kind: 'bakery' | 'patisserie' | 'restaurant' | 'grocery'): string {
    return KIND_ICON[kind];
  }

  /** Annuaire complet, quand aucune boutique n'est ciblée. */
  readonly allShops = computed(() => {
    this.store.version();
    return this.store.merchants();
  });

  unitsOf(id: string): number {
    return this.store
      .basketsOf(id)
      .filter((b) => b.status === 'live' && b.quantityLeft > 0)
      .reduce((sum, b) => sum + b.quantityLeft, 0);
  }

  heldRate(): number {
    return Math.round(92 + ((this.shop()?.rating ?? 4.5) % 1) * 10);
  }

  windowOf(b: { pickupFromMin: number; pickupToMin: number }): string {
    return `${formatClock(b.pickupFromMin)} – ${formatClock(b.pickupToMin)}`;
  }

  price(millimes: number): string {
    return formatTnd(millimes);
  }
}
