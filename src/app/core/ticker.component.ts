import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CityStore } from './city.store';

/**
 * Pastille « live » de l'en-tête : repas sauvés aujourd'hui, mis à jour par le moteur.
 * N'affiche rien de décoratif : le chiffre est réel.
 */
@Component({
  selector: 'jr-live-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="live-pill">
      <span class="dot-live"></span>{{ impact().mealsSaved }} repas sauvés aujourd'hui
    </span>
  `,
})
export class LivePillComponent {
  private readonly store = inject(CityStore);
  readonly impact = this.store.impact;
}
