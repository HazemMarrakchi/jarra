import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="frame">
      <!-- Barre du haut : desktop -->
      <header class="topbar">
        <a class="brand" routerLink="/" aria-label="Jarra — accueil">
          <span class="mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="26" height="26">
              <path d="M32 10c-3.5 0-6 1.8-6 4 0 1.4.8 2.4 2 3.2-3.6 1.6-6 5.4-6 9.8 0 7 4.5 13.5 8 17.5 1 .9 3 .9 4 0 3.5-4 8-10.5 8-17.5 0-4.4-2.4-8.2-6-9.8 1.2-.8 2-1.8 2-3.2 0-2.2-2.5-4-6-4z" fill="currentColor"/>
              <path d="M24.5 18.5c-2.8-1.8-6.5-.8-7.5 2.2-.9 2.8.8 5.6 3.6 6.4M39.5 18.5c2.8-1.8 6.5-.8 7.5 2.2.9 2.8-.8 5.6-3.6 6.4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="brand-text">
            <strong>Jarra</strong>
            <small>sauvez un repas</small>
          </span>
        </a>
        <nav class="nav" aria-label="Navigation principale">
          <a routerLink="/explorer" routerLinkActive="active">Explorer</a>
          <a routerLink="/impact" routerLinkActive="active">Impact</a>
          <a routerLink="/commercant" routerLinkActive="active">Commerçants</a>
        </nav>
        <a class="btn btn-primary cta" routerLink="/explorer">Trouver un panier</a>
      </header>

      <!-- Contenu -->
      <main class="content">
        <router-outlet></router-outlet>
      </main>

      <!-- Tab bar : mobile -->
      <nav class="tabbar" aria-label="Navigation mobile">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <svg class="t-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19Z"/></svg>
          <span>Accueil</span>
        </a>
        <a routerLink="/explorer" routerLinkActive="active">
          <svg class="t-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5a6 6 0 0 1 6 6c0 4.2-6 11-6 11S6 13.7 6 9.5a6 6 0 0 1 6-6Z"/><circle cx="12" cy="9.5" r="2.2"/></svg>
          <span>Explorer</span>
        </a>
        <a routerLink="/impact" routerLinkActive="active">
          <svg class="t-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 10.5 12 5 20 5c0 7.5-5.5 14-15 14Z"/><path d="M5 19c2.5-5.5 6-9.5 10.5-11.5"/></svg>
          <span>Impact</span>
        </a>
        <a routerLink="/commercant" routerLinkActive="active">
          <svg class="t-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5 5.2 5h13.6L20 8.5M4 8.5v11A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-11M4 8.5h16M9.5 21v-5.5h5V21"/></svg>
          <span>Commerçant</span>
        </a>
      </nav>

      <!-- Footer -->
      <footer class="footer">
        <div class="f-grid">
          <div class="f-brand">
            <div class="f-brand-top">
              <span class="f-mark" aria-hidden="true"></span>
              <strong>Jarra</strong>
            </div>
            <p>Sauvez un repas, sauvez la planète. Une jarra à la fois.</p>
            <span class="f-city">Gabès · Tunisie</span>
          </div>
          <div class="f-col">
            <h4>Explorer</h4>
            <a routerLink="/explorer">La carte live</a>
            <a routerLink="/impact">Impact collectif</a>
          </div>
          <div class="f-col">
            <h4>La plateforme</h4>
            <a routerLink="/commercant">Espace commerçant</a>
            <a href="https://github.com/HazemMarrakchi/jarra" target="_blank" rel="noopener">Code source</a>
          </div>
          <div class="f-col">
            <h4>Contact</h4>
            <a href="https://github.com/HazemMarrakchi" target="_blank" rel="noopener">Hazem Marrakchi</a>
            <span class="f-muted">hello&#64;jarra.tn</span>
          </div>
        </div>
        <div class="f-bottom">
          <span>© 2026 Jarra — conçu et développé à Gabès</span>
          <span>Démonstration : commerçants et données simulés</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .frame { min-height: 100vh; display: flex; flex-direction: column; }

    /* ── topbar flottante (desktop) ──────────────────────────── */
    .topbar {
      position: sticky; top: 12px; z-index: 40;
      display: flex; align-items: center; gap: 1.2rem;
      padding: 0.55rem 1.1rem; max-width: 1200px; width: calc(100% - 2rem);
      margin: 12px auto 0;
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      border: 1px solid var(--border);
      border-radius: 999px;
      box-shadow: 0 8px 30px rgba(60, 40, 20, 0.08);
    }
    .brand { display: flex; align-items: center; gap: 0.65rem; color: var(--sand); }
    .mark {
      width: 42px; height: 42px; border-radius: 14px; color: var(--clay-strong);
      background: linear-gradient(160deg, var(--clay-ghost), transparent);
      border: 1px solid rgba(232, 129, 79, 0.35);
      display: flex; align-items: center; justify-content: center;
      box-shadow: var(--shadow-clay);
    }
    .brand-text { display: flex; flex-direction: column; line-height: 1.05; }
    .brand-text strong { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; }
    .brand-text small { font-size: 0.62rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); }

    .nav { display: flex; gap: 0.35rem; margin-left: auto; }
    .nav a {
      color: var(--muted); font-size: 0.88rem; font-weight: 500;
      padding: 0.5rem 0.95rem; border-radius: 999px;
      transition: all 0.18s var(--ease-out);
    }
    .nav a:hover { color: var(--sand); background: var(--border-soft); }
    .nav a.active { color: #fff; background: var(--grad-clay); font-weight: 600; box-shadow: var(--shadow-clay); }
    .cta { font-size: 0.85rem; padding: 0.6rem 1.2rem; }

    .content { flex: 1; }

    /* ── tab bar (mobile) ─────────────────────────────────────── */
    .tabbar {
      display: none;
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid var(--border);
      box-shadow: 0 -8px 30px rgba(60, 40, 20, 0.08);
      padding: 0.35rem 0.4rem calc(0.35rem + env(safe-area-inset-bottom));
    }
    .tabbar a {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 0.45rem 0.2rem; border-radius: 12px;
      color: var(--muted); font-size: 0.66rem; font-weight: 600;
      letter-spacing: 0.02em; transition: color 0.18s;
      min-height: 48px; justify-content: center;
    }
    .t-ico {
      width: 21px; height: 21px;
      fill: none; stroke: currentColor; stroke-width: 1.8;
      stroke-linecap: round; stroke-linejoin: round;
    }
    .tabbar a.active { color: var(--clay); }

    /* ── footer ──────────────────────────────────────────────── */
    .footer {
      margin-top: 4rem;
      padding: 3rem 1.4rem 2rem;
      border-top: 1px solid var(--border);
      background: var(--surface-solid);
    }
    .f-grid {
      max-width: 1200px; margin: 0 auto;
      display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 2rem;
    }
    .f-brand-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.7rem; }
    .f-mark {
      width: 26px; height: 26px; border-radius: 9px;
      background: var(--grad-clay);
      box-shadow: 0 3px 10px rgba(217, 111, 54, .35);
    }
    .f-brand strong { font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; }
    .f-brand p { color: var(--muted); font-size: 0.85rem; line-height: 1.6; margin: 0 0 0.6rem; max-width: 22rem; font-weight: 300; }
    .f-city {
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--olive);
    }
    .f-col { display: flex; flex-direction: column; gap: 0.55rem; }
    .f-col h4 {
      margin: 0 0 0.3rem; font-size: 0.7rem; font-weight: 700;
      letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint);
      font-family: var(--font-ui);
    }
    .f-col a, .f-muted { color: var(--sand-dim); font-size: 0.85rem; transition: color 0.15s; }
    .f-col a:hover { color: var(--clay); }
    .f-bottom {
      max-width: 1200px; margin: 2.4rem auto 0; padding-top: 1.2rem;
      border-top: 1px solid var(--border-soft);
      display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
      font-size: 0.74rem; color: var(--faint);
    }

    @media (max-width: 860px) {
      .f-grid { grid-template-columns: 1fr 1fr; }
      .f-brand { grid-column: 1 / -1; }
    }
    @media (max-width: 720px) {
      .footer { padding: 2.2rem 1rem 6rem; margin-top: 2.5rem; }
      .f-grid { gap: 1.4rem; }
      .f-bottom { flex-direction: column; gap: 0.3rem; }
    }

    @media (max-width: 720px) {
      .topbar { padding: 0.8rem 1rem; }
      .topbar .nav, .topbar .cta { display: none; }
      .tabbar { display: flex; }
    }
  `],
})
export class AppComponent {}
