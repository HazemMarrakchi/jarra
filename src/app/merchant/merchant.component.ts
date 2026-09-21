import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CityStore } from '../core/city.store';
import { KIND_ICON, formatClock, formatTnd } from '../core/model';
import { predictWaste, demoHistoryFor, PredictionInput } from '../core/predictor';

@Component({
  selector: 'jr-merchant',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="shell">
      <header class="head rise">
        <span class="eyebrow">🏪 Espace commerçant</span>
        <h1>Publiez vos invendus en 30 secondes</h1>
        <p class="sub">
          Pas de contrat, pas de commission la première semaine.
          Vos invendus du soir deviennent un revenu au lieu d'une perte.
        </p>
      </header>

      <div class="dash">
        <div class="col">
          <section class="card panel rise">
            <h2>Votre commerce</h2>
            <div class="field">
              <label for="shop">Sélectionnez votre commerce (démo)</label>
              <select id="shop" name="shop" [ngModel]="selectedId()" (ngModelChange)="selectShop($event)">
                @for (m of store.merchants(); track m.id) {
                  <option [value]="m.id">{{ icon(m.kind) }} {{ m.name }} — {{ m.area }}</option>
                }
              </select>
            </div>
            @if (me(); as m) {
              <div class="shop-card">
                <span class="shop-ico">{{ icon(m.kind) }}</span>
                <div>
                  <strong>{{ m.name }}</strong>
                  <span class="shop-meta">{{ m.area }} · ⭐ {{ m.rating }} ({{ m.ratingCount }} avis)</span>
                </div>
                @if (m.verified) { <span class="v-badge">✓ Vérifié</span> }
              </div>
            }
          </section>

          <section class="card panel rise" style="animation-delay:.06s">
            <h2>🤖 Prédiction des invendus</h2>
            <p class="panel-sub">Estimation pour demain, à partir de votre historique de service.</p>
            <div class="predict-box">
              <div class="p-main">
                <span class="p-num">{{ prediction().expected }}</span>
                <span class="p-unit">invendus probables</span>
              </div>
              <div class="p-details">
                <span>Intervalle : <strong>{{ prediction().low }}–{{ prediction().high }}</strong></span>
                <span>Confiance : <strong>{{ prediction().confidence }}%</strong></span>
                <span>Jour : <strong>{{ prediction().weekday.toUpperCase() }}</strong></span>
              </div>
              <div class="p-bar"><i [style.width.%]="prediction().confidence"></i></div>
              <p class="p-tip">💡 {{ prediction().tip }}</p>
            </div>
          </section>

          <section class="card panel rise" style="animation-delay:.12s">
            <h2>🎫 Valider un retrait</h2>
            <p class="panel-sub">Saisissez le code à 4 caractères présenté par le client.</p>
            <form class="collect-form" (ngSubmit)="collect()">
              <input name="code" [(ngModel)]="codeInput" placeholder="A7K2" maxlength="4"
                class="code-input" aria-label="Code de retrait" />
              <button class="btn btn-primary" type="submit" [disabled]="codeInput.trim().length < 4">Valider</button>
            </form>
            @if (collectMsg(); as msg) {
              <p class="collect-msg" [class.ok]="collectOk()">{{ msg }}</p>
            }
          </section>
        </div>
        <div class="col">
          <section class="stats card panel rise">
            <h2>Votre performance</h2>
            <div class="stat-grid">
              <div class="s-item"><strong>{{ stats().live }}</strong><span>paniers en ligne</span></div>
              <div class="s-item"><strong>{{ stats().reserved }}</strong><span>réservations en cours</span></div>
              <div class="s-item"><strong>{{ stats().collected }}</strong><span>repas sauvés</span></div>
              <div class="s-item"><strong>{{ stats().revenue }}</strong><span>TND récupérés</span></div>
              <div class="s-item"><strong>{{ stats().rescueRate }}%</strong><span>taux de sauvetage</span></div>
              <div class="s-item"><strong>{{ stats().co2 }}<small>kg</small></strong><span>CO₂ évités</span></div>
            </div>
          </section>

          <section class="card panel rise" style="animation-delay:.08s">
            <h2>📦 Publication express</h2>
            <p class="panel-sub">Choisissez un modèle, ajustez, publiez — c'est en ligne instantanément.</p>
            <form class="publish-form" (ngSubmit)="publish()">
              <div class="field">
                <label for="title">Titre du panier</label>
                <input id="title" name="title" [(ngModel)]="draftTitle" placeholder="Panier du soir" />
              </div>
              <div class="row-2">
                <div class="field">
                  <label for="orig">Prix d'origine (TND)</label>
                  <input id="orig" name="orig" type="number" step="0.5" min="1" [(ngModel)]="draftOriginal" />
                </div>
                <div class="field">
                  <label for="rescue">Prix Jarra (TND)</label>
                  <input id="rescue" name="rescue" type="number" step="0.5" min="0.5" [(ngModel)]="draftRescue" />
                </div>
              </div>
              <div class="row-2">
                <div class="field">
                  <label for="qty">Quantité</label>
                  <input id="qty" name="qty" type="number" min="1" max="20" [(ngModel)]="draftQty" />
                </div>
                <div class="field">
                  <label for="until">Retrait jusqu'à</label>
                  <input id="until" name="until" type="text" [(ngModel)]="draftUntil" placeholder="21:30" />
                </div>
              </div>
              <button class="btn btn-primary publish-btn" type="submit">🚀 Publier maintenant</button>
            </form>
            @if (publishMsg(); as msg) {
              <p class="collect-msg ok">{{ msg }}</p>
            }
          </section>

          <section class="card panel rise" style="animation-delay:.14s">
            <h2>Vos paniers</h2>
            <ul class="my-baskets">
              @for (b of myBaskets(); track b.id) {
                <li [class.done]="b.status !== 'live'">
                  <span class="mb-title">{{ b.title }}</span>
                  <span class="mb-meta">
                    {{ b.quantityLeft }}/{{ b.quantityTotal }} · {{ formatPrice(b.rescuePrice) }} TND ·
                    {{ statusLabel(b) }}
                  </span>
                </li>
              } @empty {
                <li class="mb-empty">Aucun panier publié pour l'instant.</li>
              }
            </ul>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .head { padding: 2rem 0 1.4rem; }
    .eyebrow {
      display: inline-block; font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--clay-strong); background: var(--clay-ghost);
      border: 1px solid rgba(232, 129, 79, 0.3);
      padding: 0.35rem 0.85rem; border-radius: 999px; margin-bottom: 1rem;
    }
    .head h1 { font-size: clamp(1.7rem, 3.6vw, 2.4rem); }
    .head .sub { color: var(--muted); font-weight: 300; max-width: 40rem; margin: 0.5rem 0 0; }

    .dash { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; align-items: start; }
    .col { display: flex; flex-direction: column; gap: 1.2rem; }

    .panel { padding: 1.4rem; }
    .panel h2 { font-size: 1.1rem; }
    .panel-sub { color: var(--muted); font-size: 0.84rem; font-weight: 300; margin: 0.35rem 0 1.1rem; }

    .shop-card {
      display: flex; align-items: center; gap: 0.8rem;
      margin-top: 1rem; padding: 0.9rem 1rem; border-radius: var(--r-md);
      background: var(--bg-raised); border: 1px solid var(--border-soft);
    }
    .shop-ico { font-size: 1.6rem; }
    .shop-card strong { display: block; font-size: 0.96rem; }
    .shop-meta { font-size: 0.78rem; color: var(--muted); }
    .v-badge {
      margin-left: auto; font-size: 0.7rem; font-weight: 700;
      color: var(--olive); background: var(--olive-ghost);
      border: 1px solid rgba(76, 122, 56, 0.35);
      padding: 0.25rem 0.6rem; border-radius: 999px; white-space: nowrap;
    }

    /* prédiction */
    .predict-box { display: grid; gap: 0.8rem; }
    .p-main { display: flex; align-items: baseline; gap: 0.5rem; }
    .p-num { font-family: var(--font-display); font-size: 2.6rem; font-weight: 700; color: var(--clay-strong); line-height: 1; }
    .p-unit { color: var(--muted); font-size: 0.86rem; }
    .p-details { display: flex; flex-wrap: wrap; gap: 0.4rem 1.2rem; font-size: 0.8rem; color: var(--muted); }
    .p-details strong { color: var(--sand-dim); }
    .p-bar { height: 6px; border-radius: 3px; background: var(--border-soft); overflow: hidden; }
    .p-bar i { display: block; height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--olive-deep), var(--olive)); transition: width 0.7s var(--ease-out); }
    .p-tip { font-size: 0.8rem; color: var(--sand-dim); margin: 0; padding: 0.7rem 0.9rem; border-radius: var(--r-sm); background: var(--border-soft); }

    /* validation */
    .collect-form { display: flex; gap: 0.6rem; }
    .code-input {
      flex: 1; text-align: center; text-transform: uppercase; letter-spacing: 0.3em;
      font-family: var(--font-mono); font-size: 1.15rem; font-weight: 700;
      padding: 0.7rem; border-radius: var(--r-sm);
      background: var(--bg-raised); color: var(--sand); border: 1px solid var(--border);
    }
    .code-input:focus { outline: none; border-color: var(--clay); box-shadow: 0 0 0 3px var(--clay-ghost); }
    .collect-msg { margin: 0.8rem 0 0; font-size: 0.85rem; color: var(--danger); font-weight: 600; }
    .collect-msg.ok { color: var(--olive); }

    /* stats */
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; margin-top: 0.6rem; }
    .s-item {
      display: flex; flex-direction: column; gap: 2px; padding: 0.8rem 0.9rem;
      border-radius: var(--r-sm); background: var(--border-soft);
    }
    .s-item strong { font-family: var(--font-display); font-size: 1.4rem; color: var(--sand); font-variant-numeric: tabular-nums; }
    .s-item strong small { font-size: 0.7rem; color: var(--muted); margin-left: 2px; }
    .s-item span { font-size: 0.72rem; color: var(--faint); }

    /* publication */
    .publish-form { display: grid; gap: 0.9rem; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
    .publish-btn { width: 100%; }

    /* mes paniers */
    .my-baskets { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; max-height: 240px; overflow-y: auto; }
    .my-baskets li {
      display: flex; flex-direction: column; gap: 2px; padding: 0.65rem 0.85rem;
      border-radius: var(--r-sm); background: var(--border-soft);
      border-left: 3px solid var(--clay);
    }
    .my-baskets li.done { border-left-color: var(--faint); opacity: 0.65; }
    .mb-title { font-size: 0.88rem; font-weight: 600; }
    .mb-meta { font-size: 0.75rem; color: var(--muted); }
    .mb-empty { color: var(--faint); font-style: italic; background: none; border-left: none; }

    @media (max-width: 900px) {
      .dash { grid-template-columns: 1fr; }
    }
    @media (max-width: 520px) {
      .row-2 { grid-template-columns: 1fr; }
      .stat-grid { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class MerchantComponent {
  readonly store = inject(CityStore);

  readonly selectedId = signal<string>('m01');
  codeInput = '';
  readonly collectMsg = signal<string | null>(null);
  readonly collectOk = signal(false);
  readonly publishMsg = signal<string | null>(null);

  // Formulaire de publication express
  draftTitle = 'Panier du soir';
  draftOriginal = 12;
  draftRescue = 4;
  draftQty = 3;
  draftUntil = '21:30';

  readonly me = computed(() => {
    this.store.version();
    return this.store.merchant(this.selectedId());
  });

  readonly myBaskets = computed(() => {
    this.store.version();
    return [...this.store.basketsOf(this.selectedId())].reverse();
  });

  readonly prediction = computed(() => {
    const m = this.me();
    const history = demoHistoryFor(m?.kind ?? 'bakery', this.selectedId().length);
    // Jour visé : le lendemain de la journée simulée (déterministe).
    const input: PredictionInput = { history, weekday: (this.store.clockMin() + 1) % 7 };
    return predictWaste(input);
  });

  readonly stats = computed(() => {
    this.store.version();
    const mine = this.store.basketsOf(this.selectedId());
    const orders = this.store.orders().filter((o) => mine.some((b) => b.id === o.basketId));
    const collected = orders.filter((o) => o.status === 'collected');
    const reserved = orders.filter((o) => o.status === 'reserved');
    const live = mine.filter((b) => b.status === 'live' && b.quantityLeft > 0);

    const totalUnits = mine.reduce((sum, b) => sum + b.quantityTotal, 0);
    const soldUnits = orders.filter((o) => o.status !== 'cancelled').length;

    const revenue = collected.reduce((sum, o) => {
      const b = mine.find((x) => x.id === o.basketId);
      return sum + (b ? b.rescuePrice : 0);
    }, 0);

    return {
      live: live.length,
      reserved: reserved.length,
      collected: collected.length,
      revenue: formatTnd(revenue),
      rescueRate: totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0,
      co2: Math.round(collected.length * 2.5 * 10) / 10,
    };
  });

  selectShop(id: string): void {
    this.selectedId.set(id);
    this.collectMsg.set(null);
    this.publishMsg.set(null);
  }

  icon(kind: string): string {
    return KIND_ICON[kind as keyof typeof KIND_ICON] ?? '🏪';
  }

  formatPrice(millimes: number): string {
    return formatTnd(millimes);
  }

  statusLabel(b: { status: string }): string {
    return (
      { live: 'en ligne', soldout: 'épuisé', expired: 'créneau terminé' } as Record<string, string>
    )[b.status] ?? b.status;
  }

  /** Valide un retrait avec le code client → l'impact est comptabilisé. */
  collect(): void {
    const code = this.codeInput.trim().toUpperCase();
    if (code.length < 4) return;
    const order = this.store.collect(code);
    if (order) {
      this.collectOk.set(true);
      this.collectMsg.set(`✓ Retrait validé pour ${order.customerName === '__you__' ? 'le client' : order.customerName}. Un repas sauvé de plus !`);
      this.codeInput = '';
    } else {
      this.collectOk.set(false);
      this.collectMsg.set('✗ Code introuvable ou déjà utilisé. Vérifiez auprès du client.');
    }
  }

  /** Publication express : le panier apparaît immédiatement sur la carte. */
  publish(): void {
    const basket = this.store.publish(this.selectedId(), {
      title: this.draftTitle.trim() || 'Panier surprise',
      description: 'Panier composé des invendus du jour, à récupérer avant la fermeture.',
      originalPrice: Math.round(this.draftOriginal * 1000),
      rescuePrice: Math.round(this.draftRescue * 1000),
      quantity: Math.max(1, Math.min(20, Math.round(this.draftQty))),
      pickupUntil: this.draftUntil,
    });
    this.publishMsg.set(
      basket
        ? `🚀 « ${basket.title} » est en ligne — visible sur la carte immédiatement.`
        : 'Publication impossible : vérifiez les champs.',
    );
  }

  clockLabel(): string {
    return formatClock(this.store.clockMin());
  }
}
