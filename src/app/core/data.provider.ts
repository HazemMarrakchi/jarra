// ═══════════════════════════════════════════════════════════════════
// JARRA — Contrat DataProvider
// Interface unique entre le front et la source de données. Le même
// contrat est implémenté par DemoProvider (simulation in-browser) et
// SupabaseProvider (backend de production) : brancher le backend =
// remplir src/environments/environment.ts, zéro refactor du UI.
// ═══════════════════════════════════════════════════════════════════

import { Basket, ImpactStats, Merchant, Order, WeeklyTrend } from './model';

/** Brouillon de panier publié par un commerçant (prix en millimes). */
export interface PublishDraft {
  title: string;
  description: string;
  originalPrice: number;
  rescuePrice: number;
  quantity: number;
  /** "HH:MM" — heure de fin du créneau de retrait. */
  pickupUntil: string;
}

/** Photographie cohérente de l'état lisible par le front. */
export interface ProviderSnapshot {
  merchants: readonly Merchant[];
  baskets: readonly Basket[];
  orders: readonly Order[];
  impact: ImpactStats;
  trend: readonly WeeklyTrend[];
  /** Horloge affichée : minutes depuis minuit (simulées ou réelles). */
  clockMin: number;
}

/** État d'authentification commerçant (étape 2 — OTP téléphone). */
export interface MerchantAuth {
  /** Numéro au format international E.164, ex. "+21620000000". */
  phone: string;
  /** Commerce lié à ce numéro (null tant que claim_merchant n'a pas été fait). */
  merchantId: string | null;
}

export interface DataProvider {
  /** 'demo' = moteur simulé local · 'live' = backend Supabase. */
  readonly mode: 'demo' | 'live';

  /**
   * Charge l'état initial et abonne aux changements temps réel.
   * `onChange` est rappelé à chaque mise à jour poussée par le backend.
   */
  init(onChange: () => void): void | Promise<void>;

  /**
   * Fait avancer le temps. Retourne true si l'état a changé et que le
   * store doit re-lire snapshot(). Démo : avance la journée simulée.
   * Live : recalcule horloge et statuts (les paniers expirent).
   */
  tick?(): boolean;

  snapshot(): ProviderSnapshot;

  /** Réservation atomique (pas de surréservation, garantie côté backend). */
  reserve(basketId: string, customerName: string): Promise<Order | null>;

  /**
   * Publication d'un panier. En mode live, `pin` est le code commerçant
   * vérifié par le backend ; en mode démo il est ignoré.
   */
  publish(merchantId: string, draft: PublishDraft, pin?: string): Promise<Basket | null>;

  /** Validation d'un retrait au comptoir via le code à 4 caractères. */
  collect(pickupCode: string): Promise<Order | null>;

  /** Annulation par le client — la quantité est restituée. */
  cancel(orderId: string): Promise<boolean>;

  // ── Auth commerçant (étape 2 — optionnel, live uniquement) ────────
  // En mode démo ces méthodes sont absentes : l'UI masque la carte
  // d'authentification (store.mode === 'live').

  /** État de connexion courant (null = non connecté). */
  auth?(): MerchantAuth | null;

  /** Envoie le code OTP par SMS au numéro E.164 (ex. "+21620000000"). */
  requestOtp?(phone: string): Promise<boolean>;

  /** Vérifie le code reçu → session ouverte. Null si code invalide. */
  verifyOtp?(phone: string, code: string): Promise<MerchantAuth | null>;

  /** Lie le commerce au compte connecté via l'ancien PIN (une seule fois). */
  claimMerchant?(merchantId: string, pin: string): Promise<boolean>;

  /** Ferme la session commerçant. */
  signOut?(): Promise<void>;

  // ── Notifications push (étape 3c — optionnel, live uniquement) ────

  /** Enregistre l'abonnement Web Push de cet appareil (upsert par endpoint). */
  savePushSubscription?(sub: {
    endpoint: string;
    keys?: { p256dh?: string; auth?: string };
  }): Promise<boolean>;

  /** Supprime l'abonnement Web Push de cet appareil. */
  deletePushSubscription?(endpoint: string): Promise<boolean>;

  destroy(): void;
}
