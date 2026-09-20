import { Component, EventEmitter, Input, Output } from '@angular/core';
import { KIND_ICON, Merchant, MerchantKind } from '../core/model';

/** Marqueur affiché sur la carte : commerçant + son stock live. */
export interface MapPin {
  merchant: Merchant;
  liveCount: number; // paniers disponibles
  units: number; // unités restantes au total
}

@Component({
  selector: 'jr-city-map',
  standalone: true,
  template: `
    <div class="map-frame">
      <svg
        viewBox="0 0 100 72"
        class="city-map"
        role="img"
        aria-label="Carte de Tunis avec les commerçants Jarra"
        (click)="onBackgroundClick()"
      >
        <defs>
          <radialGradient id="seaGlow" cx="80%" cy="20%" r="60%">
            <stop offset="0" stop-color="#1d3040" />
            <stop offset="1" stop-color="transparent" />
          </radialGradient>
          <filter id="pinGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="0.9" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <!-- fond : la mer (golfe de Tunis) -->
        <rect width="100" height="72" rx="3" fill="#171410" />
        <path d="M64 0 Q78 14 74 30 Q71 44 82 54 Q92 62 100 60 L100 0 Z" fill="url(#seaGlow)" opacity="0.9" />
        <path d="M64 0 Q78 14 74 30 Q71 44 82 54 Q92 62 100 60" fill="none" stroke="#2c4256" stroke-width="0.35" opacity="0.8" />

        <!-- lac de Tunis -->
        <path d="M20 34 Q32 28 42 33 Q46 38 40 43 Q28 48 18 43 Q14 38 20 34 Z"
          fill="#1b2836" stroke="#2c4256" stroke-width="0.25" opacity="0.9" />
        <text x="29" y="40" class="water-label">Lac de Tunis</text>

        <!-- artères stylisées -->
        <g stroke="#33291d" stroke-width="0.5" fill="none" opacity="0.9">
          <path d="M48 44 Q52 34 46 26" />
          <path d="M48 44 Q58 40 66 30 Q72 22 76 13" />
          <path d="M48 44 Q40 46 34 48" />
          <path d="M48 44 Q42 36 38 24" />
          <path d="M48 44 Q56 30 62 19" />
          <path d="M48 44 Q36 40 27 38" />
        </g>

        <!-- médina (texture) -->
        <circle cx="55" cy="45" r="4.5" fill="none" stroke="#3d2f1e" stroke-width="0.3" stroke-dasharray="0.8 0.6" opacity="0.9" />

        <!-- labels de quartiers -->
        <g class="area-labels">
          <text x="55" y="56">Médina</text>
          <text x="38" y="18.5">Ennasr</text>
          <text x="62" y="14.5">Ariana</text>
          <text x="76" y="8">Sidi Bou Saïd</text>
          <text x="30" y="28">Les Berges du Lac</text>
          <text x="34" y="53">Le Bardo</text>
          <text x="82" y="25.5">La Marsa</text>
        </g>
        <!-- pins des commerçants -->
        @for (pin of pins; track pin.merchant.id) {
          <g
            class="pin"
            [class.dimmed]="dimmed(pin.merchant.kind)"
            [class.selected]="selectedId === pin.merchant.id"
            [attr.transform]="'translate(' + pin.merchant.x + ' ' + pin.merchant.y + ')'"
            (click)="onPinClick(pin, $event)"
            role="button"
            [attr.aria-label]="pin.merchant.name + ' — ' + pin.liveCount + ' paniers'"
            tabindex="0"
            (keydown.enter)="onPinClick(pin, $event)"
          >
            @if (pin.liveCount > 0) {
              <circle class="pin-ring" r="3.4" fill="none" [attr.stroke]="colorOf(pin.merchant.kind)" />
            }
            <circle
              class="pin-dot"
              [attr.r]="selectedId === pin.merchant.id ? 2.6 : 2"
              [attr.fill]="pin.liveCount > 0 ? colorOf(pin.merchant.kind) : '#4a4132'"
              filter="url(#pinGlow)"
            />
            @if (pin.liveCount > 0) {
              <g class="pin-badge" transform="translate(2 -2.6)">
                <circle r="1.55" fill="#12100d" [attr.stroke]="colorOf(pin.merchant.kind)" stroke-width="0.3" />
                <text y="0.62" text-anchor="middle" class="pin-count">{{ pin.liveCount }}</text>
              </g>
            }
          </g>
        }
      </svg>

      <!-- légende -->
      <div class="map-legend">
        @for (k of kinds; track k) {
          <span><i class="dot" [style.background]="colorOf(k)"></i>{{ icon(k) }} {{ k }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .map-frame { position: relative; }
    .city-map {
      width: 100%; height: auto; display: block;
      border-radius: var(--r-lg); border: 1px solid var(--border-soft);
      box-shadow: var(--shadow-2);
      touch-action: manipulation;
    }
    .water-label { font-size: 2.1px; fill: #57708c; font-style: italic; letter-spacing: 0.04em; }
    .area-labels text {
      font-size: 2px; fill: #6b6252; font-weight: 600;
      letter-spacing: 0.05em; text-anchor: middle;
      font-family: var(--font-ui); pointer-events: none;
    }
    .pin { cursor: pointer; transition: opacity 0.2s; outline: none; }
    .pin.dimmed { opacity: 0.22; }
    .pin:focus-visible .pin-dot { stroke: var(--sand); stroke-width: 0.4; }
    .pin-dot { transition: r 0.2s var(--ease-spring); }
    .pin-ring {
      stroke-width: 0.28; opacity: 0.75;
      animation: mapPulse 2.6s ease-out infinite; transform-origin: center;
      transform-box: fill-box;
    }
    @keyframes mapPulse {
      0% { transform: scale(0.5); opacity: 0.9; }
      70% { transform: scale(1.5); opacity: 0; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    .pin-count {
      font-size: 2px; font-weight: 700; fill: var(--sand);
      font-family: var(--font-ui); pointer-events: none;
    }
    .map-legend {
      display: flex; flex-wrap: wrap; gap: 0.5rem 1.1rem;
      margin-top: 0.7rem; padding: 0 0.3rem;
      font-size: 0.74rem; color: var(--muted);
    }
    .map-legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
    .map-legend .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  `],
})
export class CityMapComponent {
  @Input({ required: true }) pins: MapPin[] = [];
  @Input() selectedId: string | null = null;
  /** Filtre actif : seul ce type ressort, les autres s'estompent. */
  @Input() kindFilter: MerchantKind | 'all' = 'all';
  @Output() select = new EventEmitter<MapPin>();
  @Output() background = new EventEmitter<void>();

  readonly kinds: MerchantKind[] = ['bakery', 'patisserie', 'restaurant', 'grocery'];

  colorOf(kind: MerchantKind): string {
    return (
      { bakery: '#e8814f', patisserie: '#d4a24a', restaurant: '#a8b97f', grocery: '#7fb9a8' } as Record<MerchantKind, string>
    )[kind];
  }

  icon(kind: MerchantKind): string {
    return KIND_ICON[kind];
  }

  dimmed(kind: MerchantKind): boolean {
    return this.kindFilter !== 'all' && this.kindFilter !== kind;
  }

  onPinClick(pin: MapPin, event: Event): void {
    event.stopPropagation();
    this.select.emit(pin);
  }

  onBackgroundClick(): void {
    this.background.emit();
  }
}
