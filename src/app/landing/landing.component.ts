import { AfterViewInit, Component, OnDestroy, inject, signal } from '@angular/core';
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
      <!-- ── hero éditorial ───────────────────────────────────── -->
      <section class="hero">
        <div class="hero-copy rise">
          <span class="eyebrow-line">
            <span class="live-dot" aria-hidden="true"></span>
            En direct à Gabès
          </span>
          <h1>
            Chaque invendu mérite<br />
            <em>une seconde vie.</em>
          </h1>
          <p class="lede">
            Jarra affiche en temps réel les paniers surprises des boulangeries, pâtisseries
            et restaurants de Gabès — jusqu'à <strong>−70&nbsp;%</strong>, à deux pas de chez vous.
            <strong>Un clic, un repas sauvé.</strong>
          </p>
          <div class="cta-row">
            <a class="btn btn-primary btn-lg" routerLink="/explorer">
              Explorer la carte
              <svg viewBox="0 0 24 24" class="cta-arrow" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
            <a class="btn btn-ghost btn-lg" routerLink="/commercant">Je suis commerçant</a>
          </div>
          <div class="proof">
            <div class="avatars" aria-hidden="true">
              <span class="av a1">Y</span><span class="av a2">M</span><span class="av a3">S</span><span class="av a4">+</span>
            </div>
            <p>
              <strong>{{ mealsNow() }} repas sauvés aujourd'hui</strong> par la communauté —
              et la journée ne fait que commencer.
            </p>
          </div>
        </div>

        <!-- mockup produit -->
        <div class="hero-visual rise" aria-hidden="true" style="animation-delay:.15s">
          <div class="blob blob-a"></div>
          <div class="blob blob-b"></div>
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
                <span class="p-me">vous êtes ici</span>
              </div>
              <div class="p-card">
                <jr-food-art kind="bakery" class="p-art" />
                <div class="p-card-body">
                  <strong>Panier du fournil</strong>
                  <span>Médina · −65%</span>
                  <div class="p-price"><b>3.000</b><i>TND</i><s>8.500</s></div>
                </div>
              </div>
              <div class="p-cta">Réserver ce panier</div>
            </div>
          </div>
          <div class="float-chip fc1">🥖 Panier surprise · 3 TND</div>
          <div class="float-chip fc2">🌱 2.5 kg CO₂ évités</div>
          <div class="float-chip fc3">🔔 Nouveau panier à 400 m</div>
        </div>
      </section>
    </div>

    <!-- ── marquee ─────────────────────────────────────────────── -->
    <div class="ticker" aria-hidden="true">
      <div class="ticker-track">
        <span>🥖 Boulangeries de la Médina</span><i>◆</i>
        <span>🍰 Pâtisseries de Chott Salem</span><i>◆</i>
        <span>🍲 Plats du chef au port</span><i>◆</i>
        <span>🫒 Épiceries de l'oasis</span><i>◆</i>
        <span>🏺 Zéro gaspillage, que du goût</span><i>◆</i>
        <span>🥖 Boulangeries de la Médina</span><i>◆</i>
        <span>🍰 Pâtisseries de Chott Salem</span><i>◆</i>
        <span>🍲 Plats du chef au port</span><i>◆</i>
        <span>🫒 Épiceries de l'oasis</span><i>◆</i>
        <span>🏺 Zéro gaspillage, que du goût</span><i>◆</i>
      </div>
    </div>
    <!-- ── bento : comment ça marche ─────────────────────────── -->
    <div class="shell">
      <section class="bento-sec">
        <div class="sec-head rise">
          <span class="eyebrow-line">Comment ça marche</span>
          <h2>Trois gestes.<br /><em>Un repas sauvé.</em></h2>
        </div>

        <div class="bento">
          <div class="b-card card rise wide">
            <div class="b-num">01</div>
            <h3>Explorez la carte en direct</h3>
            <p>
              Les commerçants de Gabès publient leurs invendus en temps réel :
              de la Médina à Chott Salem, chaque pin coloré est un repas qui attend son sauveur.
            </p>
            <div class="mini-map" aria-hidden="true">
              <span class="mm-road"></span>
              <span class="mm-dot a"></span><span class="mm-dot b"></span><span class="mm-dot c"></span>
              <span class="mm-tag">Médina</span><span class="mm-tag t2">L'Oasis</span>
            </div>
          </div>

          <div class="b-card card rise" style="animation-delay:.1s">
            <div class="b-num">02</div>
            <h3>Réservez en 2 clics</h3>
            <p>Choisissez votre panier à −50 à −70&nbsp;% et recevez instantanément votre code de retrait.</p>
            <div class="code-pill" aria-hidden="true">
              <span>A7K2</span>
              <small>votre code</small>
            </div>
          </div>

          <div class="b-card card rise" style="animation-delay:.2s">
            <div class="b-num">03</div>
            <h3>Récupérez &amp; savourez</h3>
            <p>Présentez le code, payez sur place, repartez avec un repas sauvé de la poubelle.</p>
            <div class="leaf-stat" aria-hidden="true">
              <strong>2.5<small> kg</small></strong>
              <span>de CO₂ évités par repas sauvé</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── bande impact ─────────────────────────────────────── -->
      <section class="impact-hero rise">
        <span class="eyebrow-line light">L'impact, en direct</span>
        <h2>La ville jette <em>moins</em>, chaque jour.</h2>
        <div class="big-stats">
          <div class="bs">
            <strong>{{ mealsAnim() }}</strong>
            <span>repas sauvés aujourd'hui</span>
          </div>
          <div class="bs">
            <strong>{{ co2Anim() }}<small>kg</small></strong>
            <span>de CO₂ évités</span>
          </div>
          <div class="bs">
            <strong>{{ tndAnim() }}<small>TND</small></strong>
            <span>économisés par les citoyens</span>
          </div>
        </div>
        <a class="btn btn-primary" routerLink="/impact">Voir le tableau d'impact complet</a>
      </section>
    </div>
  `,
  styles: [`
    /* ── hero ── */
    .hero {
      display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 3rem;
      align-items: center; padding: 4.5rem 0 3.5rem; min-height: 78vh;
    }
    .live-dot {
      width: 8px; height: 8px; border-radius: 50%; background: var(--olive);
      animation: pulse-dot 2s ease-in-out infinite; flex-shrink: 0;
    }
    .hero h1 {
      font-size: clamp(2.6rem, 6vw, 4.6rem);
      line-height: 1.02; font-weight: 700;
      margin: 1.2rem 0 0;
      letter-spacing: -0.02em;
    }
    .hero h1 em {
      font-style: italic; font-weight: 500;
      background: linear-gradient(115deg, #b4552d, #e07b3e 60%, #e5a948);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .lede {
      color: var(--muted); font-size: 1.1rem; line-height: 1.75;
      max-width: 32rem; margin: 1.6rem 0 2.2rem; font-weight: 300;
    }
    .lede strong { color: var(--sand); font-weight: 600; }
    .cta-row { display: flex; gap: 0.8rem; flex-wrap: wrap; }
    .btn-lg { padding: 0.95rem 1.9rem; font-size: 1rem; }
    .cta-arrow { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; transition: transform .2s var(--ease-spring); }
    .btn-primary:hover .cta-arrow { transform: translateX(3px); }

    .proof { display: flex; align-items: center; gap: 0.9rem; margin-top: 2.4rem; }
    .avatars { display: flex; }
    .av {
      width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: 700; color: #fff;
      border: 2px solid var(--bg); margin-left: -8px;
    }
    .av:first-child { margin-left: 0; }
    .av.a1 { background: #d96f36; }
    .av.a2 { background: #4c7a38; }
    .av.a3 { background: #b8862e; }
    .av.a4 { background: #251a10; font-size: 0.62rem; }
    .proof p { margin: 0; font-size: 0.82rem; color: var(--muted); line-height: 1.5; max-width: 22rem; }
    .proof strong { color: var(--sand); }

    /* ── mockup téléphone ── */
    .hero-visual { display: flex; justify-content: center; position: relative; }
    .blob { position: absolute; border-radius: 50%; filter: blur(50px); pointer-events: none; }
    .blob-a { width: 340px; height: 340px; top: 2%; right: 4%; background: rgba(224, 123, 62, .22); animation: breathe 7s ease-in-out infinite; }
    .blob-b { width: 240px; height: 240px; bottom: 6%; left: 2%; background: rgba(143, 191, 111, .2); animation: breathe 8s ease-in-out infinite 1.2s; }
    @keyframes breathe { 50% { transform: scale(1.1); } }

    .phone {
      position: relative; z-index: 2;
      width: min(280px, 68vw);
      border-radius: 40px; padding: 10px;
      background: linear-gradient(160deg, #3d342a, #1c1712 60%);
      border: 1px solid rgba(247, 236, 220, .2);
      box-shadow: 0 50px 90px rgba(60, 40, 20, .4), inset 0 1px 0 rgba(255, 217, 168, .2);
      transform: rotate(2deg);
      transition: transform .4s var(--ease-out);
    }
    .phone:hover { transform: rotate(0deg) scale(1.015); }
    .phone-notch {
      position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
      width: 34%; height: 14px; border-radius: 999px;
      background: #14100b; border: 1px solid rgba(247, 236, 220, .1);
      z-index: 3;
    }
    .phone-screen {
      border-radius: 32px;
      background: radial-gradient(320px 220px at 80% -10%, rgba(217, 111, 54, .1), transparent 60%), #f6f0e4;
      padding: 2.3rem .9rem 1rem;
      display: grid; gap: .7rem;
      overflow: hidden; color: var(--sand);
    }
    .p-head { display: flex; align-items: center; justify-content: space-between; padding: 0 .2rem; }
    .p-brand { display: flex; align-items: center; gap: .4rem; font-family: var(--font-display); font-weight: 700; font-size: .95rem; }
    .p-mark { width: 16px; height: 16px; border-radius: 6px; background: var(--grad-clay); box-shadow: 0 2px 8px rgba(217, 111, 54, .4); }
    .p-city { font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--olive); }

    .p-map {
      position: relative; height: 106px; border-radius: 14px; overflow: hidden;
      background: radial-gradient(140px 90px at 70% 20%, rgba(217, 111, 54, .1), transparent 70%), linear-gradient(160deg, #efe7d6, #e7dcc6);
      border: 1px solid var(--border);
    }
    .p-road { position: absolute; background: rgba(90, 70, 45, .12); border-radius: 4px; }
    .p-road.r1 { left: -6%; right: 30%; top: 46%; height: 8px; transform: rotate(-7deg); }
    .p-road.r2 { top: -10%; bottom: -10%; left: 58%; width: 8px; transform: rotate(9deg); }
    .p-dot { position: absolute; width: 10px; height: 10px; border-radius: 50%; background: var(--clay); box-shadow: 0 0 0 3px rgba(217, 111, 54, .22); animation: pulse-dot 2.2s ease-in-out infinite; }
    .p-dot.d1 { top: 26%; left: 22%; }
    .p-dot.d2 { top: 58%; left: 66%; animation-delay: .5s; }
    .p-dot.d3 { top: 70%; left: 34%; animation-delay: 1s; }
    .p-me { position: absolute; top: 8px; right: 8px; font-size: .58rem; font-weight: 700; color: var(--sand-dim); background: rgba(255, 255, 255, .9); border: 1px solid var(--border); padding: .18rem .45rem; border-radius: 999px; }

    .p-card { display: grid; grid-template-columns: 74px 1fr; gap: .7rem; padding: .6rem; border-radius: 16px; background: #fff; border: 1px solid var(--border); box-shadow: var(--shadow-1); align-items: center; }
    .p-art { border-radius: 12px; overflow: hidden; }
    .p-card-body { display: grid; gap: 2px; }
    .p-card-body strong { font-size: .8rem; font-weight: 600; }
    .p-card-body > span { font-size: .66rem; color: var(--muted); }
    .p-price { display: flex; align-items: baseline; gap: .3rem; margin-top: 2px; }
    .p-price b { font-family: var(--font-display); font-size: 1.02rem; color: var(--clay); }
    .p-price i { font-style: normal; font-size: .58rem; color: var(--muted); }
    .p-price s { font-size: .62rem; color: var(--faint); margin-left: .2rem; }
    .p-cta { text-align: center; padding: .62rem; border-radius: 999px; background: var(--grad-clay); color: #fff; font-size: .76rem; font-weight: 700; box-shadow: var(--shadow-clay); }

    .float-chip {
      position: absolute; z-index: 3;
      display: inline-flex; align-items: center; gap: .4rem;
      font-size: .72rem; font-weight: 600; white-space: nowrap; color: var(--sand);
      background: rgba(255, 255, 255, .94);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      border: 1px solid var(--border-strong);
      padding: .55rem .85rem; border-radius: 999px;
      box-shadow: var(--shadow-2);
      animation: floaty 6s ease-in-out infinite;
    }
    .fc1 { top: 7%; left: -8%; --tilt: -3deg; }
    .fc2 { top: 46%; right: -10%; --tilt: 2deg; animation-delay: 1.8s; }
    .fc3 { bottom: 4%; left: -4%; --tilt: -2deg; animation-delay: 3.2s; }

    /* ── marquee ── */
    .ticker {
      overflow: hidden;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      background: var(--surface-solid);
      padding: 0.85rem 0;
    }
    .ticker-track {
      display: inline-flex; align-items: center; gap: 1.6rem;
      white-space: nowrap;
      animation: marquee 26s linear infinite;
    }
    .ticker span { font-size: 0.82rem; font-weight: 600; color: var(--muted); letter-spacing: 0.02em; }
    .ticker i { color: var(--clay); font-style: normal; font-size: 0.5rem; }

    /* ── bento ── */
    .bento-sec { padding: 4.5rem 0 2.5rem; }
    .sec-head { margin-bottom: 2.2rem; }
    .sec-head h2 { font-size: clamp(1.9rem, 4vw, 3rem); margin-top: 0.8rem; line-height: 1.08; }
    .sec-head h2 em { font-style: italic; font-weight: 500; color: var(--clay); }

    .bento { display: grid; grid-template-columns: 1.25fr 1fr 1fr; gap: 1.1rem; }
    .b-card {
      padding: 1.7rem 1.5rem; overflow: hidden;
      transition: transform 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out);
    }
    .b-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-2); }
    .b-num {
      font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700;
      color: var(--clay); letter-spacing: 0.14em; margin-bottom: 0.9rem;
    }
    .b-card h3 { font-size: 1.2rem; margin-bottom: 0.5rem; }
    .b-card p { color: var(--muted); font-size: 0.92rem; line-height: 1.65; margin: 0 0 1.2rem; font-weight: 300; }

    .mini-map {
      position: relative; height: 120px; border-radius: var(--r-md); overflow: hidden;
      background: radial-gradient(200px 110px at 70% 20%, rgba(217, 111, 54, .08), transparent 70%), linear-gradient(160deg, #efe7d6, #e7dcc6);
      border: 1px solid var(--border);
    }
    .mm-road { position: absolute; left: -5%; right: -5%; top: 55%; height: 10px; background: rgba(90, 70, 45, .12); transform: rotate(-5deg); border-radius: 5px; }
    .mm-dot { position: absolute; width: 12px; height: 12px; border-radius: 50%; background: var(--clay); box-shadow: 0 0 0 4px rgba(217, 111, 54, .2); animation: pulse-dot 2.2s ease-in-out infinite; }
    .mm-dot.a { top: 30%; left: 26%; }
    .mm-dot.b { top: 62%; left: 58%; background: #4c7a38; box-shadow: 0 0 0 4px rgba(76, 122, 56, .2); animation-delay: .6s; }
    .mm-dot.c { top: 40%; left: 76%; background: #b8862e; box-shadow: 0 0 0 4px rgba(184, 134, 46, .2); animation-delay: 1.2s; }
    .mm-tag {
      position: absolute; bottom: 10px; left: 10px;
      font-size: 0.62rem; font-weight: 700; letter-spacing: 0.06em;
      color: var(--sand-dim); background: rgba(255, 255, 255, .92);
      border: 1px solid var(--border); padding: .2rem .5rem; border-radius: 999px;
    }
    .mm-tag.t2 { left: auto; right: 10px; top: 10px; bottom: auto; }

    .code-pill {
      display: inline-flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 0.8rem 1.4rem; border-radius: var(--r-md);
      background: var(--surface-2); border: 1px dashed rgba(217, 111, 54, 0.45);
    }
    .code-pill span { font-family: var(--font-mono); font-size: 1.5rem; font-weight: 700; letter-spacing: 0.28em; color: var(--clay); }
    .code-pill small { font-size: 0.64rem; color: var(--faint); letter-spacing: 0.08em; text-transform: uppercase; }

    .leaf-stat { display: flex; flex-direction: column; gap: 2px; }
    .leaf-stat strong { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--olive); line-height: 1; }
    .leaf-stat strong small { font-size: 0.9rem; }
    .leaf-stat span { font-size: 0.74rem; color: var(--muted); }

    /* ── impact band ── */
    .impact-hero {
      margin: 2.5rem 0 3rem;
      padding: 3.4rem 2rem 3rem;
      border-radius: var(--r-xl);
      text-align: center;
      background:
        radial-gradient(700px 320px at 50% -10%, rgba(255, 255, 255, 0.12), transparent 60%),
        linear-gradient(150deg, #25402e 0%, #1a2f21 60%, #14251a 100%);
      color: #f2ecdf;
      box-shadow: var(--shadow-2);
      position: relative; overflow: hidden;
    }
    .impact-hero::after {
      content: '';
      position: absolute; inset: 0;
      background-image: var(--grain); opacity: .6; pointer-events: none;
    }
    .eyebrow-line.light { color: #cfe3a4; }
    .eyebrow-line.light::before { background: linear-gradient(90deg, #cfe3a4, #8fbf6f); }
    .impact-hero h2 { font-size: clamp(1.7rem, 3.6vw, 2.6rem); color: #f7f1e6; margin: 0.9rem 0 0; position: relative; }
    .impact-hero h2 em { font-style: italic; color: #cfe3a4; }
    .big-stats {
      display: flex; justify-content: center; gap: 3.4rem; flex-wrap: wrap;
      margin: 2.2rem 0 2rem; position: relative;
    }
    .bs { display: flex; flex-direction: column; gap: 4px; }
    .bs strong {
      font-family: var(--font-display); font-weight: 700;
      font-size: clamp(2.2rem, 5vw, 3.4rem); line-height: 1;
      color: #f7f1e6; font-variant-numeric: tabular-nums;
    }
    .bs strong small { font-size: 1.1rem; color: #cfe3a4; margin-left: 3px; }
    .bs span { font-size: 0.78rem; color: rgba(242, 236, 223, 0.65); letter-spacing: 0.04em; }
    .impact-hero .btn { position: relative; }

    /* ── responsive ── */
    @media (max-width: 960px) {
      .hero { grid-template-columns: 1fr; gap: 2.6rem; padding: 2.6rem 0 2.4rem; min-height: 0; }
      .hero-visual { order: 2; }
      .bento { grid-template-columns: 1fr; }
      .big-stats { gap: 1.8rem; }
    }
    @media (max-width: 720px) {
      .fc1 { left: -2%; }
      .fc2 { right: -2%; }
      .fc3 { left: 0; }
      .float-chip { font-size: 0.66rem; }
      .cta-row .btn-lg { width: 100%; }
    }
  `],
})
export class LandingComponent {
  readonly store = inject(CityStore);

  /** Compteurs animés de la bande impact. */
  readonly mealsAnim = signal(0);
  readonly co2Anim = signal(0);
  readonly tndAnim = signal('0');

  private animTimer = 0;

  /** Nombre de repas sauvés en ce moment (source : le moteur). */
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
