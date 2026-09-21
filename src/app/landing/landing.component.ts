import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityStore } from '../core/city.store';
import { FoodArtComponent } from '../core/food-art.component';
import { formatTnd } from '../core/model';

@Component({
  selector: 'jr-landing',
  standalone: true,
  imports: [RouterLink, FoodArtComponent],
  template: `
    <div class="shell">
      <!-- ── hero ─────────────────────────────────────────────── -->
      <section class="hero">
        <div class="hero-text rise">
          <span class="eyebrow">🇹🇳 La plateforme anti-gaspillage · Gabès</span>
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

        <!-- Visuel produit : téléphone avec panier live -->
        <div class="hero-visual rise" aria-hidden="true">
          <div class="scene">
            <div class="halo"></div>

            <!-- téléphone -->
            <div class="phone">
              <div class="phone-notch"></div>
              <div class="phone-screen">
                <div class="p-head">
                  <span class="p-brand"><span class="p-mark"></span>Jarra</span>
                  <span class="p-city">Gabès</span>
                </div>
                <div class="p-map">
                  <span class="p-road r1"></span>
                  <span class="p-road r2"></span>
                  <span class="p-dot d1"></span>
                  <span class="p-dot d2"></span>
                  <span class="p-dot d3"></span>
                  <span class="p-me">📍 vous</span>
                </div>
                <div class="p-card">
                  <jr-food-art kind="bakery" class="p-art" />
                  <div class="p-card-body">
                    <strong>Panier du fournil</strong>
                    <span>Médina · −65%</span>
                    <div class="p-price">
                      <b>3.000</b><i>TND</i>
                      <s>8.500</s>
                    </div>
                  </div>
                </div>
                <div class="p-cta">Réserver ce panier</div>
              </div>
            </div>

            <!-- cartes flottantes -->
            <div class="float-chip fc1">🥖 Panier surprise · 3 TND</div>
            <div class="float-chip fc2">🌍 2.5 kg CO₂ évités</div>
            <div class="float-chip fc3">🔔 Nouveau panier à 400 m</div>
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
          Chaque panier réservé est comptabilisé dans l'impact collectif de Gabès —
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
      border: 1px solid rgba(76, 122, 56, 0.3);
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

    /* ── visuel produit : téléphone + flottantes ── */
    .hero-visual { display: flex; justify-content: center; }
    .scene { position: relative; width: min(300px, 72vw); }
    .halo {
      position: absolute; inset: -12% -18%;
      background:
        radial-gradient(closest-side, rgba(232, 129, 79, .25), transparent 70%),
        radial-gradient(closest-side at 70% 70%, rgba(229, 180, 92, .12), transparent 70%);
      filter: blur(18px);
      animation: breathe 6s ease-in-out infinite;
    }
    @keyframes breathe { 50% { transform: scale(1.06); opacity: .8; } }

    .phone {
      position: relative;
      border-radius: 38px;
      padding: 10px;
      background: linear-gradient(160deg, #3a3227, #191510 60%);
      border: 1px solid rgba(247, 236, 220, .22);
      box-shadow:
        0 40px 80px rgba(0, 0, 0, .55),
        inset 0 1px 0 rgba(255, 217, 168, .18);
    }
    .phone-notch {
      position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
      width: 34%; height: 14px; border-radius: 999px;
      background: #100e0b; border: 1px solid rgba(247, 236, 220, .12);
      z-index: 2;
    }
    .phone-screen {
      border-radius: 30px;
      background:
        radial-gradient(320px 220px at 80% -10%, rgba(217, 111, 54, .1), transparent 60%),
        #f6f0e4;
      padding: 2.2rem .9rem 1rem;
      display: grid; gap: .7rem;
      overflow: hidden;
      color: var(--sand);
    }

    .p-head { display: flex; align-items: center; justify-content: space-between; padding: 0 .2rem; }
    .p-brand { display: flex; align-items: center; gap: .4rem; font-family: var(--font-display); font-weight: 700; font-size: .95rem; }
    .p-mark {
      width: 16px; height: 16px; border-radius: 6px;
      background: var(--grad-clay);
      box-shadow: 0 2px 8px rgba(232, 129, 79, .5);
    }
    .p-city { font-size: .68rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--olive); }

    .p-map {
      position: relative; height: 108px; border-radius: 14px; overflow: hidden;
      background:
        radial-gradient(140px 90px at 70% 20%, rgba(217, 111, 54, .1), transparent 70%),
        linear-gradient(160deg, #efe7d6, #e7dcc6);
      border: 1px solid var(--border);
    }
    .p-road { position: absolute; background: rgba(90, 70, 45, .12); border-radius: 4px; }
    .p-road.r1 { left: -6%; right: 30%; top: 46%; height: 8px; transform: rotate(-7deg); }
    .p-road.r2 { top: -10%; bottom: -10%; left: 58%; width: 8px; transform: rotate(9deg); }
    .p-dot {
      position: absolute; width: 10px; height: 10px; border-radius: 50%;
      background: var(--clay-bright); box-shadow: 0 0 0 3px rgba(232, 129, 79, .25);
      animation: pulse-dot 2.2s ease-in-out infinite;
    }
    .p-dot.d1 { top: 26%; left: 22%; }
    .p-dot.d2 { top: 58%; left: 66%; animation-delay: .5s; }
    .p-dot.d3 { top: 70%; left: 34%; animation-delay: 1s; }
    .p-me {
      position: absolute; top: 8px; right: 8px;
      font-size: .58rem; font-weight: 700; color: var(--sand-dim);
      background: rgba(255, 255, 255, .9); border: 1px solid var(--border);
      padding: .18rem .45rem; border-radius: 999px;
    }

    .p-card {
      display: grid; grid-template-columns: 74px 1fr; gap: .7rem;
      padding: .6rem; border-radius: 16px;
      background: #fff;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-1);
      align-items: center;
    }
    .p-art { border-radius: 12px; overflow: hidden; }
    .p-card-body { display: grid; gap: 2px; }
    .p-card-body strong { font-size: .8rem; font-weight: 600; }
    .p-card-body > span { font-size: .66rem; color: var(--muted); }
    .p-price { display: flex; align-items: baseline; gap: .3rem; margin-top: 2px; }
    .p-price b { font-family: var(--font-display); font-size: 1.02rem; color: var(--clay-strong); }
    .p-price i { font-style: normal; font-size: .58rem; color: var(--muted); }
    .p-price s { font-size: .62rem; color: var(--faint); margin-left: .2rem; }

    .p-cta {
      text-align: center; padding: .62rem; border-radius: 999px;
      background: var(--grad-clay); color: #22100a;
      font-size: .76rem; font-weight: 700;
      box-shadow: 0 6px 18px rgba(232, 129, 79, .35);
    }

    .float-chip {
      position: absolute;
      display: inline-flex; align-items: center; gap: .4rem;
      font-size: .72rem; font-weight: 600; white-space: nowrap; color: var(--sand);
      background: rgba(255, 255, 255, .92);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      border: 1px solid var(--border-strong);
      padding: .5rem .8rem; border-radius: 999px;
      box-shadow: var(--shadow-2);
      animation: floaty 6s ease-in-out infinite;
    }
    .fc1 { top: 8%; left: -22%; --tilt: -3deg; }
    .fc2 { top: 44%; right: -26%; --tilt: 2deg; animation-delay: 1.8s; }
    .fc3 { bottom: 6%; left: -14%; --tilt: -2deg; animation-delay: 3.2s; }

    @media (max-width: 860px) {
      .scene { width: min(250px, 64vw); }
      .fc1 { left: -6%; }
      .fc2 { right: -8%; }
      .fc3 { left: -4%; }
      .float-chip { font-size: .64rem; }
    }

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
        radial-gradient(600px 300px at 50% 0%, rgba(76, 122, 56, 0.09), transparent 70%),
        var(--surface);
      border: 1px solid rgba(76, 122, 56, 0.22);
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
