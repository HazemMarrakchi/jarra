import { Injectable, computed, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { CityStore } from './city.store';

export type PushState = 'off' | 'on' | 'denied';

// ─────────────────────────────────────────────────────────────────────────────
// JARRA — PushService (étape 3c)
// Logique Web Push centralisée : utilisée par la cloche 🔔 du header global
// (toutes les pages) et par la carte « Alertes » de la page Explorer.
// Actif uniquement en prod : service worker enregistré + backend live.
// ─────────────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly store = inject(CityStore);
  /** Optionnel : absent des tests unitaires et du mode démo. */
  private readonly swPush = inject(SwPush, { optional: true });

  /** Push possible seulement en prod : service worker actif + backend live. */
  readonly available = this.store.mode === 'live' && this.swPush?.isEnabled === true;
  readonly state = signal<PushState>('off');
  readonly busy = signal(false);

  readonly label = computed(() => {
    switch (this.state()) {
      case 'on': return 'Alertes activées';
      case 'denied': return 'Bloquées (navigateur)';
      default: return 'Activer les alertes';
    }
  });

  constructor() {
    // Resynchronise l'état au démarrage (abonnement existant ? refus ?).
    if (this.available) void this.sync();
  }

  /** Clic sur la cloche / la carte 🔔 : abonne ou désabonne cet appareil. */
  async toggle(): Promise<void> {
    const swPush = this.swPush;
    if (this.busy() || !swPush) return;
    this.busy.set(true);
    try {
      if (this.state() === 'on') {
        const sub = await firstValueFrom(swPush.subscription);
        if (sub) {
          await this.store.deletePushSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
        this.state.set('off');
      } else {
        const sub = await swPush.requestSubscription({
          serverPublicKey: environment.vapidPublicKey,
        });
        const ok = await this.store.savePushSubscription({
          endpoint: sub.endpoint,
          keys: sub.toJSON().keys,
        });
        this.state.set(ok ? 'on' : 'off');
        if (!ok) await sub.unsubscribe();
      }
    } catch {
      // Permission refusée ou navigateur incompatible → état lisible.
      this.state.set(this.denied() ? 'denied' : 'off');
    } finally {
      this.busy.set(false);
    }
  }

  private async sync(): Promise<void> {
    const swPush = this.swPush;
    if (!swPush) return;
    if (this.denied()) {
      this.state.set('denied');
      return;
    }
    const sub = await firstValueFrom(swPush.subscription);
    this.state.set(sub ? 'on' : 'off');
  }

  private denied(): boolean {
    return typeof Notification !== 'undefined' && Notification.permission === 'denied';
  }
}
