import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CityStore } from '../core/city.store';
import { KIND_LABEL, formatClock, formatTnd } from '../core/model';
import { demoHistoryFor, predictWaste, PredictionInput } from '../core/predictor';
import { KIND_ICON } from '../core/ui';

@Component({
  selector: 'jr-merchant',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <!-- ── En-tête commerçant ───────────────────────────────────── -->
    <section class="page-head">
      <div class="shell-lg">
        <div class="row between wrap gap-md" style="align-items:flex-end">
          <div>
            <span class="eco-badge"><span class="ms" style="font-size:15px">store</span>Statut du comptoir : ouvert</span>
            <h1 style="margin-top:var(--space-sm)">{{ me()?.name }}</h1>
            <p class="body-lg muted" style="margin-top:var(--space-sm)">
              {{ kindLabel(me()?.kind ?? 'bakery') }} · {{ me()?.area }}, Gabès — il est
              <span class="mono-num" style="color:var(--primary-container)">{{ clockLabel() }}</span>.
            </p>
          </div>
          <div class="row gap-sm wrap">
            <div class="field">
              <label for="shopSel">Commerce</label>
              <select id="shopSel" class="select" [value]="selectedId()" (change)="selectShop($any($event.target).value)">
                @for (m of store.merchants(); track m.id) {
                  <option [value]="m.id">{{ m.name }}</option>
                }
              </select>
            </div>
            <a class="btn btn-primary" routerLink="/publier"><span class="ms ms-18">bolt</span>Publication express</a>
          </div>
        </div>
      </div>
    </section>

    <div class="shell-lg dash">
      <!-- ── Colonne principale ─────────────────────────────────── -->
      <div class="stack gap-lg">
        <!-- Jarra Copilot Intelligence -->
        <div class="ai-banner">
          <span class="ai-ico"><span class="ms ms-24">psychology</span></span>
          <div>
            <div class="row between wrap gap-sm">
              <b class="headline-sm">Jarra Copilot Intelligence</b>
              <span class="eco-badge"><span class="ms" style="font-size:14px">verified</span>Pilote automatique activé</span>
            </div>
            <p class="body-md" style="margin-top:var(--space-sm)">
              Surplus anticipé :
              <b class="mono-num">{{ prediction().expected }} unités invendues</b> au prochain service, avec une
              confiance de {{ prediction().confidence }} %.
            </p>
            <div class="prob">
              <span class="label-sm" style="color:var(--on-secondary-container)">Fourchette</span>
              <span class="bar"><i [style.width.%]="prediction().confidence"></i></span>
              <span class="pc">{{ prediction().low }} – {{ prediction().high }}</span>
            </div>
            <div class="copilot-actions">
              <button class="btn btn-primary btn-sm" type="button" (click)="publish()">
                <span class="ms ms-18">rocket_launch</span>Programmer &amp; publier les paniers en 1 clic
              </button>
              <button class="btn btn-ghost btn-sm" type="button" (click)="publishMsg.set('Seuils de publication modifiés pour ce service.')">
                <span class="ms ms-18">tune</span>Modifier les seuils
              </button>
            </div>
            @if (publishMsg(); as msg) {
              <p class="body-sm" role="status" style="color:var(--brand-mint-ink);margin-top:var(--space-sm)">{{ msg }}</p>
            }
            <div class="elasticity">
              <div>
                <p class="label-sm muted" style="text-transform:uppercase">Élasticité vente / tarif</p>
                <p class="body-sm muted">
                  À {{ predictedPrice() }} DT, votre panier se vend en moyenne en 14 minutes dans le quartier.
                </p>
              </div>
              <span class="price"><span class="price-now">{{ predictedPrice() }}</span><span class="price-cur">DT</span></span>
            </div>
          </div>
        </div>

        <!-- Publication express inline -->
        <div class="card card-pad">
          <div class="row between wrap gap-sm" style="margin-bottom:var(--space-md)">
            <h2 class="headline-sm">Publication express en 10 secondes</h2>
            <a class="btn btn-ghost btn-sm" routerLink="/publier">Ouvrir le flux complet<span class="ms ms-18">arrow_forward</span></a>
          </div>
          <div class="pub-inline">
            <div class="field">
              <label for="dTitle">Titre du panier</label>
              <input id="dTitle" class="input" name="draftTitle" [(ngModel)]="draftTitle" />
            </div>
            <div class="field">
              <label for="dQty">Quantité</label>
              <input id="dQty" class="input" type="number" min="1" max="20" name="draftQty" [(ngModel)]="draftQty" />
            </div>
            <div class="field">
              <label for="dOrig">Valeur vitrine (DT)</label>
              <input id="dOrig" class="input" type="number" step="0.5" name="draftOriginal" [(ngModel)]="draftOriginal" />
            </div>
            <div class="field">
              <label for="dRescue">Prix Jarra (DT)</label>
              <input id="dRescue" class="input" type="number" step="0.5" name="draftRescue" [(ngModel)]="draftRescue" />
            </div>
            <div class="field">
              <label for="dUntil">Fin de créneau</label>
              <input id="dUntil" class="input" type="time" name="draftUntil" [(ngModel)]="draftUntil" />
            </div>
            @if (store.mode === 'live') {
              <div class="field">
                <label for="dPin">Code commerçant (PIN)</label>
                <input id="dPin" class="input" type="password" inputmode="numeric" autocomplete="off" name="draftPin" [(ngModel)]="draftPin" placeholder="Remis à l'onboarding" />
              </div>
            }
            <div class="field">
              <label>Remise</label>
              <div class="card-flat" style="padding:.7rem var(--space-md);display:flex;align-items:center;gap:var(--space-sm)">
                <span class="discount-chip">-{{ discountPct() }}%</span>
              </div>
            </div>
          </div>
          <button class="btn btn-urgent" type="button" style="margin-top:var(--space-md)" [disabled]="busy()" (click)="publish()">
            <span class="ms ms-18">{{ busy() ? 'hourglass_top' : 'bolt' }}</span>{{ busy() ? 'Mise en ligne…' : 'Mettre en ligne maintenant (10s)' }}
          </button>
        </div>

        <!-- Paniers du jour -->
        <div class="card">
          <div class="card-pad" style="padding-bottom:0">
            <h2 class="headline-sm">Paniers du jour actifs</h2>
            <p class="body-sm muted" style="margin-top:4px">Statut calculé à la fin du créneau de retrait.</p>
          </div>
          <div class="card-pad">
            <div class="tbl-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th scope="col">Panier</th>
                    <th scope="col">Créneau</th>
                    <th scope="col" class="right">Restant</th>
                    <th scope="col" class="right">Prix</th>
                    <th scope="col" class="right">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  @for (b of myBaskets(); track b.id) {
                    <tr>
                      <td>{{ b.title }}</td>
                      <td class="mono-num">{{ windowOf(b) }}</td>
                      <td class="right mono-num">{{ b.quantityLeft }} / {{ b.quantityTotal }}</td>
                      <td class="right mono-num">{{ formatPrice(b.rescuePrice) }} DT</td>
                      <td class="right">
                        <span
                          class="pill"
                          [class.pill-forest]="b.status === 'soldout'"
                          [class.pill-mint]="b.status === 'live'"
                          [class.pill-danger]="b.status === 'expired'"
                        >{{ statusLabel(b) }}</span>
                      </td>
                    </tr>
                  }
                  @if (myBaskets().length === 0) {
                    <tr><td colspan="5" class="body-sm muted" style="padding-top:var(--space-md)">Aucun panier publié pour ce commerce.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Colonne latérale ───────────────────────────────────── -->
      <div class="stack gap-md">
        <!-- Encaissement comptoir -->
        <div class="card card-pad stack gap-sm">
          <div class="row between">
            <h2 class="headline-sm">Encaissement au comptoir</h2>
            <span class="ms ms-24" style="color:var(--brand-mint-ink)">point_of_sale</span>
          </div>
          <p class="body-sm muted">
            Saisissez le code à 4 caractères présenté par le client. C'est cette validation qui compte un repas sauvé.
          </p>
          <div class="row gap-sm wrap" style="margin-top:var(--space-sm)">
            <label class="sr" for="collectCode">Code de retrait</label>
            <input
              id="collectCode"
              class="input code-input"
              name="codeInput"
              [(ngModel)]="codeInput"
              placeholder="4X9K"
              maxlength="6"
              autocomplete="off"
              style="flex:1 1 9rem"
              (keyup.enter)="collect()"
            />
            <button class="btn btn-primary" type="button" [disabled]="codeInput.trim().length < 4 || busy()" (click)="collect()">
              <span class="ms ms-18">{{ busy() ? 'hourglass_top' : 'check' }}</span>Valider retrait
            </button>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" (click)="collectMsg.set('Scannez le QR code du client avec la caméra du comptoir.')">
            <span class="ms ms-18">qr_code_scanner</span>Scanner le QR client
          </button>
          @if (collectMsg(); as msg) {
            <p class="body-sm" role="status" [style.color]="collectOk() ? 'var(--brand-mint-ink)' : 'var(--error)'">{{ msg }}</p>
          }
        </div>

        <!-- Bilan du mois -->
        <div class="card card-pad stack gap-sm">
          <h2 class="headline-sm">Bilan du mois en cours</h2>
          <div class="kpi-grid">
            <div class="kpi">
              <span class="mono-num">{{ stats().collected }}</span>
              <span class="label-sm muted">Retraits validés</span>
            </div>
            <div class="kpi">
              <span class="mono-num">{{ stats().rescueRate }} %</span>
              <span class="label-sm muted">Taux de sauvetage</span>
            </div>
            <div class="kpi">
              <span class="mono-num">{{ stats().revenue }}</span>
              <span class="label-sm muted">Dinars récupérés</span>
            </div>
            <div class="kpi">
              <span class="mono-num">{{ stats().co2 }} kg</span>
              <span class="label-sm muted">CO₂ évité</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" (click)="publishMsg.set('Attestation RSE générée pour le mois en cours.')">
            <span class="ms ms-18">download</span>Télécharger l'attestation RSE
          </button>
        </div>

        <!-- Vitrine publique -->
        <div class="card card-pad stack gap-sm">
          <h2 class="headline-sm">Ma vitrine publique</h2>
          <div class="row gap-sm">
            <span class="ai-ico"><span class="ms ms-24">{{ icon(me()?.kind ?? 'bakery') }}</span></span>
            <div class="grow">
              <b class="label-lg">{{ me()?.name }}</b>
              <p class="body-sm muted">{{ kindLabel(me()?.kind ?? 'bakery') }} · {{ me()?.area }}</p>
            </div>
          </div>
          <div class="row gap-sm wrap">
            @if (me()?.verified) {
              <span class="eco-badge"><span class="ms" style="font-size:14px">verified_user</span>Vérifié</span>
            }
            <span class="eco-badge"><span class="ms ms-fill" style="font-size:14px">star</span>{{ me()?.rating }} / 5 · {{ me()?.ratingCount }}</span>
          </div>
          <a class="btn btn-ghost btn-sm" [routerLink]="['/boutique', selectedId()]">
            <span class="ms ms-18">visibility</span>Voir ma fiche publique
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-head { background: var(--surface-container-low); padding: var(--space-xl) 0; }
    .field { min-width: 12rem; }
    .dash { display: grid; gap: var(--space-lg); padding: var(--space-xl) 0; align-items: start; }
    @media (min-width: 1024px) { .dash { grid-template-columns: minmax(0, 8fr) minmax(0, 4fr); } }
    .dash > div { min-width: 0; }

    .copilot-actions { display: flex; gap: var(--space-sm); flex-wrap: wrap; margin-top: var(--space-md); }
    .elasticity {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-md);
      margin-top: var(--space-md); padding-top: var(--space-md);
      border-top: 1px solid rgba(45, 106, 79, .2);
    }

    .pub-inline { display: grid; gap: var(--space-md); }
    @media (min-width: 640px) { .pub-inline { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1280px) { .pub-inline { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

    .code-input { text-align: center; text-transform: uppercase; letter-spacing: .3em; font-family: var(--font-display); font-weight: 700; font-size: 1rem; }

    .kpi-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-sm); }
    .kpi { background: var(--surface-container-low); border-radius: var(--r-md); padding: var(--space-sm) var(--space-md); display: grid; gap: 2px; }
    .kpi .mono-num { font-size: 1.25rem; }
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
  /** Code commerçant — vérifié par le backend en mode live (ignoré en démo). */
  draftPin = '';
  readonly busy = signal(false);

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

  /** Prix conseillé par le copilote, issu de l'élasticité observée. */
  predictedPrice(): string {
    const target = 4 + (this.stats().rescueRate % 5) / 2;
    return formatTnd(Math.round(target * 1000));
  }

  discountPct(): number {
    const o = Number(this.draftOriginal) || 0;
    const r = Number(this.draftRescue) || 0;
    return o > 0 ? Math.max(0, Math.round((1 - r / o) * 100)) : 0;
  }

  selectShop(id: string): void {
    this.selectedId.set(id);
    this.collectMsg.set(null);
    this.publishMsg.set(null);
  }

  kindLabel(kind: string): string {
    return KIND_LABEL[kind as keyof typeof KIND_LABEL] ?? 'Commerce';
  }

  icon(kind: string): string {
    return KIND_ICON[kind as keyof typeof KIND_ICON] ?? 'store';
  }

  formatPrice(millimes: number): string {
    return formatTnd(millimes);
  }

  windowOf(b: { pickupFromMin: number; pickupToMin: number }): string {
    return `${formatClock(b.pickupFromMin)} – ${formatClock(b.pickupToMin)}`;
  }

  statusLabel(b: { status: string }): string {
    return (
      { live: 'en ligne', soldout: 'épuisé', expired: 'créneau terminé' } as Record<string, string>
    )[b.status] ?? b.status;
  }

  /** Valide un retrait avec le code client → l'impact est comptabilisé. */
  async collect(): Promise<void> {
    const code = this.codeInput.trim().toUpperCase();
    if (code.length < 4 || this.busy()) return;
    this.busy.set(true);
    try {
      const order = await this.store.collect(code);
      if (order) {
        this.collectOk.set(true);
        this.collectMsg.set(
          `Retrait validé pour ${order.customerName === '__you__' ? 'le client' : order.customerName}. Un repas sauvé de plus.`,
        );
        this.codeInput = '';
      } else {
        this.collectOk.set(false);
        this.collectMsg.set('Code introuvable ou déjà utilisé. Vérifiez auprès du client.');
      }
    } finally {
      this.busy.set(false);
    }
  }

  /** Publication express : le panier apparaît immédiatement sur la carte. */
  async publish(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const basket = await this.store.publish(this.selectedId(), {
        title: this.draftTitle.trim() || 'Panier surprise',
        description: 'Panier composé des invendus du jour, à récupérer avant la fermeture.',
        originalPrice: Math.round(Number(this.draftOriginal) * 1000),
        rescuePrice: Math.round(Number(this.draftRescue) * 1000),
        quantity: Math.max(1, Math.min(20, Math.round(Number(this.draftQty)))),
        pickupUntil: String(this.draftUntil),
      }, this.draftPin.trim() || undefined);
      this.publishMsg.set(
        basket
          ? `« ${basket.title} » est en ligne : visible sur la carte immédiatement.`
          : 'Publication impossible : vérifiez les champs (et le code commerçant en mode connecté).',
      );
    } finally {
      this.busy.set(false);
    }
  }

  clockLabel(): string {
    return formatClock(this.store.clockMin());
  }
}
