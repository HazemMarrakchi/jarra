// ═══════════════════════════════════════════════════════════════════
// JARRA — Verrou global d'accès
// En mode live (Supabase), AUCUNE page n'est accessible sans session
// OTP validée : tout visiteur non connecté est redirigé vers
// /connexion. En mode démo il n'existe pas d'authentification :
// l'app reste libre (et les tests unitaires ne sont pas bloqués).
// ═══════════════════════════════════════════════════════════════════

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CityStore } from './city.store';

export const authGuard: CanActivateFn = async () => {
  const store = inject(CityStore);
  const router = inject(Router);
  if (store.mode !== 'live') return true;
  // Attend la restauration d'une éventuelle session (localStorage).
  return (await store.authReady) ? true : router.createUrlTree(['/connexion']);
};
