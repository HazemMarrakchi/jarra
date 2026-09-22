import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CityStore } from './core/city.store';
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

        <div class="region">
          <span class="ms ms-18">location_on</span>
          <label class="sr" for="regionSel">Zone</label>
          <select id="regionSel">
            <option>Gabès &amp; oasis littorale</option>
            <option>Grand Gabès</option>
            <option>Sud-Est · Médenine</option>
          </select>
        </div>

        <nav class="nav" aria-label="Navigation principale">
          <a routerLink="/explorer" routerLinkActive="active">Explorer</a>
          <a routerLink="/boutique" routerLinkActive="active">Boutique</a>
          <a routerLink="/publier" routerLinkActive="active">Publier en 10s</a>
          <a routerLink="/commercant" routerLinkActive="active">Gestion &amp; IA</a>
          <a routerLink="/impact" routerLinkActive="active">Impact public</a>
        </nav>

        <div class="top-right">
          <a class="btn btn-primary btn-sm top-cta" routerLink="/publier">
            <span class="ms ms-18">bolt</span>Publier un invendu en 10s
          </a>
          <button
            class="btn btn-quiet btn-sm burger"
            type="button"
            aria-label="Menu"
            [attr.aria-expanded]="menu"
            (click)="menu = !menu"
          >
            <span class="ms ms-20">{{ menu ? 'close' : 'menu' }}</span>
          </button>
        </div>
      </div>

      @if (menu) {
        <div class="mobile-menu">
          <nav class="shell-lg" aria-label="Navigation mobile">
            <a routerLink="/explorer" (click)="menu = false">Explorer &amp; Carte Live</a>
            <a routerLink="/boutique" (click)="menu = false">Boutique Exemple</a>
            <a routerLink="/publier" (click)="menu = false">Publication Express 10s</a>
            <a routerLink="/commercant" (click)="menu = false">Gestion &amp; IA Prédictive</a>
            <a routerLink="/impact" (click)="menu = false">Impact Public &amp; Baromètre</a>
          </nav>
        </div>
      }
    </header>

    <main id="main">
      <router-outlet></router-outlet>
    </main>

    <nav class="tabbar" aria-label="Navigation mobile">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
        <span class="ms ms-24">home</span><span>Accueil</span>
      </a>
      <a routerLink="/explorer" routerLinkActive="active">
        <span class="ms ms-24">map</span><span>Explorer</span>
      </a>
      <a routerLink="/publier" routerLinkActive="active">
        <span class="ms ms-24">bolt</span><span>Publier</span>
      </a>
      <a routerLink="/impact" routerLinkActive="active">
        <span class="ms ms-24">public</span><span>Impact</span>
      </a>
      <a routerLink="/commercant" routerLinkActive="active">
        <span class="ms ms-24">store</span><span>Commerçant</span>
      </a>
    </nav>

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
            <a routerLink="/commercant">Espace commerçant &amp; IA</a>
            <a routerLink="/publier">Publier un invendu en 10s</a>
            <a href="https://github.com/HazemMarrakchi/jarra" target="_blank" rel="noopener">Code source</a>
            <p>hello&#64;jarra.tn</p>
          </div>
        </div>
        <div class="foot-bot">
          <span>© 2026 Jarra.tn — conçu et développé à Gabès, Tunisie</span>
          <span>Démonstration : commerces et données simulés. Aucun paiement réel.</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .skip {
      position: absolute; left: 12px; top: -60px; z-index: 100;
      background: var(--primary-container); color: var(--on-primary);
      padding: 11px 16px; border-radius: var(--r-md); font-weight: 600; transition: top .2s;
    }
    .skip:focus { top: 12px; }
  `],
})
export class AppComponent {
  private readonly store = inject(CityStore);
  readonly impact = this.store.impact;
  menu = false;
}
