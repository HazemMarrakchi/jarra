// ═══════════════════════════════════════════════════════════════════
// JARRA — Page de connexion (verrou global de l'app)
// Première page vue par tout visiteur : sans session OTP validée, le
// authGuard redirige TOUTES les routes ici. Une seule connexion sert
// ensuite partout : réserver, publier (espace commerçant), /admin.
// ═══════════════════════════════════════════════════════════════════

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CityStore } from '../core/city.store';

@Component({
  selector: 'jr-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="auth">
      <!-- ── Panneau marque (desktop) ──────────────────────────────── -->
      <aside class="auth-side">
        <div class="side-inner">
          <div class="side-brand">
            <svg class="side-mark" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="currentColor"
                d="M18.5 5.5h11v3.2c0 2.1-1 3.6-2.7 4.7 5.9 2.6 9.7 8.1 9.7 14.5C36.5 36.4 30.3 42.5 24 42.5S11.5 36.4 11.5 27.9c0-6.4 3.8-11.9 9.7-14.5-1.7-1.1-2.7-2.6-2.7-4.7V5.5Z"
              />
              <path fill="#012d1d" fill-opacity=".45" d="M16.5 25.2c4.6 2.1 10.4 2.1 15 0v1.8c-4.6 2.1-10.4 2.1-15 0Z" />
            </svg>
            <span>Jarra<i>.tn</i></span>
          </div>
          <h1 class="side-title">La bonne nourriture<br />ne se jette pas.</h1>
          <p class="side-sub">
            Les invendus des artisans de Gabès, visibles en temps réel —
            réservés en deux minutes, payés au comptoir.
          </p>
          <ul class="side-points">
            <li>
              <span class="ms">bolt</span>
              <div>
                <strong>Réservation instantanée</strong>
                <span>Un code de retrait unique, valable le jour même.</span>
              </div>
            </li>
            <li>
              <span class="ms">eco</span>
              <div>
                <strong>Zéro gaspillage</strong>
                <span>Chaque panier sauvé compte dans le bilan de la ville.</span>
              </div>
            </li>
            <li>
              <span class="ms">storefront</span>
              <div>
                <strong>Commerçants de quartier</strong>
                <span>Boulangeries, pâtisseries, primeurs et traiteurs de Gabès.</span>
              </div>
            </li>
          </ul>
          <p class="side-foot">Pilote citoyen — Gabès · Tunisie</p>
        </div>
      </aside>

      <!-- ── Formulaire ─────────────────────────────────────────────── -->
      <div class="auth-main">
        <div class="auth-card">
          <div class="card-brand">
            <svg class="card-mark" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="currentColor"
                d="M18.5 5.5h11v3.2c0 2.1-1 3.6-2.7 4.7 5.9 2.6 9.7 8.1 9.7 14.5C36.5 36.4 30.3 42.5 24 42.5S11.5 36.4 11.5 27.9c0-6.4 3.8-11.9 9.7-14.5-1.7-1.1-2.7-2.6-2.7-4.7V5.5Z"
              />
            </svg>
            <span>Jarra<i>.tn</i></span>
          </div>

          @if (store.mode !== 'live') {
            <span class="pill pill-eco"><span class="ms ms-18">science</span>Mode démo</span>
            <h2 class="card-title">Bienvenue sur Jarra</h2>
            <p class="card-sub">
              Les données sont simulées localement — aucune connexion requise
              pour explorer le pilote.
            </p>
            <a class="btn btn-primary btn-block" routerLink="/">
              <span class="ms ms-18">east</span>Explorer la démo
            </a>
          } @else {
            <div class="steps" aria-hidden="true">
              <span class="step" [class.on]="!otpSent()" [class.done]="otpSent()">
                <span class="ms ms-18">{{ otpSent() ? 'check_circle' : 'phone_iphone' }}</span>Numéro
              </span>
              <span class="step-line"></span>
              <span class="step" [class.on]="otpSent()">
                <span class="ms ms-18">pin</span>Code SMS
              </span>
            </div>

            <h2 class="card-title">{{ otpSent() ? 'Vérifiez votre numéro' : 'Connexion' }}</h2>
            <p class="card-sub">
              {{
                otpSent()
                  ? 'Saisissez le code à 6 chiffres envoyé au ' + phoneInput + '.'
                  : 'Un code SMS unique suffit — la même session sert à réserver, publier et administrer.'
              }}
            </p>
            @if (!otpSent()) {
              <div class="field">
                <label for="phoneIn">Numéro de téléphone</label>
                <input
                  id="phoneIn" class="input" type="tel" inputmode="tel" name="phoneInput"
                  placeholder="+216 20 000 000" autocomplete="tel" [(ngModel)]="phoneInput"
                  (keyup.enter)="requestCode()"
                />
                <p class="hint">Format international : « +216 » suivi du numéro.</p>
              </div>
              <button
                class="btn btn-primary btn-block" type="button"
                [disabled]="busy()" (click)="requestCode()"
              >
                <span class="ms ms-18">{{ busy() ? 'hourglass_top' : 'sms' }}</span>
                {{ busy() ? 'Envoi en cours…' : 'Recevoir le code par SMS' }}
              </button>
            } @else {
              <div class="field">
                <label for="otpIn">Code à 6 chiffres</label>
                <input
                  id="otpIn" class="input code-input" type="text" inputmode="numeric" name="otpInput"
                  maxlength="6" placeholder="••••••" autocomplete="one-time-code" [(ngModel)]="otpInput"
                  (keyup.enter)="verifyCode()"
                />
              </div>
              <button
                class="btn btn-primary btn-block" type="button"
                [disabled]="otpInput.trim().length < 6 || busy()" (click)="verifyCode()"
              >
                <span class="ms ms-18">{{ busy() ? 'hourglass_top' : 'lock_open' }}</span>
                {{ busy() ? 'Vérification…' : 'Valider et entrer' }}
              </button>
              <button class="link-btn" type="button" (click)="otpSent.set(false); msg.set(null)">
                <span class="ms ms-18">arrow_back</span>Changer de numéro
              </button>
            }

            @if (msg(); as m) {
              <p class="msg" role="status" [class.ok]="msgOk()">
                <span class="ms ms-18">{{ msgOk() ? 'mark_email_read' : 'error' }}</span>{{ m }}
              </p>
            }

            <p class="secure">
              <span class="ms ms-18">lock</span>Connexion chiffrée — aucun mot de passe à retenir.
            </p>
          }
        </div>
        <p class="auth-legal">Paiement au comptoir · Aucun frais en ligne · © 2026 Jarra.tn</p>
      </div>
    </section>
  `,
  styles: [
    `
    :host { display: block; }
    .auth {
      display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
      min-height: calc(100dvh - 4.25rem);
    }

    /* ── panneau marque ─────────────────────────────────────────── */
    .auth-side {
      position: relative; overflow: hidden; color: #fff;
      display: flex; align-items: center;
      padding: var(--space-xl) clamp(2rem, 5vw, 4.5rem);
      background:
        radial-gradient(42rem 30rem at 88% -12%, rgba(82, 183, 136, .30), transparent 60%),
        radial-gradient(30rem 24rem at -12% 112%, rgba(217, 119, 54, .20), transparent 55%),
        linear-gradient(158deg, #012d1d 0%, #1b4332 55%, #2d6a4f 100%);
    }
    .side-inner { max-width: 30rem; }
    .side-brand {
      display: flex; align-items: center; gap: .65rem;
      font-family: var(--font-display); font-weight: 700; font-size: 1.3rem; letter-spacing: -.01em;
    }
    .side-brand i, .card-brand i { font-style: normal; color: var(--brand-mint); }
    .side-mark { width: 40px; height: 40px; color: var(--brand-mint); }
    .side-title {
      font-family: var(--font-display); font-weight: 700;
      font-size: clamp(2rem, 3.4vw, 2.9rem); line-height: 1.08; letter-spacing: -.02em;
      margin: var(--space-xl) 0 var(--space-md);
    }
    .side-sub { color: rgba(255, 255, 255, .78); font-size: 1rem; line-height: 1.6; margin: 0 0 var(--space-xl); }
    .side-points { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-md); }
    .side-points li { display: flex; gap: .9rem; align-items: flex-start; }
    .side-points .ms {
      color: var(--brand-mint); font-size: 1.15rem; padding: .45rem;
      background: rgba(82, 183, 136, .14); border: 1px solid rgba(82, 183, 136, .35);
      border-radius: .65rem;
    }
    .side-points strong { display: block; font-weight: 700; }
    .side-points div > span { color: rgba(255, 255, 255, .72); font-size: .875rem; }
    .side-foot {
      margin: var(--space-xl) 0 0; color: rgba(255, 255, 255, .55);
      font-size: .78rem; letter-spacing: .14em; text-transform: uppercase;
    }

    /* ── formulaire ─────────────────────────────────────────────── */
    .auth-main {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: var(--space-xl) var(--space-md); background: var(--surface);
    }
    .auth-card {
      width: 100%; max-width: 25rem;
      background: var(--surface-container-lowest);
      border: 1px solid var(--hairline-strong); border-radius: var(--r-xl);
      box-shadow: var(--shadow-2);
      padding: clamp(1.5rem, 3vw, 2.25rem);
    }
    .card-brand {
      display: none; align-items: center; gap: .55rem; margin-bottom: var(--space-lg);
      font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; color: var(--primary);
    }
    .card-mark { width: 32px; height: 32px; color: var(--primary-container); }
    .steps { display: flex; align-items: center; gap: .6rem; margin-bottom: var(--space-lg); }
    .step { display: inline-flex; align-items: center; gap: .4rem; font-size: .78rem; font-weight: 600; color: var(--brand-muted); }
    .step .ms { font-size: 1rem; }
    .step.on, .step.done { color: var(--brand-mint-ink); }
    .step-line { flex: 1; height: 1px; background: var(--outline-variant); }
    .card-title {
      font-family: var(--font-display); font-weight: 700; font-size: 1.55rem;
      letter-spacing: -.01em; margin: 0 0 var(--space-xs);
    }
    .card-sub { color: var(--brand-muted); font-size: .9rem; line-height: 1.55; margin: 0 0 var(--space-lg); }
    .hint { font-size: .75rem; color: var(--brand-muted); margin: .4rem 0 0; }
    .btn-block { width: 100%; justify-content: center; margin-top: var(--space-md); padding-block: .8rem; }
    .link-btn {
      background: none; border: 0; cursor: pointer; font: inherit; font-size: .85rem;
      color: var(--brand-muted); margin-top: var(--space-sm);
      display: inline-flex; align-items: center; gap: .3rem;
    }
    .link-btn:hover { color: var(--brand-mint-ink); }
    .msg {
      display: flex; align-items: flex-start; gap: .5rem;
      font-size: .85rem; margin: var(--space-md) 0 0; padding: .65rem .8rem;
      border-radius: var(--r-md); background: var(--error-container); color: var(--on-error-container);
    }
    .msg.ok { background: var(--brand-mint-wash); color: var(--brand-mint-ink); }
    .secure {
      display: flex; align-items: center; justify-content: center; gap: .4rem;
      margin: var(--space-lg) 0 0; font-size: .78rem; color: var(--brand-muted);
    }
    .code-input {
      text-align: center; letter-spacing: .35em;
      font-family: var(--font-display); font-weight: 700; font-size: 1.3rem;
    }
    .auth-legal { margin: var(--space-lg) 0 0; font-size: .78rem; color: var(--brand-muted); text-align: center; }

    @media (max-width: 900px) {
      .auth { grid-template-columns: 1fr; }
      .auth-side { display: none; }
      .card-brand { display: flex; }
    }
  `,
  ],
})
export class LoginComponent {
  readonly store = inject(CityStore);
  private readonly router = inject(Router);

  phoneInput = '+216';
  otpInput = '';
  readonly otpSent = signal(false);
  readonly msg = signal<string | null>(null);
  readonly msgOk = signal(false);
  readonly busy = signal(false);

  constructor() {
    // Session déjà restaurée (ou utilisateur déjà connecté) → accueil.
    void this.store.authReady.then((a) => {
      if (a) void this.router.navigateByUrl('/');
    });
  }

  /** Étape 1 : envoi du code SMS au numéro saisi. */
  async requestCode(): Promise<void> {
    const phone = this.normalizedPhone();
    if (!phone) {
      this.msgOk.set(false);
      this.msg.set('Format international attendu : « +216 » suivi du numéro, sans espaces.');
      return;
    }
    this.busy.set(true);
    try {
      const ok = await this.store.requestOtp(phone);
      this.otpSent.set(ok);
      this.msgOk.set(ok);
      this.msg.set(
        ok
          ? `Code envoyé au ${phone} — il expire dans quelques minutes.`
          : "Envoi impossible : vérifiez le numéro et l'activation du SMS (console Supabase).",
      );
    } finally {
      this.busy.set(false);
    }
  }

  /** Étape 2 : code vérifié → session ouverte, retour à l'accueil. */
  async verifyCode(): Promise<void> {
    const code = this.otpInput.trim();
    const phone = this.normalizedPhone();
    if (code.length < 4 || !phone || this.busy()) return;
    this.busy.set(true);
    try {
      const auth = await this.store.verifyOtp(phone, code);
      if (auth) {
        await this.router.navigateByUrl('/');
      } else {
        this.msgOk.set(false);
        this.msg.set('Code incorrect ou expiré — demandez-en un nouveau.');
      }
    } finally {
      this.busy.set(false);
    }
  }

  /** Normalise en E.164 (« +216… », chiffres uniquement). Null si invalide. */
  private normalizedPhone(): string | null {
    const p = this.phoneInput.replace(/[\s.\-()]/g, '');
    return /^\+\d{8,15}$/.test(p) ? p : null;
  }
}
