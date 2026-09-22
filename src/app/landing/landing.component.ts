import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityStore } from '../core/city.store';
import { formatClock, formatTnd } from '../core/model';
import { PHOTOS } from '../core/photos';

@Component({
  selector: 'jr-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <!-- ── Héros ────────────────────────────────────────────────── -->
    <section class="hero">
      <div class="shell-lg hero-grid">
        <div class="hero-copy">
          <span class="eco-badge"><span class="ms" style="font-size:15px">eco</span>Plateforme citoyenne née à Gabès</span>
          <h1>Le pain du soir, la cagette du marché : rien ne devrait finir à la poubelle.</h1>
          <p class="body-lg muted">
            Jarra donne une <strong>seconde vie</strong> aux invendus de vos artisans : vous les repérez sur la carte en
            direct, vous réservez en deux clics et vous réglez au comptoir. Aucun intermédiaire, aucun frais.
          </p>
          <div class="hero-cta">
            <a class="btn btn-primary btn-lg" routerLink="/explorer"><span class="ms ms-18">map</span>Ouvrir la carte en direct</a>
            <a class="btn btn-ghost btn-lg" routerLink="/commercant"><span class="ms ms-18">storefront</span>Je suis commerçant</a>
          </div>
          <div class="row gap-sm wrap" style="margin-top:var(--space-sm)">
            <span class="pill pill-eco"><span class="ms" style="font-size:14px">payments</span>Paiement au comptoir</span>
            <span class="pill pill-eco"><span class="ms" style="font-size:14px">schedule</span>Réservation en 2 clics</span>
            <span class="pill pill-eco"><span class="ms" style="font-size:14px">verified_user</span>Artisans vérifiés</span>
          </div>
        </div>

        <figure class="hero-fig">
          <img [src]="photo" width="1100" height="825" alt="Comptoir d'une boulangerie de quartier à Gabès en fin de journée." />
          <div class="hero-badge">
            <span class="mono-num">{{ clock() }}</span>
            <span class="label-sm">Mise à jour directe</span>
          </div>
          <figcaption class="hero-note card">
            <div class="row between">
              <div>
                <b class="label-lg">{{ liveCount() }} paniers en ligne</b>
                <p class="body-sm muted">{{ impact().mealsSaved }} repas sauvés aujourd'hui à Gabès</p>
              </div>
              <a class="btn btn-urgent btn-sm" routerLink="/explorer"><span class="ms ms-18">flash_on</span>Voir</a>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- ── Chiffres du jour ─────────────────────────────────────── -->
    <section class="shell-lg">
      <div class="strip">
        <div>
          <span class="mono-num">{{ impact().mealsSaved }}</span>
          <span class="label-sm muted">repas sauvés aujourd'hui</span>
        </div>
        <div>
          <span class="mono-num">{{ liveCount() }}</span>
          <span class="label-sm muted">paniers disponibles maintenant</span>
        </div>
        <div>
          <span class="mono-num">{{ impact().merchantsActive }}</span>
          <span class="label-sm muted">commerces de quartier inscrits</span>
        </div>
        <div>
          <span class="mono-num">{{ impact().co2KgAvoided }}</span>
          <span class="label-sm muted">kg de CO₂ évités</span>
        </div>
      </div>
    </section>

    <!-- ── Comment ça marche ────────────────────────────────────── -->
    <section class="shell-lg section">
      <div class="section-head">
        <h2>Trois gestes, aucun intermédiaire</h2>
        <p class="body-md muted" style="max-width:52rem">
          Jarra ne stocke rien, ne livre rien et ne prend rien au passage. La plateforme rend visible ce qui existait
          déjà, et mesure ce qui a été sauvé.
        </p>
      </div>
      <div class="how-grid">
        @for (s of steps; track s.title; let i = $index) {
          <div class="step-card">
            <span class="step-n mono-num">0{{ i + 1 }}</span>
            <span class="ai-ico"><span class="ms ms-24">{{ s.icon }}</span></span>
            <h3>{{ s.title }}</h3>
            <p class="body-sm muted">{{ s.text }}</p>
          </div>
        }
      </div>
    </section>

    <!-- ── Bandeau impact ───────────────────────────────────────── -->
    <section class="shell-lg section-tight">
      <div class="panel-ink impact-band">
        <div>
          <span class="eco-badge" style="background:rgba(255,255,255,.14);border:0;color:#c9f3dd">
            <span class="ms" style="font-size:15px">trending_up</span>Depuis le début de la journée
          </span>
          <h2 style="color:var(--on-primary);margin-top:var(--space-sm)">Ce que la ville a sauvé, en clair</h2>
          <p class="body-md" style="color:var(--on-primary-container);margin-top:var(--space-sm);max-width:46rem">
            Compteurs calculés depuis les retraits validés au comptoir, jamais depuis les réservations.
          </p>
        </div>
        <div class="impact-kpis">
          <div><span class="mono-num">{{ mealsAnim() }}</span><span class="label-sm">repas sauvés</span></div>
          <div><span class="mono-num">{{ co2Anim() }}<em>kg</em></span><span class="label-sm">CO₂ évité</span></div>
          <div><span class="mono-num">{{ tndAnim() }}<em>DT</em></span><span class="label-sm">réinjectés chez les artisans</span></div>
        </div>
        <a class="btn btn-invert" routerLink="/impact"><span class="ms ms-18">public</span>Voir le baromètre public</a>
      </div>
    </section>

    <!-- ── Appel commerçants ────────────────────────────────────── -->
    <section class="shell-lg section-tight">
      <div class="panel-ink cta-band">
        <div>
          <h2 style="color:var(--on-primary)">Transformez vos pertes en revenus, en 10 secondes</h2>
          <p class="body-md" style="color:var(--on-primary-container);margin-top:var(--space-sm);max-width:48rem">
            Publication express, encaissement direct au comptoir, attestation RSE en fin de mois. Aucun frais fixe.
          </p>
        </div>
        <div class="row gap-sm wrap">
          <a class="btn btn-invert" routerLink="/commercant"><span class="ms ms-18">bolt</span>Publier un invendu en 10 s</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero { background: linear-gradient(180deg, var(--surface-container-low) 0%, var(--surface) 100%); padding: var(--space-xl) 0; }
    .hero-grid { display: grid; gap: var(--space-xl); align-items: center; }
    @media (min-width: 1024px) { .hero-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
    .hero-copy { display: grid; gap: var(--space-md); }
    .hero-copy > .eco-badge { justify-self: start; }
    .hero-copy strong { color: var(--primary-container); font-weight: 700; }
    .hero-cta { display: flex; gap: var(--space-sm); flex-wrap: wrap; }

    .hero-fig { position: relative; margin: 0; }
    .hero-fig > img { width: 100%; aspect-ratio: 4 / 3.1; object-fit: cover; border-radius: var(--r-xl); box-shadow: var(--shadow-2); }
    .hero-badge {
      position: absolute; top: var(--space-md); right: var(--space-md);
      background: rgba(1, 45, 29, .88); backdrop-filter: blur(8px); color: var(--on-primary);
      border-radius: var(--r-lg); padding: var(--space-sm) var(--space-md); display: grid; gap: 2px;
    }
    .hero-badge .mono-num { color: #7fe0ae; font-size: 1.25rem; }
    .hero-badge .label-sm { color: #a9c6b8; }
    .hero-note {
      position: absolute; left: var(--space-md); right: var(--space-md); bottom: var(--space-md);
      padding: var(--space-sm) var(--space-md); background: rgba(250, 248, 255, .95); backdrop-filter: blur(10px);
    }
    @media (max-width: 560px) {
      .hero-note { position: static; margin-top: var(--space-md); }
      .hero-badge { top: var(--space-sm); right: var(--space-sm); }
    }

    .strip { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; border-top: 1px solid var(--hairline); border-bottom: 1px solid var(--hairline); }
    @media (min-width: 900px) { .strip { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .strip > div { padding: var(--space-lg) var(--space-md) var(--space-lg) 0; display: grid; gap: 4px; border-right: 1px solid var(--hairline); }
    .strip > div:last-child { border-right: 0; }
    .strip .mono-num { font-size: 2rem; }

    .section { padding: var(--space-xl) 0; }
    .section-tight { padding: var(--space-lg) 0; }
    .section-head { display: grid; gap: var(--space-sm); margin-bottom: var(--space-lg); }

    .how-grid { display: grid; gap: var(--space-md); }
    @media (min-width: 900px) { .how-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .step-card { background: var(--surface-container-lowest); border: 1px solid var(--hairline); border-radius: var(--r-lg); padding: var(--space-lg); display: grid; gap: var(--space-sm); align-content: start; box-shadow: var(--shadow-1); }
    .step-n { font-size: 0.75rem; color: var(--brand-mint-ink); letter-spacing: .1em; }

    .impact-band { display: grid; gap: var(--space-lg); padding: var(--space-xl) var(--gutter-lg); }
    .impact-kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-md); border-top: 1px solid rgba(255,255,255,.16); padding-top: var(--space-md); }
    @media (min-width: 900px) { .impact-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .impact-kpis > div { display: grid; gap: 4px; }
    .impact-kpis .mono-num { font-size: 2.25rem; color: var(--on-primary); }
    .impact-kpis .mono-num em { font-style: normal; font-size: .5em; color: #7fe0ae; margin-left: 6px; }
    .impact-kpis .label-sm { color: #a9c6b8; }

    .cta-band { display: grid; gap: var(--space-lg); align-items: center; padding: var(--space-xl) var(--gutter-lg); }
    @media (min-width: 900px) { .cta-band { grid-template-columns: minmax(0, 1fr) auto; } }
  `],
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  readonly store = inject(CityStore);

  readonly mealsAnim = signal(0);
  readonly co2Anim = signal(0);
  readonly tndAnim = signal('0');

  readonly impact = this.store.impact;
  readonly photo = PHOTOS.hero;

  readonly steps = [
    { icon: 'storefront', title: 'Le commerçant publie', text: 'Photo, quantité, créneau de retrait. Trente secondes entre deux clients, depuis son téléphone.' },
    { icon: 'map', title: 'Le citoyen repère', text: 'La carte affiche les paniers réellement disponibles, leur distance et leur créneau. Le stock se met à jour en direct.' },
    { icon: 'qr_code_2', title: 'Retrait au comptoir', text: 'Un code court à présenter au commerçant, un paiement sur place, puis la notation. Rien d\'autre.' },
  ];

  private animTimer = 0;

  readonly liveCount = computed(() => {
    this.store.version();
    return this.store.baskets().filter((b) => b.status === 'live' && b.quantityLeft > 0).length;
  });

  areasCount(): number {
    return this.store.impact().byArea.length;
  }

  clock(): string {
    return formatClock(this.store.clockMin());
  }

  mealsNow(): number {
    return this.store.impact().mealsSaved;
  }

  ngAfterViewInit(): void {
    this.animateCounters();
  }

  ngOnDestroy(): void {
    window.clearInterval(this.animTimer);
  }

  /** Compte les valeurs d'impact de 0 à leur valeur réelle en ~1.4s. */
  private animateCounters(): void {
    const target = this.store.impact();
    const tndTarget = target.tndSaved;
    const steps = 46;
    let i = 0;
    this.animTimer = window.setInterval(() => {
      i += 1;
      const p = Math.min(1, i / steps);
      const eased = 1 - Math.pow(1 - p, 3);
      this.mealsAnim.set(Math.round(target.mealsSaved * eased));
      this.co2Anim.set(Math.round(target.co2KgAvoided * eased * 10) / 10);
      this.tndAnim.set(formatTnd(Math.round(tndTarget * 1000 * eased)));
      if (p >= 1) window.clearInterval(this.animTimer);
    }, 30);
  }

  /** Ancienne API conservée pour les tests de la jarre. */
  fillY(): number {
    const meals = this.store.impact().mealsSaved;
    const ratio = Math.min(1, meals / 40);
    return 260 - ratio * 150;
  }

  tndSaved(): string {
    return formatTnd(this.store.impact().tndSaved * 1000);
  }
}
