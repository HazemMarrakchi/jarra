import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./landing/landing.component').then((m) => m.LandingComponent) },
  { path: 'explorer', loadComponent: () => import('./explore/explore.component').then((m) => m.ExploreComponent) },
  { path: 'boutique', loadComponent: () => import('./boutique/boutique.component').then((m) => m.BoutiqueComponent) },
  { path: 'boutique/:id', loadComponent: () => import('./boutique/boutique.component').then((m) => m.BoutiqueComponent) },
  { path: 'basket/:id', loadComponent: () => import('./basket/basket.component').then((m) => m.BasketComponent) },
  // L'ancienne page /publier est fusionnée dans le tableau de bord commerçant.
  { path: 'publier', redirectTo: 'commercant' },
  { path: 'impact', loadComponent: () => import('./impact/impact.component').then((m) => m.ImpactComponent) },
  { path: 'commercant', loadComponent: () => import('./merchant/merchant.component').then((m) => m.MerchantComponent) },
  { path: 'admin', loadComponent: () => import('./admin/admin.component').then((m) => m.AdminComponent) },
  { path: '**', redirectTo: '' },
];
