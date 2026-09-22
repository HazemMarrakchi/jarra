import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityStore } from '../core/city.store';
import { formatClock, formatTnd } from '../core/model';
import { KIND_ICON, KIND_LONG, KINDS } from '../core/ui';

@Component({
  selector: 'jr-impact',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <!-- ── Bandeau impact ───────────────────────────────────────── -->
    <section class="impact-hero">
      <div class="shell-lg hero-inner">
        <span class="eco-badge" style="background:rgba(255,255,255,.14);border:0;color:#c9f3dd">
          <span class="ms" style="font-size:15px">public</span>Baromètre public · Gabès
        </span>
        <h1>L'impact collectif de Gabès contre le gaspillage alimentaire</h1>
        <p class="body-lg" style="color:#c9e3d6;max-width:52rem">
          Chiffres calculés depuis les retraits validés au comptoir, jamais depuis les réservations. Une réservation
          annulée ou expirée ne compte pas.
        </p>

        <div class="ikpis">
          <div>
            <span class="mono-num">{{ impact().mealsSaved }}</span>
            <span class="label-sm">repas sauvés aujourd'hui</span>
          </div>
          <div>
            <span class="mono-num">{{ impact().co2KgAvoided }}<em>kg</em></span>
            <span class="label-sm">CO₂ évité</span>
          </div>
          <div>
            <span class="mono-num">{{ tndSaved() }}<em>DT</em></span>
            <span class="label-sm">économisés par les citoyens</span>
          </div>
          <div>
            <span class="mono-num">{{ impact().merchantsActive }}</span>
            <span class="label-sm">commerces actifs</span>
          </div>
        </div>

        <div class="row gap-sm wrap" style="margin-top:var(--space-lg)">
          <a class="btn btn-invert" routerLink="/explorer"><span class="ms ms-18">map</span>Ouvrir la carte interactive</a>
          <a class="btn btn-invert" routerLink="/commercant"><span class="ms ms-18">storefront</span>Inscrire mon commerce</a>
        </div>
      </div>
    </section>

    <div class="shell-lg">
      <!-- ── Filières + territoires ─────────────────────────────── -->
      <div class="pairs">
        <div class="card card-pad">
          <h2 class="headline-sm">Surplus préservés par filière</h2>
          <p class="body-sm muted" style="margin-top:4px">Repas sauvés par type de commerce, du plus fort au plus faible.</p>
          <div class="filiere">
            @for (f of filieres(); track f.kind) {
              <div class="filiere-row">
                <span class="ai-ico" style="width:2.25rem;height:2.25rem"><span class="ms ms-20">{{ icon(f.kind) }}</span></span>
                <div class="grow">
                  <div class="row between">
                    <b class="label-lg">{{ label(f.kind) }}</b>
                    <span class="mono-num">{{ f.meals }}</span>
                  </div>
                  <span class="meter"><i [style.width.%]="f.share"></i></span>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="card card-pad">
          <h2 class="headline-sm">Intensité territoriale</h2>
          <p class="body-sm muted" style="margin-top:4px">Quartiers de Gabès, classés par repas sauvés.</p>
          <div class="rank">
            @for (a of impact().byArea; track a.area; let i = $index) {
              <div class="rank-row">
                <span class="rank-n mono-num">{{ (i + 1) < 10 ? '0' + (i + 1) : (i + 1) }}</span>
                <div class="grow">
                  <b class="label-lg">{{ a.area }}</b>
                  <span class="meter"><i [style.width.%]="areaWidth(a.meals)"></i></span>
                </div>
                <span class="mono-num">{{ a.meals }}</span>
              </div>
            }
            @if (impact().byArea.length === 0) {
              <p class="body-sm muted">Aucun quartier n'a encore enregistré de retrait validé.</p>
            }
          </div>
        </div>
      </div>

      <!-- ── Tendance ───────────────────────────────────────────── -->
      <div class="card card-pad" style="margin-top:var(--space-lg)">
        <div class="row between wrap gap-sm">
          <div>
            <h2 class="headline-sm">Tendance de la semaine</h2>
            <p class="body-sm muted" style="margin-top:4px">Repas sauvés par jour sur la semaine écoulée.</p>
          </div>
          <div class="row gap-sm" style="align-items:center">
            <span class="eco-badge"><span class="ms" style="font-size:14px">trending_up</span>{{ weekTotal() }} sur 7 jours</span>
            <button class="btn btn-ghost btn-sm" type="button" (click)="exportCsv()">
              <span class="ms ms-18">download</span> Open-data (CSV)
            </button>
          </div>
        </div>
        <div class="chart">
          @for (d of trend(); track d.day) {
            <div class="bar-col">
              <span class="bar-val mono-num">{{ d.meals }}</span>
              <span class="bar-track"><span class="bar-fill" [style.height.%]="barHeight(d.meals)"></span></span>
              <span class="bar-day">{{ d.day }}</span>
            </div>
          }
        </div>
        <p class="body-sm muted" style="margin-top:var(--space-sm)">
          Hauteur = repas effectivement retirés et validés. Environ {{ weekCo2() }} kg de CO₂ évités sur la période.
        </p>
      </div>

      <!-- ── Podium ─────────────────────────────────────────────── -->
      <div class="section-head" style="margin-top:var(--space-xl)">
        <h2>Le podium des éco-héros du mois</h2>
        <p class="body-md muted">Les commerces qui ont sorti le plus de repas de la poubelle.</p>
      </div>
      <div class="podium">
        @for (h of podium(); track h.id; let i = $index) {
          <a class="card card-pad card-hover podium-card" [routerLink]="['/boutique', h.id]">
            <span class="medal mono-num">{{ i + 1 }}</span>
            <div class="grow">
              <b class="label-lg">{{ h.name }}</b>
              <p class="body-sm muted">{{ h.area }} · {{ label(h.kind) }}</p>
            </div>
            <div style="text-align:right">
              <span class="mono-num" style="font-size:1.25rem">{{ h.meals }}</span>
              <p class="label-sm muted">repas sauvés</p>
            </div>
          </a>
        }
        @if (podium().length === 0) {
          <div class="empty">
            <span class="ms ms-40">workspace_premium</span>
            <b>Le podium s'ouvre dès les premiers retraits validés.</b>
          </div>
        }
      </div>

      <!-- ── Modèle ─────────────────────────────────────────────── -->
      <div class="section-head" style="margin-top:var(--space-xl)">
        <h2>Pourquoi le modèle sans carte bancaire triomphe</h2>
      </div>
      <div class="why">
        @for (w of why; track w.title) {
          <div class="card card-pad stack gap-xs">
            <span class="ai-ico"><span class="ms ms-24">{{ w.icon }}</span></span>
            <h4>{{ w.title }}</h4>
            <p class="body-sm muted">{{ w.text }}</p>
          </div>
        }
      </div>

      <!-- ── Appel commerçants ──────────────────────────────────── -->
      <div class="panel-ink cta-band" style="margin:var(--space-xl) 0">
        <div>
          <h2 style="color:var(--on-primary)">Vous êtes artisan ou commerçant ?</h2>
          <p class="body-md" style="color:var(--on-primary-container);margin-top:var(--space-sm);max-width:48rem">
            Rejoignez le mouvement en 3 minutes : publication en 10 secondes, paiement direct au comptoir, aucun frais
            fixe.
          </p>
        </div>
        <div class="row gap-sm wrap">
          <a class="btn btn-invert" routerLink="/commercant"><span class="ms ms-18">bolt</span>Publier un invendu en 10 s</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .impact-hero { background: var(--primary-container); color: var(--on-primary); padding: var(--space-xl) 0; }
    .hero-inner { display: grid; gap: var(--space-md); }
    .hero-inner h1 { color: var(--on-primary); }
    .ikpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-md); border-top: 1px solid rgba(255,255,255,.16); padding-top: var(--space-md); }
    @media (min-width: 900px) { .ikpis { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .ikpis > div { display: grid; gap: 4px; }
    .ikpis .mono-num { font-size: 2rem; color: var(--on-primary); }
    .ikpis .mono-num em { font-style: normal; font-size: .5em; color: #7fe0ae; margin-left: 6px; }
    .ikpis .label-sm { color: #a9c6b8; }

    .pairs { display: grid; gap: var(--space-lg); margin-top: var(--space-xl); align-items: start; }
    @media (min-width: 1000px) { .pairs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

    .filiere { display: grid; gap: var(--space-md); margin-top: var(--space-md); }
    .filiere-row { display: flex; align-items: center; gap: var(--space-md); }
    .meter { display: block; height: 6px; border-radius: 3px; background: var(--surface-container-high); overflow: hidden; margin-top: 6px; }
    .meter i { display: block; height: 100%; background: var(--brand-mint); border-radius: 3px; transition: width .8s var(--ease); }

    .rank { display: grid; margin-top: var(--space-md); }
    .rank-row { display: flex; align-items: center; gap: var(--space-md); padding: .6rem 0; border-top: 1px solid var(--hairline); }
    .rank-row:first-child { border-top: 0; }
    .rank-n { font-size: 0.8125rem; color: var(--on-surface-variant); width: 1.5rem; }

    .chart { display: flex; align-items: flex-end; gap: var(--space-sm); height: 13rem; margin-top: var(--space-md); }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; min-width: 0; }
    .bar-val { font-size: 0.6875rem; color: var(--on-surface-variant); }
    .bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; }
    .bar-fill { width: 100%; min-height: 4px; border-radius: 6px 6px 0 0; background: var(--brand-mint); box-shadow: inset 0 0 0 1px rgba(1,45,29,.12); transition: height .8s var(--ease); }
    .bar-day { font-size: 0.6875rem; font-weight: 700; color: var(--on-surface-variant); }

    .podium { display: grid; gap: var(--space-sm); }
    .podium-card { display: flex; align-items: center; gap: var(--space-md); }
    .medal {
      width: 2.25rem; height: 2.25rem; border-radius: 50%; display: grid; place-items: center;
      background: var(--surface-container-high); color: var(--on-surface-variant); font-size: 0.875rem; flex: none;
    }
    .podium-card:first-child .medal { background: var(--secondary-container); color: var(--on-secondary-container); }

    .why { display: grid; gap: var(--space-md); }
    @media (min-width: 900px) { .why { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

    .cta-band { display: grid; gap: var(--space-lg); align-items: center; padding: var(--space-xl) var(--gutter-lg); }
    @media (min-width: 900px) { .cta-band { grid-template-columns: minmax(0, 1fr) auto; } }
  `],
})
export class ImpactComponent {
  private readonly store = inject(CityStore);

  readonly impact = this.store.impact;
  readonly trend = this.store.trend;

  readonly why = [
    { icon: 'account_balance_wallet', title: 'Aucun frais pour le citoyen', text: 'Pas de prélèvement, pas de commission : le prix affiché est le prix payé au comptoir.' },
    { icon: 'storefront', title: 'Aucun frais fixe pour l\'artisan', text: "L'inscription est gratuite et la publication prend dix secondes entre deux clients." },
    { icon: 'verified_user', title: 'Confiance vérifiable', text: 'Chaque chiffre du baromètre provient des retraits validés, jamais d\'une estimation.' },
  ];

  clock(): string {
    return formatClock(this.store.clockMin());
  }

  tndSaved(): string {
    return formatTnd(this.store.impact().tndSaved * 1000);
  }

  icon(kind: string): string {
    return KIND_ICON[kind as keyof typeof KIND_ICON] ?? 'storefront';
  }

  label(kind: string): string {
    return KIND_LONG[kind as keyof typeof KIND_LONG] ?? 'Commerce';
  }

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

  /** Repas sauvés par filière, à partir des retraits validés. */
  readonly filieres = computed(() => {
    this.store.version();
    const orders = this.store.orders().filter((o) => o.status === 'collected');
    const rows = KINDS.map((kind) => {
      const meals = orders.filter((o) => {
        const b = this.store.baskets().find((x) => x.id === o.basketId);
        return b ? this.store.merchant(b.merchantId)?.kind === kind : false;
      }).length;
      return { kind, meals };
    }).filter((r) => r.meals > 0);
    const max = Math.max(...rows.map((r) => r.meals), 1);
    return rows.sort((a, b) => b.meals - a.meals).map((r) => ({ ...r, share: Math.round((r.meals / max) * 100) }));
  });

  /** Classement des commerces par retraits validés. */
  readonly podium = computed(() => {
    this.store.version();
    const orders = this.store.orders().filter((o) => o.status === 'collected');
    return this.store
      .merchants()
      .map((m) => {
        const ids = this.store.basketsOf(m.id).map((b) => b.id);
        return { id: m.id, name: m.name, area: m.area, kind: m.kind, meals: orders.filter((o) => ids.includes(o.basketId)).length };
      })
      .filter((r) => r.meals > 0)
      .sort((a, b) => b.meals - a.meals)
      .slice(0, 3);
  });

  /** Export open-data : indicateurs + quartiers + tendance hebdo en CSV.
   *  Données publiques, réutilisables librement (municipalité, presse, ONG). */
  exportCsv(): void {
    const i = this.impact();
    const lines = [
      'indicateur;valeur',
      `repas_sauves_total;${i.mealsSaved}`,
      `co2_evite_kg;${i.co2KgAvoided}`,
      `economies_tnd;${i.tndSaved.toFixed(3)}`,
      `commerces_actifs;${i.merchantsActive}`,
      '',
      'quartier;repas_sauves',
      ...i.byArea.map((a) => `${a.area};${a.meals}`),
      '',
      'jour;repas_sauves',
      ...this.trend().map((d) => `${d.day};${d.meals}`),
    ];
    // BOM ﻿ pour qu'Excel (FR) lise correctement l'UTF-8 et le « ; ».
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarra-impact-gabes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
