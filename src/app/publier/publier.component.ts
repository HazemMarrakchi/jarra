import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityStore } from '../core/city.store';
import { formatClock, formatTnd } from '../core/model';
import { PHOTOS } from '../core/photos';

interface Category {
  key: string;
  icon: string;
  label: string;
  hint: string;
  title: string;
  description: string;
  original: number;
  rescue: number;
}

const CATEGORIES: Category[] = [
  { key: 'pain', icon: 'bakery_dining', label: 'Pain & viennoiseries', hint: 'Baguettes, batards, viennois', title: 'Panier du fournil', description: 'Baguettes tradition, pains spéciaux et viennoiseries de la dernière fournée.', original: 7.5, rescue: 2.5 },
  { key: 'patisserie', icon: 'cake', label: 'Pâtisserie fine', hint: 'Millefeuilles, tartelettes, choux', title: 'Coffret douceurs & pâtisseries fines', description: 'Assortiment de pâtisseries fines du jour, dressées en coffret de sauvetage.', original: 9.0, rescue: 3.0 },
  { key: 'sale', icon: 'lunch_dining', label: 'Salés & snacking', hint: 'Fricassés, mini-pizzas, bricks', title: 'Plateau salés express', description: 'Fricassés, bricks et mini-pizzas préparés pour la vitrine du soir.', original: 6.0, rescue: 2.0 },
  { key: 'plat', icon: 'restaurant', label: 'Plats traiteur', hint: 'Plat du jour, salades composées', title: 'Plat du jour à emporter', description: 'Le plat du jour complet, préparé à midi et jamais servi en salle.', original: 11.0, rescue: 3.8 },
  { key: 'primeur', icon: 'nutrition', label: 'Primeurs & fruits', hint: 'Cagettes mixtes du marché', title: 'Cagette primeur fraîcheur', description: "Fruits et légumes de saison à consommer sous 48 heures.", original: 6.5, rescue: 2.2 },
  { key: 'mixte', icon: 'shopping_basket', label: 'Panier surprise mixte', hint: "L'assortiment coup de cœur", title: 'Panier surprise mixte', description: "Assortiment surprise composé par l'artisan à partir des invendus du jour.", original: 8.0, rescue: 2.8 },
];

interface Slot {
  key: string;
  icon: string;
  label: string;
  hint: string;
  from: number;
  to: number;
}

const SLOTS: Slot[] = [
  { key: 'soir', icon: 'wb_twilight', label: 'Fin de journée', hint: '18h30 – 20h30 · pic d\'affluence', from: 18 * 60 + 30, to: 20 * 60 + 30 },
  { key: 'fermeture', icon: 'nightlight', label: 'Fermeture directe', hint: '20h45 – 21h30 · juste avant le rideau', from: 20 * 60 + 45, to: 21 * 60 + 30 },
  { key: 'matin', icon: 'wb_sunny', label: 'Petit-déjeuner demain', hint: '07h00 – 09h30 · viennoiserie matinale', from: 7 * 60, to: 9 * 60 + 30 },
];

