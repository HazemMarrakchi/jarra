import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges,
  OnDestroy, Output, ViewChild,
} from '@angular/core';
import * as maplibregl from 'maplibre-gl';
import { Merchant, MerchantKind } from './model';

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
/** Vert forêt de la marque : tous les marqueurs actifs. */
const PIN_FOREST = '#1b4332';

@Component({
  selector: 'jr-city-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map-frame">
      <div #container class="map"></div>

      @if (failed) {
        <div class="map-fallback">
          <span class="ms ms-40">map</span>
          <strong>La carte interactive n'est pas disponible ici.</strong>
          <span class="body-sm">
            Votre navigateur ou cet environnement ne supporte pas WebGL — la liste des paniers reste pleinement
            fonctionnelle.
          </span>
        </div>
      }

      <div class="map-legend">
        <span><i class="pin-live"></i>Commerce avec invendus</span>
        <span><i class="pin-idle"></i>Aucun invendu</span>
        <span class="grow"></span>
        <span class="label-sm muted">Zoom {{ zoomLabel }}</span>
      </div>
    </div>
  `,
  styles: [`
    .map-frame { position: relative; }
    .map {
      width: 100%; height: 30rem;
      border-radius: var(--r-lg);
      overflow: hidden;
      border: 1px solid var(--hairline);
      background: var(--surface-container);
    }
    .map-fallback {
      position: absolute; inset: 0; z-index: 2;
      display: grid; gap: var(--space-sm); justify-items: center; align-content: center;
      text-align: center; padding: var(--space-lg);
      background: var(--surface-container-low); border-radius: var(--r-lg);
      color: var(--on-surface-variant);
    }
    .map-fallback .ms { color: var(--primary-container); }
    .map-legend {
      display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-sm) var(--space-md);
      margin-top: var(--space-sm); font-size: 0.75rem; color: var(--on-surface-variant);
    }
    .map-legend span { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; }
    .map-legend i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
    .map-legend .pin-live { background: var(--primary-container); box-shadow: 0 0 0 2px rgba(82, 183, 138, .5); }
    .map-legend .pin-idle { background: #8fa39a; }
    .map-legend .grow { flex: 1; }
    @media (max-width: 1023px) {
      .map { height: 24rem; }
    }
    @media (max-width: 767px) {
      .map { height: 60svh; min-height: 20rem; }
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
  zoomLabel = '12';

  private map?: maplibregl.Map;
  private markers: maplibregl.Marker[] = [];

  readonly kinds: MerchantKind[] = ['bakery', 'patisserie', 'restaurant', 'grocery'];

  ngAfterViewInit(): void {
    // Sans WebGL (tests, vieux navigateurs) on affiche le repli : la liste reste utilisable.
    if (!this.webglAvailable()) {
      this.failed = true;
      return;
    }
    try {
      this.map = new maplibregl.Map({
        container: this.container.nativeElement,
        style: MAP_STYLE,
        center: GABES_CENTER,
        zoom: 12.4,
        attributionControl: false,
      });
      this.map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
      this.map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), 'bottom-right');
      this.map.on('click', () => this.background.emit());
      this.map.on('error', () => { /* silencieux : la liste reste utilisable */ });
      this.map.on('zoom', () => { this.zoomLabel = (this.map?.getZoom() ?? 12).toFixed(0); });
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

  /** WebGL est-il utilisable dans cet environnement ? */
  private webglAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      return false;
    }
  }

  colorOf(_kind: MerchantKind): string {
    return PIN_FOREST;
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
      el.style.setProperty('--pin-color', PIN_FOREST);
      el.setAttribute('aria-label', `${pin.merchant.name} — ${pin.liveCount} paniers`);
      if (pin.liveCount > 0) {
        el.innerHTML = `<span class="pin-n">${pin.liveCount}</span>`;
      }
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        this.select.emit(pin);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center', offset: [0, 0] })
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
