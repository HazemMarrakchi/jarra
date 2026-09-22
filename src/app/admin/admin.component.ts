// ═══════════════════════════════════════════════════════════════════
// JARRA — Section admin (pilote)
// Réservée aux numéros listés dans la table `admins` (migration-admin.sql).
// La session OTP est globale (page /connexion, verrou authGuard) ; ici on
// vérifie uniquement les droits côté base via la RPC is_admin().
// ═══════════════════════════════════════════════════════════════════

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CityStore } from '../core/city.store';
import { KIND_LABEL } from '../core/model';
import { KIND_ICON } from '../core/ui';

@Component({
  selector: 'jr-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <section class="page-head">
      <div class="shell-lg">
        <span class="eco-badge"><span class="ms" style="font-size:15px">admin_panel_settings</span>Accès restreint — équipe pilote</span>
        <h1 style="margin-top:var(--space-sm)">Administration Jarra</h1>
        <p class="body-lg muted" style="margin-top:var(--space-sm)">
          Onboarding des commerces, codes PIN, modération des paniers. Réservé aux numéros autorisés.
        </p>
      </div>
    </section>

    <div class="shell-lg stack gap-lg" style="padding-bottom:var(--space-xl)">
      @if (store.mode !== 'live') {
        <div class="card card-pad">
          <p class="body-md">La section admin n'est disponible qu'en mode connecté (Supabase).</p>
        </div>
      } @else if (!adminChecked()) {
        <!-- ── Vérification des droits (session déjà ouverte via /connexion) ── -->
        <div class="card card-pad" style="max-width:32rem">
          <p class="body-md"><span class="ms ms-18">hourglass_top</span> Vérification des droits…</p>
        </div>
      } @else if (!isAdmin()) {
        <!-- ── Numéro non autorisé ────────────────────────────────────── -->
        <div class="card card-pad" style="max-width:32rem">
          <h2 class="headline-sm">Numéro non autorisé</h2>
          <p class="body-sm muted" style="margin-top:var(--space-sm)">
            {{ auth()?.phone }} n'est pas dans la liste des administrateurs. Ajoutez-le via SQL :
            <code>insert into public.admins (phone) values ('{{ auth()?.phone }}');</code>
          </p>
        </div>
      } @else if (isAdmin()) {
        <!-- ── Tableau de bord pilote ─────────────────────────────────── -->
        <div class="row between wrap gap-sm">
          <span class="pill pill-eco"><span class="ms" style="font-size:14px">verified_user</span>Connecté : {{ auth()?.phone }}</span>
        </div>

        <div class="strip">
          <div><span class="mono-num">{{ store.merchants().length }}</span><span class="label-sm muted">commerces inscrits</span></div>
          <div><span class="mono-num">{{ liveBaskets().length }}</span><span class="label-sm muted">paniers en ligne</span></div>
          <div><span class="mono-num">{{ ordersToday() }}</span><span class="label-sm muted">réservations affichées</span></div>
          <div><span class="mono-num">{{ pushCount() ?? '—' }}</span><span class="label-sm muted">appareils abonnés push</span></div>
        </div>

        <!-- Ajouter un commerce -->
        <div class="card card-pad">
          <h2 class="headline-sm" style="margin-bottom:var(--space-md)">Ajouter un commerce au pilote</h2>
          <div class="add-grid">
            <div class="field"><label for="mName">Nom</label><input id="mName" class="input" name="mName" [(ngModel)]="fName" placeholder="Fournil El Bhar" /></div>
            <div class="field">
              <label for="mKind">Type</label>
              <select id="mKind" class="select" name="mKind" [(ngModel)]="fKind">
                <option value="bakery">Pain &amp; viennoiserie</option>
                <option value="patisserie">Pâtisserie fine</option>
                <option value="restaurant">Plats traiteur</option>
                <option value="grocery">Primeurs &amp; fruits</option>
              </select>
            </div>
            <div class="field"><label for="mArea">Quartier</label><input id="mArea" class="input" name="mArea" [(ngModel)]="fArea" placeholder="Médina" /></div>
            <div class="field"><label for="mLat">Latitude</label><input id="mLat" class="input" name="mLat" [(ngModel)]="fLat" placeholder="33.8815" /></div>
            <div class="field"><label for="mLon">Longitude</label><input id="mLon" class="input" name="mLon" [(ngModel)]="fLon" placeholder="10.0982" /></div>
          </div>
          <div class="row gap-sm wrap" style="margin-top:var(--space-md)">
            <button class="btn btn-ghost btn-sm" type="button" (click)="useMyPosition()">
              <span class="ms ms-18">my_location</span>Utiliser ma position GPS
            </button>
            <button class="btn btn-primary" type="button" [disabled]="busy()" (click)="addMerchant()">
              <span class="ms ms-18">add_business</span>Créer le commerce
            </button>
          </div>
          @if (newPin(); as pin) {
            <div class="pin-box" role="status">
              <span class="ms ms-24">key</span>
              <div>
                <b>Commerce créé — PIN initial : <span class="mono-num">{{ pin }}</span></b>
                <p class="body-sm muted">Notez-le et remettez-le au commerçant : il ne sera <u>jamais réaffiché</u>.</p>
              </div>
            </div>
          }
          @if (formMsg(); as msg) {
            <p class="body-sm" role="alert" style="color:var(--urgent);margin-top:var(--space-sm)">{{ msg }}</p>
          }
        </div>

        <!-- Commerces : régénération des PIN -->
        <div class="card card-pad">
          <h2 class="headline-sm" style="margin-bottom:var(--space-md)">Commerces inscrits</h2>
          <div class="stack gap-sm">
            @for (m of store.merchants(); track m.id) {
              <div class="admin-row">
                <span class="ai-ico"><span class="ms ms-24">{{ icon(m.kind) }}</span></span>
                <div class="grow">
                  <b class="label-lg">{{ m.name }}</b>
                  <p class="label-sm muted">{{ kindLabel(m.kind) }} · {{ m.area }} · {{ activeOf(m.id) }} panier(s) en ligne</p>
                </div>
                @if (resetPins()[m.id]; as pin) {
                  <span class="pill pill-eco">Nouveau PIN : <b class="mono-num">{{ pin }}</b> (notez-le !)</span>
                } @else {
                  <button class="btn btn-ghost btn-sm" type="button" [disabled]="busy()" (click)="resetPin(m.id)">
                    <span class="ms ms-18">key</span>Nouveau PIN
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <!-- Modération des paniers -->
        <div class="card card-pad">
          <h2 class="headline-sm" style="margin-bottom:var(--space-md)">Paniers en ligne — modération</h2>
          @if (liveBaskets().length === 0) {
            <p class="body-sm muted">Aucun panier en ligne pour le moment.</p>
          }
          <div class="stack gap-sm">
            @for (b of liveBaskets(); track b.id) {
              <div class="admin-row">
                <div class="grow">
                  <b class="label-lg">{{ b.title }}</b>
                  <p class="label-sm muted">{{ merchantName(b.merchantId) }} · reste {{ b.quantityLeft }}/{{ b.quantityTotal }}</p>
                </div>
                <button class="btn btn-ghost btn-sm" type="button" [disabled]="busy()" (click)="expire(b.id)">
                  <span class="ms ms-18">visibility_off</span>Retirer
                </button>
              </div>
            }
          </div>
        </div>
      } @else {
        <p class="body-md muted">Vérification des droits…</p>
      }
    </div>
  `,
  styles: [`
    .add-grid { display: grid; gap: var(--space-md); grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
    .pin-box {
      display: flex; gap: var(--space-sm); align-items: flex-start;
      margin-top: var(--space-md); padding: var(--space-md);
      background: var(--secondary-container); border-radius: var(--r-md);
    }
    .admin-row {
      display: flex; align-items: center; gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      background: var(--surface-container-low); border-radius: var(--r-md);
    }
  `],
})

export class AdminComponent {
  readonly store = inject(CityStore);
  readonly auth = this.store.merchantAuth;

  readonly busy = signal(false);

  // ── Droits admin ──────────────────────────────────────────────────
  readonly adminChecked = signal(false);
  readonly isAdmin = signal(false);
  readonly pushCount = signal<number | null>(null);

  // ── Formulaire nouveau commerce ───────────────────────────────────
  fName = '';
  fKind = 'bakery';
  fArea = '';
  fLat = '';
  fLon = '';
  readonly newPin = signal<string | null>(null);
  readonly formMsg = signal<string | null>(null);

  /** PIN régénérés pendant la session (affichés une fois, jamais rechargés). */
  readonly resetPins = signal<Record<string, string>>({});

  readonly liveBaskets = computed(() => {
    this.store.version();
    return this.store.baskets().filter((b) => b.status === 'live' && b.quantityLeft > 0);
  });

  readonly ordersToday = computed(() => {
    this.store.version();
    return this.store.orders().filter((o) => o.status !== 'cancelled').length;
  });

  constructor() {
    // Session OTP persistante : si déjà connecté, vérifier les droits.
    if (this.auth()) void this.checkAdmin();
  }

  kindLabel(kind: string): string {
    return KIND_LABEL[kind as keyof typeof KIND_LABEL] ?? 'Commerce';
  }

  icon(kind: string): string {
    return KIND_ICON[kind as keyof typeof KIND_ICON] ?? 'store';
  }

  merchantName(id: string): string {
    return this.store.merchant(id)?.name ?? 'Commerce';
  }

  activeOf(merchantId: string): number {
    this.store.version();
    return this.store.basketsOf(merchantId).filter((b) => b.status === 'live' && b.quantityLeft > 0).length;
  }

  /** Vérifie que le numéro connecté est dans la table `admins`. */
  private async checkAdmin(): Promise<void> {
    const ok = await this.store.isAdmin();
    this.isAdmin.set(ok);
    this.adminChecked.set(true);
    if (ok) this.pushCount.set(await this.store.adminPushCount());
  }

  // ── Actions admin ──────────────────────────────────────────────────

  useMyPosition(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      this.fLat = pos.coords.latitude.toFixed(6);
      this.fLon = pos.coords.longitude.toFixed(6);
    });
  }

  async addMerchant(): Promise<void> {
    const lat = Number(this.fLat);
    const lon = Number(this.fLon);
    this.newPin.set(null);
    if (this.fName.trim().length < 2 || this.fArea.trim().length < 2 || !isFinite(lat) || !isFinite(lon)) {
      this.formMsg.set('Nom, quartier et coordonnées GPS valides sont requis.');
      return;
    }
    this.formMsg.set(null);
    this.busy.set(true);
    try {
      const r = await this.store.adminAddMerchant({
        name: this.fName.trim(),
        kind: this.fKind,
        area: this.fArea.trim(),
        lat,
        lon,
      });
      if (r) {
        this.newPin.set(r.pin);
        this.fName = '';
        this.fArea = '';
      } else {
        this.formMsg.set('Création refusée — vérifiez les champs et vos droits admin.');
      }
    } finally {
      this.busy.set(false);
    }
  }

  async resetPin(merchantId: string): Promise<void> {
    this.busy.set(true);
    try {
      const pin = await this.store.adminResetPin(merchantId);
      if (pin) {
        this.resetPins.update((m) => ({ ...m, [merchantId]: pin }));
      }
    } finally {
      this.busy.set(false);
    }
  }

  async expire(basketId: string): Promise<void> {
    this.busy.set(true);
    try {
      await this.store.adminExpireBasket(basketId);
    } finally {
      this.busy.set(false);
    }
  }

}
