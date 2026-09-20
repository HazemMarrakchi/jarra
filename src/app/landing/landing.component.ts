import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityStore } from '../core/city.store';
import { formatTnd } from '../core/model';

@Component({
  selector: 'jr-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="shell">
      <!-- ── hero ─────────────────────────────────────────────── -->
      <section class="hero">
        <div class="hero-text rise">
          <span class="eyebrow">🇹🇳 La plateforme anti-gaspillage · Tunis</span>
          <h1>La bonne nourriture<br />mérite une <em>seconde vie</em>.</h1>
          <p class="lede">
            Chaque soir, les boulangeries, pâtisseries et restaurants de votre ville jettent
            des invendus parfaits. Jarra les affiche sur la carte, à −70&nbsp;%, et vous les
            récupérez en chemin. <strong>Un clic. Un repas sauvé.</strong>
          </p>
          <div class="hero-cta">
            <a class="btn btn-primary btn-lg" routerLink="/explorer">🗺️ Voir la carte live</a>
            <a class="btn btn-ghost btn-lg" routerLink="/commercant">Je suis commerçant</a>
          </div>
          <div class="hero-stats">
            <div class="stat">
              <strong>{{ store.impact().mealsSaved }}</strong>
              <span>repas sauvés aujourd'hui</span>
            </div>
            <div class="stat">
              <strong>{{ store.impact().co2KgAvoided }}&nbsp;kg</strong>
              <span>de CO₂ évités</span>
            </div>
            <div class="stat">
              <strong>{{ tndSaved() }}&nbsp;TND</strong>
              <span>économisés par les citoyens</span>
            </div>
          </div>
        </div>

        <!-- Visuel : la jarra qui se remplit -->
        <div class="hero-visual rise" aria-hidden="true">
          <div class="jarra-scene">
            <div class="glow"></div>
            <svg viewBox="0 0 200 260" class="jarra-svg">
              <defs>
                <linearGradient id="clayBody" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#f0955f" />
                  <stop offset="1" stop-color="#8f3f20" />
                </linearGradient>
                <clipPath id="jarClip">
                  <path d="M100 30c-14 0-24 7-24 16 0 5.5 3.2 9.6 8 12.8-14.4 6.4-24 21.6-24 39.2 0 28 18 54 32 70 4 3.6 12 3.6 16 0 14-16 32-42 32-70 0-17.6-9.6-32.8-24-39.2 4.8-3.2 8-7.3 8-12.8 0-9-10-16-24-16z" />
                </clipPath>
              </defs>
              <path d="M100 30c-14 0-24 7-24 16 0 5.5 3.2 9.6 8 12.8-14.4 6.4-24 21.6-24 39.2 0 28 18 54 32 70 4 3.6 12 3.6 16 0 14-16 32-42 32-70 0-17.6-9.6-32.8-24-39.2 4.8-3.2 8-7.3 8-12.8 0-9-10-16-24-16z"
                fill="none" stroke="#e8814f" stroke-width="3" opacity="0.9" />
              <path d="M66 62c-13-8-30-3-34 11-4 13 4 26 17 30M134 62c13-8 30-3 34 11 4 13-4 26-17 30"
                fill="none" stroke="#e8814f" stroke-width="4" stroke-linecap="round" opacity="0.65" />
              <g clip-path="url(#jarClip)">
                <rect class="fill-wave" x="0" [attr.y]="fillY()" width="200" height="260" fill="url(#clayBody)" opacity="0.85" />
              </g>
              <g stroke="#f7e8d3" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0.95">
                <path d="M100 96v44" />
                <path d="M100 104l-12-9M100 104l12-9M100 118l-12-9M100 118l12-9M100 132l-12-9M100 132l12-9" />
              </g>
            </svg>
            <div class="orbit-chip oc1">🥖 3 TND</div>
            <div class="orbit-chip oc2">🍰 5.5 TND</div>
            <div class="orbit-chip oc3">🍲 6 TND</div>
          </div>
        </div>
      </section>
      <!-- ── comment ça marche ────────────────────────────────── -->
      <section class="how">
        <h2>Trois gestes, un repas sauvé</h2>
        <p class="sub">Pas d'inscription compliquée, pas de paiement en ligne — la simplicité d'abord.</p>
        <div class="steps">
          <div class="step rise">
            <span class="n">1</span>
            <div class="body">
              <h3>Explorez la carte</h3>
              <p>Les commerçants de votre quartier publient leurs invendus du jour en direct : boulangeries, pâtisseries, restaurants, épiceries.</p>
            </div>
          </div>
          <div class="step rise" style="animation-delay:.12s">
            <span class="n">2</span>
            <div class="body">
              <h3>Réservez en 2 clics</h3>
              <p>Choisissez votre panier surprise à −50 à −70&nbsp;%. Vous recevez instantanément un code de retrait unique.</p>
            </div>
          </div>
          <div class="step rise" style="animation-delay:.24s">
            <span class="n">3</span>
            <div class="body">
              <h3>Récupérez &amp; savourez</h3>
              <p>Présentez votre code au commerçant, payez sur place, et repartez avec un repas sauvé de la poubelle.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ── bandeau impact ───────────────────────────────────── -->
      <section class="impact-band rise">
        <h2>Ensemble, la ville jette <em style="color:var(--olive)">moins</em>.</h2>
        <p class="sub">
          Chaque panier réservé est comptabilisé dans l'impact collectif de Tunis —
          repas sauvés, CO₂ évité, dinars réinjectés dans l'économie locale.
        </p>
        <a class="btn btn-primary" routerLink="/impact">🌍 Découvrir l'impact en direct</a>
      </section>
    </div>
  `,
  styles: [`
    .hero {
      display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 3rem;
      align-items: center; padding: 3.5rem 0 3rem; min-height: 72vh;
    }
    .eyebrow {
      display: inline-block; font-size: 0.74rem; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--olive); background: var(--olive-ghost);
      border: 1px solid rgba(168, 185, 127, 0.3);
      padding: 0.35rem 0.85rem; border-radius: 999px; margin-bottom: 1.4rem;
    }
    .hero h1 { font-size: clamp(2.4rem, 5.2vw, 4rem); line-height: 1.04; font-weight: 700; }
    .hero h1 em {
      font-style: italic; font-weight: 500;
      background: linear-gradient(120deg, var(--clay-strong), var(--gold));
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .lede { color: var(--muted); font-size: 1.06rem; line-height: 1.7; max-width: 34rem; margin: 1.4rem 0 2rem; font-weight: 300; }
    .lede strong { color: var(--sand); font-weight: 600; }
    .hero-cta { display: flex; gap: 0.8rem; flex-wrap: wrap; }
    .btn-lg { padding: 0.9rem 1.8rem; font-size: 1rem; }
    .hero-stats {
      display: flex; gap: 2.4rem; margin-top: 2.6rem;
      padding-top: 1.6rem; border-top: 1px solid var(--border-soft);
    }
    .stat { display: flex; flex-direction: column; gap: 2px; }
    .stat strong {
      font-family: var(--font-display); font-size: 1.7rem; font-weight: 700;
      color: var(--clay-strong); font-variant-numeric: tabular-nums;
    }
    .stat span { font-size: 0.76rem; color: var(--faint); letter-spacing: 0.02em; }

    /* ── visuel jarra ── */
    .hero-visual { display: flex; justify-content: center; }
    .jarra-scene { position: relative; width: min(340px, 78vw); }
    .glow {
      position: absolute; inset: 8%; border-radius: 50%;
      background: radial-gradient(circle, rgba(232, 129, 79, 0.22), transparent 65%);
      filter: blur(10px); animation: breathe 5s ease-in-out infinite;
    }
    @keyframes breathe { 50% { transform: scale(1.08); opacity: 0.75; } }
    .jarra-svg { position: relative; width: 100%; display: block; }
    .fill-wave { transition: y 1.2s var(--ease-out); }
    .orbit-chip {
      position: absolute; font-size: 0.78rem; font-weight: 600;
      background: var(--surface); border: 1px solid var(--border);
      padding: 0.4rem 0.8rem; border-radius: 999px; box-shadow: var(--shadow-2);
      animation: float 6s ease-in-out infinite;
    }
    .oc1 { top: 16%; left: -6%; animation-delay: 0s; }
    .oc2 { top: 42%; right: -9%; animation-delay: 1.6s; }
    .oc3 { bottom: 14%; left: -2%; animation-delay: 3.1s; }
    @keyframes float { 50% { transform: translateY(-10px); } }

    /* ── sections "comment ça marche" & impact ── */
    .how { padding: 3rem 0; }
    .how h2, .impact-band h2 { font-size: clamp(1.6rem, 3vw, 2.2rem); text-align: center; }
    .how .sub, .impact-band .sub { text-align: center; color: var(--muted); margin: 0.6rem auto 2.4rem; max-width: 32rem; font-weight: 300; }
    .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; }
    .step {
      padding: 1.6rem 1.4rem; border-radius: var(--r-lg);
      background: var(--surface); border: 1px solid var(--border-soft);
      transition: transform 0.25s var(--ease-out), border-color 0.25s;
    }
    .step:hover { transform: translateY(-4px); border-color: rgba(232, 129, 79, 0.35); }
    .step .n {
      font-family: var(--font-display); font-size: 2rem; font-weight: 700;
      color: var(--clay-strong); opacity: 0.9;
    }
    .step h3 { font-size: 1.05rem; margin: 0.6rem 0 0.45rem; }
    .step p { color: var(--muted); font-size: 0.9rem; line-height: 1.6; margin: 0; font-weight: 300; }

    .impact-band {
      margin: 2rem 0 3rem; padding: 2.6rem 1.6rem; border-radius: var(--r-xl);
      background:
        radial-gradient(600px 300px at 50% 0%, rgba(168, 185, 127, 0.09), transparent 70%),
        var(--surface);
      border: 1px solid rgba(168, 185, 127, 0.22);
      text-align: center;
    }
    .impact-band .btn { margin-top: 1.6rem; }

    @media (max-width: 860px) {
      .hero { grid-template-columns: 1fr; gap: 2rem; padding: 2.2rem 0 2rem; min-height: 0; text-align: center; }
      .hero-cta { justify-content: center; }
      .hero-stats { justify-content: center; gap: 1.6rem; flex-wrap: wrap; }
      .hero-visual { order: -1; }
      .jarra-scene { width: min(230px, 60vw); }
      .steps { grid-template-columns: 1fr; }
      .step { display: flex; gap: 1rem; align-items: baseline; }
      .step .body { flex: 1; }
    }
  `],
})
export class LandingComponent {
  readonly store = inject(CityStore);

  /** Hauteur de remplissage de la jarra, pilotée par l'impact réel. */
  fillY(): number {
    const meals = this.store.impact().mealsSaved;
    const ratio = Math.min(1, meals / 40);
    return 260 - ratio * 150; // de vide (260) à presque plein (110)
  }

  tndSaved(): string {
    return formatTnd(this.store.impact().tndSaved * 1000);
  }
}
