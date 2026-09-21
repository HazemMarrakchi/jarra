import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityStore } from '../core/city.store';
import { formatClock, formatTnd } from '../core/model';

@Component({
  selector: 'jr-impact',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="shell">
      <header class="head rise">
        <span class="eyebrow">🌍 Impact collectif · Gabès</span>
        <h1>Ce que la ville a sauvé aujourd'hui</h1>
        <p class="sub">
          Chaque panier réservé et récupéré est comptabilisé ici, en direct.
          Il est <span class="clock">{{ clock() }}</span> en ville.
        </p>
      </header>

      <section class="kpis">
        <div class="kpi card rise">
          <span class="k-ico">🧺</span>
          <strong>{{ impact().mealsSaved }}</strong>
          <span class="k-label">repas sauvés</span>
        </div>
        <div class="kpi card rise" style="animation-delay:.08s">
          <span class="k-ico">🌱</span>
          <strong>{{ impact().co2KgAvoided }}<small>kg</small></strong>
          <span class="k-label">de CO₂ évités</span>
        </div>
        <div class="kpi card rise" style="animation-delay:.16s">
          <span class="k-ico">💰</span>
          <strong>{{ tndSaved() }}<small>TND</small></strong>
          <span class="k-label">économisés par les citoyens</span>
        </div>
        <div class="kpi card rise" style="animation-delay:.24s">
          <span class="k-ico">🏪</span>
          <strong>{{ impact().merchantsActive }}</strong>
          <span class="k-label">commerçants actifs</span>
        </div>
      </section>

      <div class="two-col">
        <section class="card panel rise">
          <h2>Tendance de la semaine</h2>
          <p class="panel-sub">Repas sauvés par jour — le week-end concentre le plus d'invendus.</p>
          <div class="chart" role="img" aria-label="Graphique des repas sauvés par jour">
            @for (d of trend(); track d.day) {
              <div class="bar-col">
                <span class="bar-val">{{ d.meals }}</span>
                <div class="bar-track">
                  <div class="bar-fill" [style.height.%]="barHeight(d.meals)"></div>
                </div>
                <span class="bar-day">{{ d.day }}</span>
              </div>
            }
          </div>
          <p class="panel-foot">
            Total semaine : <strong>{{ weekTotal() }}</strong> repas · soit
            <strong>{{ weekCo2() }} kg</strong> de CO₂ évités.
          </p>
        </section>

        <section class="card panel rise" style="animation-delay:.1s">
          <h2>Classement des quartiers</h2>
          <p class="panel-sub">Les zones qui sauvent le plus, en direct.</p>

          @if (impact().byArea.length === 0) {
            <p class="empty-area">
              Aucun retrait validé pour l'instant — le classement s'animera au premier panier récupéré.
            </p>
          }

          <ol class="ranking">
            @for (a of impact().byArea.slice(0, 7); track a.area; let i = $index) {
              <li [class.top]="i === 0">
                <span class="rank">{{ i + 1 }}</span>
                <span class="area">{{ a.area }}</span>
                <span class="track"><i [style.width.%]="areaWidth(a.meals)"></i></span>
                <span class="meals">{{ a.meals }}</span>
              </li>
            }
          </ol>
        </section>
      </div>

      <section class="cta-band rise">
        <h2>Votre quartier peut être le prochain sur le podium.</h2>
        <p class="sub">Réservez un panier aujourd'hui, et faites grimper votre quartier.</p>
        <a class="btn btn-primary" routerLink="/explorer">🗺️ Voir les paniers disponibles</a>
      </section>
    </div>
  `,
  styles: [`
    .head { padding: 2.2rem 0 1.4rem; text-align: center; }
    .eyebrow {
      display: inline-block; font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--olive); background: var(--olive-ghost);
      border: 1px solid rgba(76, 122, 56, 0.3);
      padding: 0.35rem 0.85rem; border-radius: 999px; margin-bottom: 1rem;
    }
    .head h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); }
    .sub { color: var(--muted); font-weight: 300; margin: 0.6rem auto 0; max-width: 34rem; }
    .clock { color: var(--gold); font-family: var(--font-mono); font-weight: 600; }

    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.4rem; }
    .kpi { padding: 1.3rem 1rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
    .k-ico { font-size: 1.5rem; }
    .kpi strong {
      font-family: var(--font-display); font-size: 2.1rem; font-weight: 700;
      color: var(--clay-strong); font-variant-numeric: tabular-nums; line-height: 1;
    }
    .kpi strong small { font-size: 0.9rem; margin-left: 2px; color: var(--sand-dim); }
    .k-label { font-size: 0.76rem; color: var(--faint); }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
    .panel { padding: 1.4rem; }
    .panel h2 { font-size: 1.15rem; }
    .panel-sub { color: var(--muted); font-size: 0.84rem; font-weight: 300; margin: 0.35rem 0 1.3rem; }
    .panel-foot { font-size: 0.82rem; color: var(--muted); margin: 1.2rem 0 0; }
    .panel-foot strong { color: var(--olive); }

    .chart { display: flex; align-items: flex-end; gap: 0.5rem; height: 180px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.35rem; height: 100%; }
    .bar-val { font-size: 0.68rem; color: var(--faint); font-variant-numeric: tabular-nums; }
    .bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; border-radius: 6px; background: var(--border-soft); overflow: hidden; }
    .bar-fill {
      width: 100%; border-radius: 6px 6px 0 0;
      background: linear-gradient(180deg, var(--clay-strong), var(--clay-deep));
      transition: height 0.8s var(--ease-out);
    }
    .bar-day { font-size: 0.7rem; color: var(--muted); font-weight: 600; }

    .ranking { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.55rem; }
    .ranking li { display: grid; grid-template-columns: 22px 1fr 90px 34px; align-items: center; gap: 0.6rem; font-size: 0.85rem; }
    .rank { font-family: var(--font-display); font-weight: 700; color: var(--faint); text-align: center; }
    .ranking li.top .rank { color: var(--gold); }
    .ranking li.top .area { color: var(--sand); font-weight: 600; }
    .area { color: var(--sand-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .track { height: 7px; border-radius: 4px; background: var(--border-soft); overflow: hidden; }
    .track i {
      display: block; height: 100%; border-radius: 4px;
      background: linear-gradient(90deg, var(--olive-deep), var(--olive));
      transition: width 0.8s var(--ease-out);
    }
    .meals { text-align: right; color: var(--sand); font-weight: 600; font-variant-numeric: tabular-nums; }
    .empty-area { color: var(--faint); font-size: 0.85rem; font-style: italic; }

    .cta-band {
      margin: 1.4rem 0 2rem; padding: 2.2rem 1.6rem; text-align: center;
      border-radius: var(--r-xl);
      background: radial-gradient(600px 300px at 50% 0%, rgba(232, 129, 79, 0.1), transparent 70%), var(--surface);
      border: 1px solid rgba(232, 129, 79, 0.25);
    }
    .cta-band h2 { font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
    .cta-band .btn { margin-top: 1.3rem; }

    @media (max-width: 900px) {
      .kpis { grid-template-columns: 1fr 1fr; }
      .two-col { grid-template-columns: 1fr; }
    }
    @media (max-width: 520px) {
      .kpi strong { font-size: 1.7rem; }
      .chart { height: 150px; gap: 0.35rem; }
      .ranking li { grid-template-columns: 20px 1fr 60px 30px; }
    }
  `],
})
export class ImpactComponent {
  private readonly store = inject(CityStore);

  readonly impact = this.store.impact;
  readonly trend = this.store.trend;

  clock(): string { return formatClock(this.store.clockMin()); }
  tndSaved(): string { return formatTnd(this.store.impact().tndSaved * 1000); }

  private maxMeals(): number {
    return Math.max(...this.trend().map((d) => d.meals), 1);
  }

  barHeight(meals: number): number {
    return Math.round((meals / this.maxMeals()) * 100);
  }

  private maxArea(): number {
    const areas = this.impact().byArea;
    return areas.length ? Math.max(...areas.map((a) => a.meals)) : 1;
  }

  areaWidth(meals: number): number {
    return Math.round((meals / this.maxArea()) * 100);
  }

  readonly weekTotal = computed(() => this.trend().reduce((sum, d) => sum + d.meals, 0));
  readonly weekCo2 = computed(() => Math.round(this.weekTotal() * 2.5));
}
