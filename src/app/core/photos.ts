/**
 * Photographie de marque.
 * Un seul contrat de style : lumière naturelle de fin de journée, argile et pierre,
 * aliment réel, aucun texte incrusté. Les fichiers sont dans `src/assets/img/`.
 */
export const PHOTOS = {
  hero: 'assets/img/hero-comptoir.jpg',
  vitrine: 'assets/img/vitrine-boutique.jpg',
  argile: 'assets/img/jarra-argile.jpg',
  boulangerie: 'assets/img/panier-boulangerie.jpg',
  primeur: 'assets/img/panier-primeur.jpg',
  traiteur: 'assets/img/panier-traiteur.jpg',
  patisserie: 'assets/img/patisseries-fines.jpg',
  commercant: 'assets/img/portrait-commercant.jpg',
} as const;

export type PhotoKey = keyof typeof PHOTOS;

/** Visuel de panier correspondant au type de commerce. */
export const KIND_PHOTO: Record<string, PhotoKey> = {
  bakery: 'boulangerie',
  patisserie: 'patisserie',
  restaurant: 'traiteur',
  grocery: 'primeur',
};

export function photoOfKind(kind: string): string {
  return PHOTOS[KIND_PHOTO[kind] ?? 'boulangerie'];
}
