import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

// Verrou global : seule /connexion est publique. Toutes les autres
// routes exigent une session OTP validée (voir core/auth.guard.ts).
export const routes: Routes = [
  { path: 'connexion', loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent) },
  { path: '', loadComponent: () => import('./landing/landing.component').then((m) => m.LandingComponent), canActivate: [authGuard] },
  { path: 'explorer', loadComponent: () => import('./explore/explore.component').then((m) => m.ExploreComponent), canActivate: [authGuard] },
  { path: 'boutique', loadComponent: () => import('./boutique/boutique.component').then((m) => m.BoutiqueComponent), canActivate: [authGuard] },
  { path: 'boutique/:id', loadComponent: () => import('./boutique/boutique.component').then((m) => m.BoutiqueComponent), canActivate: [authGuard] },
  { path: 'basket/:id', loadComponent: () => import('./basket/basket.component').then((m) => m.BasketComponent), canActivate: [authGuard] },
  // L'ancienne page /publier est fusionnée dans le tableau de bord commerçant.
  { path: 'publier', redirectTo: 'commercant' },
  { path: 'impact', loadComponent: () => import('./impact/impact.component').then((m) => m.ImpactComponent), canActivate: [authGuard] },
  { path: 'commercant', loadComponent: () => import('./merchant/merchant.component').then((m) => m.MerchantComponent), canActivate: [authGuard] },
  { path: 'admin', loadComponent: () => import('./admin/admin.component').then((m) => m.AdminComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
