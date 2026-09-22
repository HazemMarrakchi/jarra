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
    <section class="login-wrap">
      <div class="card card-pad login-card">
        <svg class="brand-mark-lg" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="currentColor"
            d="M18.5 5.5h11v3.2c0 2.1-1 3.6-2.7 4.7 5.9 2.6 9.7 8.1 9.7 14.5C36.5 36.4 30.3 42.5 24 42.5S11.5 36.4 11.5 27.9c0-6.4 3.8-11.9 9.7-14.5-1.7-1.1-2.7-2.6-2.7-4.7V5.5Z"
          />
          <path fill="#fff" fill-opacity=".5" d="M16.5 25.2c4.6 2.1 10.4 2.1 15 0v1.8c-4.6 2.1-10.4 2.1-15 0Z" />
        </svg>
        <h1 class="headline-sm" style="margin-top:var(--space-sm)">Connexion à Jarra</h1>

        @if (store.mode !== 'live') {
          <p class="body-sm muted" style="margin-top:var(--space-sm)">
            Mode démo : aucune connexion requise, les données sont simulées localement.
          </p>
          <a class="btn btn-primary" routerLink="/" style="margin-top:var(--space-md)">
            <span class="ms ms-18">east</span>Explorer la démo
          </a>
        } @else {
          <p class="body-sm muted" style="margin-top:var(--space-sm)">
            Entrez votre numéro : un code à 6 chiffres vous est envoyé par SMS.
            La même session sert à réserver, publier et administrer.
          </p>
          @if (!otpSent()) {
            <div class="field" style="margin-top:var(--space-md)">
              <label for="phoneIn">Numéro de téléphone</label>
              <input
                id="phoneIn" class="input" type="tel" inputmode="tel" name="phoneInput"
                placeholder="+216 20 000 000" autocomplete="tel" [(ngModel)]="phoneInput"
                (keyup.enter)="requestCode()"
              />
            </div>
            <button
              class="btn btn-primary" type="button" style="margin-top:var(--space-md)"
              [disabled]="busy()" (click)="requestCode()"
            >
              <span class="ms ms-18">{{ busy() ? 'hourglass_top' : 'sms' }}</span>
              {{ busy() ? 'Envoi…' : 'Recevoir le code' }}
            </button>
          } @else {
            <div class="field" style="margin-top:var(--space-md)">
              <label for="otpIn">Code reçu par SMS</label>
              <input
                id="otpIn" class="input code-input" type="text" inputmode="numeric" name="otpInput"
                maxlength="6" placeholder="123456" autocomplete="one-time-code" [(ngModel)]="otpInput"
                (keyup.enter)="verifyCode()"
              />
            </div>
            <div class="row gap-sm" style="margin-top:var(--space-md)">
              <button
                class="btn btn-primary" type="button"
                [disabled]="otpInput.trim().length < 4 || busy()" (click)="verifyCode()"
              >
                <span class="ms ms-18">{{ busy() ? 'hourglass_top' : 'lock_open' }}</span>Valider
              </button>
              <button class="btn btn-ghost btn-sm" type="button" (click)="otpSent.set(false); msg.set(null)">
                <span class="ms ms-18">undo</span>Changer de numéro
              </button>
            </div>
          }
          @if (msg(); as m) {
            <p
              class="body-sm" role="status" style="margin-top:var(--space-sm)"
              [style.color]="msgOk() ? 'var(--brand-mint-ink)' : 'var(--error)'"
            >{{ m }}</p>
          }
        }
      </div>
      <p class="body-sm muted" style="margin-top:var(--space-md)">
        Pilote citoyen à Gabès — paiement au comptoir, aucun frais en ligne.
      </p>
    </section>
  `,
  styles: [
    `
    .login-wrap {
      min-height: 62vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: var(--space-xl) var(--space-md);
    }
    .login-card { max-width: 26rem; width: 100%; }
    .brand-mark-lg { width: 44px; height: 44px; color: var(--primary); }
    .code-input {
      text-align: center; letter-spacing: .3em;
      font-family: var(--font-display); font-weight: 700;
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