@Component({
  selector: 'jr-publier',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page-head">
      <div class="shell-lg head-inner">
        <span class="eco-badge"><span class="ms" style="font-size:15px">bolt</span>Express 10 secondes</span>
        <h1>Publication flash de vos invendus</h1>
        <p class="body-lg muted" style="max-width:46rem">
          Trois choix et le panier est en ligne sur la carte. Vous pourrez le retirer tant qu'aucune réservation n'a été
          faite.
        </p>

        <div class="shop-pick card card-pad">
          <div class="field" style="flex:1">
            <label for="shopSel">Commerce qui publie</label>
            <select id="shopSel" class="select" [value]="shopId()" (change)="shopId.set($any($event.target).value)">
              @for (m of store.merchants(); track m.id) {
                <option [value]="m.id">{{ m.name }} — {{ m.area }}</option>
              }
            </select>
          </div>
          <button class="btn btn-ghost" type="button" (click)="scan()">
            <span class="ms ms-18">photo_camera</span>Scanner le rayon
          </button>
        </div>
        @if (scanMsg()) {
          <p class="hint">{{ scanMsg() }}</p>
        }
      </div>
    </section>

    <div class="shell-lg pub-grid">
      <div class="stack gap-lg">
        <!-- Étape 1 -->
        <div class="card card-pad">
          <div class="step-head">
            <span class="step-n mono-num">01</span>
            <h2 class="headline-sm">Que sauvez-vous ce soir ?</h2>
          </div>
          <div class="cat-grid">
            @for (c of categories; track c.key) {
              <button class="cat" type="button" [attr.aria-pressed]="cat().key === c.key" (click)="select(c)">
                <span class="ai-ico"><span class="ms ms-24">{{ c.icon }}</span></span>
                <b class="label-lg">{{ c.label }}</b>
                <span class="body-sm muted">{{ c.hint }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Étape 2 -->
        <div class="card card-pad">
          <div class="step-head">
            <span class="step-n mono-num">02</span>
            <h2 class="headline-sm">Nombre de paniers &amp; prix magique</h2>
          </div>
          <div class="row gap-sm wrap" style="margin-bottom:var(--space-md)">
            @for (q of [1, 2, 3, 5, 10]; track q) {
              <button class="fchip" type="button" [attr.aria-pressed]="qty() === q" (click)="qty.set(q)">
                {{ q }}{{ q === 10 ? '+' : '' }} panier{{ q > 1 ? 's' : '' }}
              </button>
            }
          </div>
          <div class="price-grid">
            <div class="field">
              <label for="pOrig">Valeur de vitrine (DT)</label>
              <input id="pOrig" class="input" type="number" step="0.5" min="0" [value]="original()" (input)="original.set(+$any($event.target).value)" />
            </div>
            <div class="field">
              <label for="pRescue">Prix de sauvetage (DT)</label>
              <input id="pRescue" class="input" type="number" step="0.5" min="0" [value]="rescue()" (input)="rescue.set(+$any($event.target).value)" />
            </div>
            <div class="field">
              <label>Remise affichée</label>
              <div class="card-flat" style="padding:.75rem var(--space-md)">
                <span class="discount-chip">-{{ discount() }}%</span>
                <span class="body-sm muted" style="margin-left:var(--space-sm)">recommandé entre 50 % et 70 %</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Étape 3 -->
        <div class="card card-pad">
          <div class="step-head">
            <span class="step-n mono-num">03</span>
            <h2 class="headline-sm">Fenêtre de retrait pour les clients</h2>
          </div>
          <div class="slot-grid">
            @for (s of slots; track s.key) {
              <button class="slot" type="button" [attr.aria-pressed]="slot().key === s.key" (click)="slot.set(s)">
                <span class="ms ms-24" style="color:var(--brand-mint-ink)">{{ s.icon }}</span>
                <b class="label-lg">{{ s.label }}</b>
                <span class="body-sm muted">{{ s.hint }}</span>
              </button>
            }
          </div>
        </div>

        @if (store.mode === 'live') {
          <div class="card card-pad field">
            <label for="pubPin">Code commerçant (PIN) — requis en mode connecté</label>
            <input id="pubPin" class="input" type="password" inputmode="numeric" autocomplete="off"
                   placeholder="Code remis à l'onboarding" [value]="pin" (input)="pin = $any($event.target).value" />
          </div>
        }
        <button class="btn btn-urgent btn-lg btn-block" type="button" [disabled]="busy()" (click)="publish()">
          <span class="ms ms-18">{{ busy() ? 'hourglass_top' : 'rocket_launch' }}</span>{{ busy() ? 'Publication…' : 'Publier ' + qty() + ' panier' + (qty() > 1 ? 's' : '') + ' maintenant' }}
          ({{ price(rescue() * 1000) }} DT / u)
        </button>

        @if (done(); as b) {
          <div class="card card-pad confirm">
            <span class="ms ms-40" style="color:var(--brand-mint-ink)">check_circle</span>
            <div>
              <h3>Panier mis en ligne !</h3>
              <p class="body-sm muted">
                « {{ b.title }} » est visible sur la carte de {{ shopName() }} dès maintenant, avec {{ b.quantityLeft }}
                unités et le créneau {{ slotLabel() }}.
              </p>
            </div>
            <a class="btn btn-primary btn-sm" routerLink="/explorer">
              <span class="ms ms-18">map</span>Voir sur la carte
            </a>
          </div>
        }
      </div>

      <!-- Aperçu citoyen -->
      <div class="stack gap-md sticky-side">
        <p class="eyebrow">Vue citoyen &amp; client</p>
        <article class="food-card">
          <div class="food-media">
            <img [src]="photo()" width="800" height="600" alt="Aperçu du panier tel qu'il apparaîtra aux citoyens." />
            <span class="discount-chip">-{{ discount() }}%</span>
            <span class="window-chip">
              <span class="ms" style="font-size:14px">{{ slot().icon }}</span>{{ slotLabel() }}
            </span>
            <span class="eco-badge eco-float"><span class="ms" style="font-size:14px">eco</span>-1,4 kg CO₂</span>
          </div>
          <div class="food-body">
            <h3>{{ cat().title }}</h3>
            <div class="food-meta">
              <span><span class="ms" style="font-size:15px">storefront</span>{{ shopName() }}</span>
              <span><span class="ms" style="font-size:15px">shopping_basket</span>{{ qty() }} disponible{{ qty() > 1 ? 's' : '' }}</span>
            </div>
            <p class="food-desc">{{ cat().description }}</p>
            <div class="food-foot">
              <span class="price">
                <span class="price-old">{{ price(original() * 1000) }} DT</span>
                <span class="price-now">{{ price(rescue() * 1000) }}</span>
                <span class="price-cur">DT</span>
              </span>
              <span class="btn btn-urgent btn-sm"><span class="ms ms-18">flash_on</span>Réserver</span>
            </div>
          </div>
        </article>

        <div class="ai-banner">
          <span class="ai-ico"><span class="ms ms-24">auto_awesome</span></span>
          <div>
            <b class="label-lg">Conseil Jarra Copilot</b>
            <p class="body-sm muted" style="margin-top:4px">
              À {{ slot().label.toLowerCase() }}, une remise de {{ discount() }} % se vend en moyenne en 14 minutes dans
              votre quartier.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-head { background: var(--surface-container-low); padding: var(--space-xl) 0; }
    .head-inner { display: grid; gap: var(--space-md); }
    .shop-pick { display: grid; gap: var(--space-md); align-items: end; box-shadow: var(--shadow-1); }
    @media (min-width: 700px) { .shop-pick { grid-template-columns: minmax(0, 1fr) auto; } }

    .pub-grid { display: grid; gap: var(--space-lg); padding: var(--space-xl) 0; align-items: start; }
    @media (min-width: 1024px) { .pub-grid { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); } }
    .pub-grid > div { min-width: 0; }
    @media (min-width: 1024px) { .sticky-side { position: sticky; top: 13rem; } }

    .step-head { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md); }
    .step-n { font-size: 0.8125rem; color: var(--brand-mint-ink); letter-spacing: .08em; }

    .cat-grid { display: grid; gap: var(--space-sm); }
    @media (min-width: 640px) { .cat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1100px) { .cat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .cat {
      display: grid; gap: 6px; justify-items: start; text-align: left;
      background: var(--surface-container-low); border: 1.5px solid transparent;
      border-radius: var(--r-lg); padding: var(--space-md); cursor: pointer;
      transition: border-color .2s var(--ease), background .2s var(--ease), box-shadow .2s var(--ease);
    }
    .cat:hover { border-color: var(--brand-mint-line); }
    .cat[aria-pressed="true"] { border-color: var(--brand-forest); background: var(--brand-mint-wash); box-shadow: var(--shadow-1); }

    .price-grid { display: grid; gap: var(--space-md); align-items: end; }
    @media (min-width: 700px) { .price-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

    .slot-grid { display: grid; gap: var(--space-sm); }
    @media (min-width: 700px) { .slot-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .slot {
      display: grid; gap: 6px; justify-items: start; text-align: left;
      background: var(--surface-container-low); border: 1.5px solid transparent;
      border-radius: var(--r-lg); padding: var(--space-md); cursor: pointer;
      transition: border-color .2s var(--ease), background .2s var(--ease), box-shadow .2s var(--ease);
    }
    .slot:hover { border-color: var(--brand-mint-line); }
    .slot[aria-pressed="true"] { border-color: var(--brand-forest); background: var(--brand-mint-wash); box-shadow: var(--shadow-1); }

    .confirm { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--space-md); align-items: center; border-color: var(--brand-mint-line); }
  `],
})
export class PublierComponent {
  readonly store = inject(CityStore);

  readonly categories = CATEGORIES;
  readonly slots = SLOTS;

  readonly shopId = signal(this.store.merchants()[0]?.id ?? '');
  readonly cat = signal<Category>(CATEGORIES[0]);
  readonly slot = signal<Slot>(SLOTS[0]);
  readonly qty = signal(3);
  readonly original = signal(CATEGORIES[0].original);
  readonly rescue = signal(CATEGORIES[0].rescue);
  readonly done = signal<{ title: string; quantityLeft: number } | null>(null);
  readonly scanMsg = signal<string | null>(null);
  readonly busy = signal(false);
  /** Code commerçant — vérifié par le backend en mode live (ignoré en démo). */
  pin = '';

  readonly shopName = computed(() => this.store.merchant(this.shopId())?.name ?? '');

  readonly discount = computed(() => {
    const o = this.original();
    return o > 0 ? Math.max(0, Math.round((1 - this.rescue() / o) * 100)) : 0;
  });

  readonly slotLabel = computed(() => {
    const s = this.slot();
    const f = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
    return `${f(s.from)} – ${f(s.to)}`;
  });

  readonly photo = computed(() => {
    const k = this.store.merchant(this.shopId())?.kind ?? 'bakery';
    return k === 'patisserie' ? PHOTOS.patisserie : k === 'restaurant' ? PHOTOS.traiteur : k === 'grocery' ? PHOTOS.primeur : PHOTOS.boulangerie;
  });

  price(millimes: number): string {
    return formatTnd(Math.round(millimes));
  }

  clock(): string {
    return formatClock(this.store.clockMin());
  }

  /** Sélection d'une catégorie : le titre, la description et les prix suivent. */
  select(c: Category): void {
    this.cat.set(c);
    this.original.set(c.original);
    this.rescue.set(c.rescue);
    this.done.set(null);
  }

  scan(): void {
    const c = this.categories[Math.floor(Math.random() * this.categories.length)];
    this.select(c);
    this.scanMsg.set(`Rayon reconnu : ${c.label}. Vérifiez la quantité avant de publier.`);
  }

  async publish(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const b = await this.store.publish(this.shopId(), {
        title: this.cat().title,
        description: this.cat().description,
        originalPrice: Math.round(this.original() * 1000),
        rescuePrice: Math.round(this.rescue() * 1000),
        quantity: this.qty(),
        pickupUntil: `${String(Math.floor(this.slot().to / 60) % 24).padStart(2, '0')}:${String(this.slot().to % 60).padStart(2, '0')}`,
      }, this.pin.trim() || undefined);
      this.done.set(b ? { title: b.title, quantityLeft: b.quantityLeft } : null);
    } finally {
      this.busy.set(false);
    }
  }
}
