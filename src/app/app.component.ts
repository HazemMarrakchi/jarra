import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CityStore } from './core/city.store';
import { PushService } from './core/push.service';
import { LivePillComponent } from './core/ticker.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LivePillComponent],
  template: `
    <a class="skip" href="#main">Aller au contenu principal</a>

    <header class="top">
      <!-- Rappel du modèle : aucun paiement en ligne + registre live -->
      <div class="notice">
        <div class="shell-lg notice-inner">
          <span class="notice-text">
            <span class="ms ms-18">storefront</span>
            <span>Zéro carte bancaire requise en ligne • Règlement direct au comptoir de vos artisans (Espèces ou TPE local)</span>
          </span>
          <jr-live-pill />
        </div>
      </div>

      <div class="shell-lg top-bar">
        <a class="brand" routerLink="/" aria-label="Jarra.tn, accueil">
          <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="currentColor"
              d="M18.5 5.5h11v3.2c0 2.1-1 3.6-2.7 4.7 5.9 2.6 9.7 8.1 9.7 14.5C36.5 36.4 30.3 42.5 24 42.5S11.5 36.4 11.5 27.9c0-6.4 3.8-11.9 9.7-14.5-1.7-1.1-2.7-2.6-2.7-4.7V5.5Z"
            />
            <path fill="#fff" fill-opacity=".5" d="M16.5 25.2c4.6 2.1 10.4 2.1 15 0v1.8c-4.6 2.1-10.4 2.1-15 0Z" />
          </svg>
          <span class="brand-name">Jarra<i>.tn</i></span>
        </a>

        @if (!locked()) {
          <nav class="nav" aria-label="Navigation principale">
            <a routerLink="/explorer" routerLinkActive="active">Explorer</a>
            <a routerLink="/boutique" routerLinkActive="active">Boutiques</a>
            <a routerLink="/impact" routerLinkActive="active">Impact</a>
            <a routerLink="/commercant" routerLinkActive="active">Espace Commerçant</a>
          </nav>
        }

        <div class="top-right">
          @if (!locked()) {
          @if (push.available) {
            <button
              class="bell-btn"
              type="button"
              [class.on]="push.state() === 'on'"
              [disabled]="push.busy() || push.state() === 'denied'"
              [attr.aria-pressed]="push.state() === 'on'"
              [attr.aria-label]="push.label()"
              [title]="push.label()"
              (click)="push.toggle()"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                />
              </svg>
              @if (push.state() === 'on') {
                <span class="bell-dot" aria-hidden="true"></span>
              }
            </button>
          }
          <a class="btn btn-primary btn-sm top-cta" routerLink="/commercant">
            <span class="ms ms-18">bolt</span>Publier un invendu
          </a>
          @if (phone(); as p) {
            <button
              class="btn btn-quiet btn-sm"
              type="button"
              [title]="'Déconnexion (' + p + ')'"
              aria-label="Se déconnecter"
              (click)="logout()"
            >
              <span class="ms ms-18">logout</span>
            </button>
          }
          <button
            class="btn btn-quiet btn-sm burger"
            type="button"
            aria-label="Menu"
            [attr.aria-expanded]="menu"
            (click)="menu = !menu"
          >
            <span class="ms ms-20">{{ menu ? 'close' : 'menu' }}</span>
          </button>
          }
        </div>
      </div>

      @if (menu && !locked()) {
        <div class="mobile-menu">
          <nav class="shell-lg" aria-label="Navigation mobile">
            <a routerLink="/explorer" (click)="menu = false">Explorer — carte en direct</a>
            <a routerLink="/boutique" (click)="menu = false">Les boutiques anti-gaspi</a>
            <a routerLink="/impact" (click)="menu = false">Impact public</a>
            <a routerLink="/commercant" (click)="menu = false">Espace commerçant</a>
          </nav>
        </div>
      }
    </header>

    <main id="main">
      <router-outlet></router-outlet>
    </main>

    @if (!locked()) {
    <nav class="tabbar" aria-label="Navigation mobile">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
        <span class="ms ms-24">home</span><span>Accueil</span>
      </a>
      <a routerLink="/explorer" routerLinkActive="active">
        <span class="ms ms-24">map</span><span>Explorer</span>
      </a>
      <a routerLink="/impact" routerLinkActive="active">
        <span class="ms ms-24">public</span><span>Impact</span>
      </a>
      <a routerLink="/commercant" routerLinkActive="active">
        <span class="ms ms-24">store</span><span>Commerçant</span>
      </a>
    </nav>
    }

    @if (!locked()) {
    <footer class="foot">
      <div class="shell-lg">
        <div class="foot-grid">
          <div class="foot-brand">
            <div class="row gap-sm" style="margin-bottom:10px">
              <svg style="width:30px;height:30px;color:var(--primary-container)" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M18.5 5.5h11v3.2c0 2.1-1 3.6-2.7 4.7 5.9 2.6 9.7 8.1 9.7 14.5C36.5 36.4 30.3 42.5 24 42.5S11.5 36.4 11.5 27.9c0-6.4 3.8-11.9 9.7-14.5-1.7-1.1-2.7-2.6-2.7-4.7V5.5Z"
                />
              </svg>
              <span class="brand-name" style="font-size:1.25rem">Jarra<i>.tn</i></span>
            </div>
            <p>La nourriture invendue de vos artisans, rendue visible en temps réel.</p>
            <p class="mono-num" style="color:var(--secondary);margin-top:8px">{{ impact().mealsSaved }} repas sauvés</p>
          </div>

          <div>
            <h4>Filières Gourmandes</h4>
            <a routerLink="/explorer">Boulangeries &amp; Tabounas</a>
            <a routerLink="/explorer">Pâtisseries Tunisiennes</a>
            <a routerLink="/explorer">Primeurs &amp; Marchés Locaux</a>
            <a routerLink="/explorer">Traiteurs &amp; Rôtisseries</a>
          </div>

          <div>
            <h4>Territoires Actifs</h4>
            @for (a of impact().byArea.slice(0, 4); track a.area) {
              <a routerLink="/impact">{{ a.area }} <span class="mono-num">{{ a.meals }}</span> repas</a>
            }
          </div>

          <div>
            <h4>Artisans &amp; Partenaires</h4>
            <a routerLink="/commercant">Espace commerçant</a>
            <a routerLink="/admin">Administration pilote</a>
            <a href="https://github.com/HazemMarrakchi/jarra" target="_blank" rel="noopener">Code source</a>
          </div>
        </div>
        <div class="foot-bot">
          <span>© 2026 Jarra.tn — conçu et développé à Gabès, Tunisie</span>
          <span>Pilote citoyen à Gabès — paiement au comptoir, aucun frais en ligne.</span>
        </div>
      </div>
    </footer>
    }
  `,
  styles: [`
    .skip {
      position: absolute; left: 12px; top: -60px; z-index: 100;
      background: var(--primary-container); color: var(--on-primary);
      padding: 11px 16px; border-radius: var(--r-md); font-weight: 600; transition: top .2s;
    }
    .skip:focus { top: 12px; }
    /* Cloche notifications (PushService) — visible sur toutes les pages */
    .bell-btn {
      position: relative; display: grid; place-items: center;
      width: 38px; height: 38px; border-radius: 999px;
      border: 1px solid rgba(60, 50, 40, .18);
      background: transparent; color: inherit;
      cursor: pointer; transition: all .2s;
    }
    .bell-btn svg { width: 20px; height: 20px; }
    .bell-btn:hover:not(:disabled) {
      background: var(--secondary-container); color: var(--primary);
      box-shadow: var(--shadow-2); transform: translateY(-1px);
    }
    .bell-btn.on {
      color: var(--primary); border-color: var(--primary);
      background: var(--primary-container);
    }
    .bell-btn:disabled { opacity: .55; cursor: not-allowed; }
    .bell-dot {
      position: absolute; top: 5px; right: 6px;
      width: 9px; height: 9px; border-radius: 50%;
      background: var(--secondary); border: 2px solid #fff;
    }
  `],
})
export class AppComponent {
  private readonly store = inject(CityStore);
  private readonly router = inject(Router);
  readonly push = inject(PushService);
  readonly impact = this.store.impact;
  menu = false;

  /** Verrou global : en mode live sans session, navigation et liens masqués. */
  readonly locked = computed(() => this.store.mode === 'live' && !this.store.merchantAuth());
  readonly phone = computed(() => this.store.merchantAuth()?.phone ?? null);

  async logout(): Promise<void> {
    await this.store.signOut();
    this.menu = false;
    await this.router.navigateByUrl('/connexion');
  }
}
