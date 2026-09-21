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
    </div>
  `,
  styles: [`
    .frame { min-height: 100vh; display: flex; flex-direction: column; }

    /* ── topbar (desktop) ─────────────────────────────────────── */
    .topbar {
      display: flex; align-items: center; gap: 1.2rem;
      padding: 0.9rem 1.4rem; max-width: 1200px; width: 100%;
      margin: 0 auto;
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

    @media (max-width: 720px) {
      .topbar { padding: 0.8rem 1rem; }
      .topbar .nav, .topbar .cta { display: none; }
      .tabbar { display: flex; }
    }
  `],
})
export class AppComponent {}
