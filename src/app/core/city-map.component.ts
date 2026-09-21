// ═══════════════════════════════════════════════════════════════════
// JARRA — Carte réelle (MapLibre GL + tuiles CartoDB Voyager, gratuites)
// Vraie carte de Gabès : zoom/pinch tactile natif, marqueurs DOM custom.
// Fallback élégant si WebGL est indisponible (tests, vieux navigateurs).
// ═══════════════════════════════════════════════════════════════════

import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges,
  OnDestroy, Output, ViewChild,
} from '@angular/core';
import * as maplibregl from 'maplibre-gl';
import { KIND_ICON, Merchant, MerchantKind } from './model';

/** Marqueur affiché sur la carte : commerçant + son stock live. */
export interface MapPin {
  merchant: Merchant;
  liveCount: number;
  units: number;
}

/** Centre de Gabès. */
const GABES_CENTER: [number, number] = [10.0982, 33.8815];
/** Tuiles vectorielles gratuites et claires (pas de clé API). */
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

@Component({
  selector: 'jr-city-map',
  standalone: true,
  template: `
    <div class="map-frame">
      <div #container class="map"></div>

      @if (failed) {
        <div class="map-fallback">
          <strong>La carte interactive n'est pas disponible ici.</strong>
          <span>Votre navigateur ou cet environnement ne supporte pas WebGL — la liste des paniers ci-dessous reste pleinement fonctionnelle.</span>
        </div>
      }

      <div class="map-legend">
        @for (k of kinds; track k) {
          <span><i class="dot" [style.background]="colorOf(k)"></i>{{ icon(k) }} {{ k }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .map-frame { position: relative; }
    .map {
      width: 100%; height: 460px;
      border-radius: var(--r-lg);
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-2);
    }
    .map-fallback {
      position: absolute; inset: 0; z-index: 2;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .5rem;
      text-align: center; padding: 1.5rem;
      background: var(--surface-2); border-radius: var(--r-lg);
      color: var(--muted); font-size: .88rem;
    }
    .map-legend {
      display: flex; flex-wrap: wrap; gap: .5rem 1.1rem;
      margin-top: .7rem; padding: 0 .3rem;
      font-size: .74rem; color: var(--muted);
    }
    .map-legend span { display: inline-flex; align-items: center; gap: .35rem; }
    .map-legend .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

    @media (max-width: 720px) {
      .map { height: 52vh; height: 52svh; min-height: 320px; }
    }
    @media (max-width: 720px) and (orientation: landscape) {
      .map { height: 74vh; }
    }
  `],
})
export class CityMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() pins: MapPin[] = [];
  @Input() selectedId: string | null = null;
  @Input() kindFilter: MerchantKind | 'all' = 'all';
  @Output() select = new EventEmitter<MapPin>();
  @Output() background = new EventEmitter<void>();

  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  failed = false;

  private map?: maplibregl.Map;
  private markers: maplibregl.Marker[] = [];

  readonly kinds: MerchantKind[] = ['bakery', 'patisserie', 'restaurant', 'grocery'];

  ngAfterViewInit(): void {
    try {
      this.map = new maplibregl.Map({
        container: this.container.nativeElement,
        style: MAP_STYLE,
        center: GABES_CENTER,
        zoom: 12.4,
        attributionControl: false,
      });
      this.map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
      this.map.addControl(
        new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }),
        'bottom-right',
      );
      // Clic sur le fond = désélection
      this.map.on('click', () => this.background.emit());
      // Erreur de chargement des tuiles (offline) → fallback
      this.map.on('error', () => { /* silencieux : la liste reste utilisable */ });
      this.renderMarkers();
    } catch {
      this.failed = true;
    }
  }

  ngOnChanges(): void {
    this.renderMarkers();
  }

  ngOnDestroy(): void {
    for (const m of this.markers) m.remove();
    this.map?.remove();
  }

  colorOf(kind: MerchantKind): string {
    return (
      { bakery: '#d96f36', patisserie: '#c98f2e', restaurant: '#5f8746', grocery: '#3f8f77' } as Record<MerchantKind, string>
    )[kind];
  }

  icon(kind: MerchantKind): string {
    return KIND_ICON[kind];
  }

  dimmed(kind: MerchantKind): boolean {
    return this.kindFilter !== 'all' && this.kindFilter !== kind;
  }

  /** (Re)construit les marqueurs DOM custom. */
  private renderMarkers(): void {
    if (!this.map) return;
    for (const m of this.markers) m.remove();
    this.markers = [];

    for (const pin of this.pins) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = this.pinClass(pin);
      el.style.setProperty('--pin-color', this.colorOf(pin.merchant.kind));
      el.setAttribute('aria-label', `${pin.merchant.name} — ${pin.liveCount} paniers`);
      if (pin.liveCount > 0) {
        el.innerHTML = `<span class="pin-n">${pin.liveCount}</span>`;
      }
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        this.select.emit(pin);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, 2] })
        .setLngLat([pin.merchant.lon, pin.merchant.lat])
        .addTo(this.map);
      this.markers.push(marker);
    }
  }

  private pinClass(pin: MapPin): string {
    let cls = pin.liveCount > 0 ? 'jarra-pin live' : 'jarra-pin idle';
    if (this.selectedId === pin.merchant.id) cls += ' selected';
    if (this.dimmed(pin.merchant.kind)) cls += ' dimmed';
    return cls;
  }
}
