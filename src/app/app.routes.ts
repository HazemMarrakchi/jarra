import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./landing/landing.component').then((m) => m.LandingComponent) },
  { path: 'explorer', loadComponent: () => import('./explore/explore.component').then((m) => m.ExploreComponent) },
  { path: 'basket/:id', loadComponent: () => import('./basket/basket.component').then((m) => m.BasketComponent) },
  { path: 'impact', loadComponent: () => import('./impact/impact.component').then((m) => m.ImpactComponent) },
  { path: 'commercant', loadComponent: () => import('./merchant/merchant.component').then((m) => m.MerchantComponent) },
  { path: '**', redirectTo: '' },
];
