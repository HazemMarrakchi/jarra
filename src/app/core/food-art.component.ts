import { Component, Input } from '@angular/core';
import { MerchantKind } from './model';

/**
 * Illustrations alimentaires dessinées en SVG — remplacent les emojis.
 * Chaque type de commerce a sa planche : croissant, pâtisserie,
 * couscous, olives. Fond radial chaud + ombre douce, prêt pour carte.
 */
@Component({
  selector: 'jr-food-art',
  standalone: true,
  template: `
    <svg [attr.viewBox]="'0 0 120 120'" preserveAspectRatio="xMidYMid slice" class="art" aria-hidden="true">
      <defs>
        <radialGradient [attr.id]="'bg' + uid" cx="50%" cy="42%" r="70%">
          <stop offset="0" stop-color="#fdf2df" />
          <stop offset="1" stop-color="#f0dfc0" />
        </radialGradient>
        <linearGradient [attr.id]="'clayG' + uid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffc490" />
          <stop offset="1" stop-color="#d97a3e" />
        </linearGradient>
        <linearGradient [attr.id]="'goldG' + uid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f6d795" />
          <stop offset="1" stop-color="#d99b3e" />
        </linearGradient>
        <linearGradient [attr.id]="'oliveG' + uid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#d9e6ad" />
          <stop offset="1" stop-color="#8fa663" />
        </linearGradient>
      </defs>

      <!-- fond chaud + ombre -->
      <rect width="120" height="120" rx="18" [attr.fill]="'url(#bg' + uid + ')'" />
      <ellipse cx="60" cy="96" rx="30" ry="6" fill="#7a5b33" opacity=".16" />

      <!-- CROISSANT -->
      @if (kind === 'bakery') {
        <g transform="translate(60 58) rotate(-14)">
          <path d="M-34 6 C-34 -14 -16 -28 2 -28 C20 -28 36 -16 36 4 C36 8 32 10 28 8 C22 5 18 8 14 14 C11 19 4 21 0 18 C-5 14 -12 14 -18 16 C-24 18 -30 18 -32 14 C-34 12 -34 9 -34 6 Z"
            [attr.fill]="'url(#clayG' + uid + ')'" stroke="#8f4517" stroke-width="2" stroke-linejoin="round" />
          <path d="M-20 12 C-16 -6 -4 -20 8 -24 M-2 16 C2 -2 10 -14 20 -20 M14 16 C20 4 26 -4 32 -10"
            fill="none" stroke="#8f4517" stroke-width="2" stroke-linecap="round" opacity=".55" />
          <circle cx="24" cy="-18" r="2.4" fill="#fff" opacity=".5" />
        </g>
        <!-- miettes -->
        <circle cx="30" cy="92" r="2" [attr.fill]="'url(#goldG' + uid + ')'" opacity=".8" />
        <circle cx="88" cy="88" r="1.6" [attr.fill]="'url(#goldG' + uid + ')'" opacity=".6" />
      }

      <!-- PÂTISSERIE : part de gâteau + cerise -->
      @if (kind === 'patisserie') {
        <g transform="translate(60 58)">
          <path d="M-26 22 L-8 -26 C-6 -31 0 -31 3 -27 L26 22 C28 26 26 30 21 30 L-20 30 C-25 30 -28 26 -26 22 Z"
            [attr.fill]="'url(#goldG' + uid + ')'" stroke="#8f5c14" stroke-width="2" stroke-linejoin="round" />
          <path d="M-13 -3 L22 27 M-20 12 L14 30" stroke="#8f5c14" stroke-width="2" opacity=".45" />
          <path d="M-26 22 L26 22 L26 26 C26 28 25 30 21 30 L-20 30 C-24 30 -26 28 -26 26 Z" fill="#f2e3c8" opacity=".9" />
          <circle cx="2" cy="-30" r="6" fill="#e05548" stroke="#9c3327" stroke-width="1.6" />
          <path d="M2 -36 q3 -4 6 -3" fill="none" stroke="#7a955a" stroke-width="2" stroke-linecap="round" />
        </g>
      }

      <!-- RESTAURANT : couscous fumant -->
      @if (kind === 'restaurant') {
        <g transform="translate(60 60)">
          <path d="M-30 -8 L30 -8 C30 -8 27 20 22 26 C18 31 -18 31 -22 26 C-27 20 -30 -8 -30 -8 Z"
            [attr.fill]="'url(#clayG' + uid + ')'" stroke="#8f4517" stroke-width="2" stroke-linejoin="round" />
          <ellipse cx="0" cy="-8" rx="30" ry="6" fill="#f2e3c8" stroke="#8f4517" stroke-width="2" />
          <circle cx="-10" cy="-10" r="3.4" fill="#d9973e" />
          <circle cx="4" cy="-12" r="3" fill="#b0673a" />
          <circle cx="14" cy="-9" r="2.8" fill="#d9973e" />
          <!-- vapeur -->
          <path d="M-12 -22 q4 -6 0 -12 q-4 -6 0 -12 M8 -20 q4 -6 0 -12 q-4 -6 0 -12"
            fill="none" stroke="#f7ecdc" stroke-width="2.4" stroke-linecap="round" opacity=".5" />
        </g>
      }

      <!-- ÉPICERIE : branche d'olives -->
      @if (kind === 'grocery') {
        <g transform="translate(60 60) rotate(12)">
          <path d="M-30 24 C-14 10 6 -6 30 -26" fill="none" stroke="#7a955a" stroke-width="3.4" stroke-linecap="round" />
          <path d="M-8 6 q-14 -2 -18 -14 q14 -2 18 14 Z" [attr.fill]="'url(#oliveG' + uid + ')'" opacity=".9" />
          <path d="M8 -6 q-4 -14 6 -22 q8 10 -6 22 Z" [attr.fill]="'url(#oliveG' + uid + ')'" opacity=".9" />
          <circle cx="-14" cy="16" r="6.5" fill="#5f7d4f" stroke="#3f5731" stroke-width="1.6" />
          <circle cx="2" cy="8" r="6.5" fill="#6f8c5c" stroke="#4a6339" stroke-width="1.6" />
          <circle cx="20" cy="-14" r="6" fill="#5f7d4f" stroke="#3f5731" stroke-width="1.6" />
          <circle cx="-16" cy="14" r="2" fill="#cfe3a4" opacity=".7" />
          <circle cx="18" cy="-16" r="1.8" fill="#cfe3a4" opacity=".7" />
        </g>
      }
    </svg>
  `,
  styles: [`
    :host { display: block; line-height: 0; }
    .art { width: 100%; height: auto; display: block; border-radius: inherit; }
  `],
})
export class FoodArtComponent {
  private static nextUid = 0;
  readonly uid = FoodArtComponent.nextUid++;
  @Input({ required: true }) kind!: MerchantKind;
}
