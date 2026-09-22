// ═══════════════════════════════════════════════════════════════════
// JARRA — Configuration d'environnement
// La clé « anon » de Supabase est PUBLIQUE par conception : la sécurité
// des données est assurée côté serveur par les politiques RLS et les
// fonctions RPC (voir supabase/schema.sql). On peut donc la committer.
// Tant que les deux champs sont vides, l'app tourne en mode DÉMO
// (moteur de simulation in-browser, aucun réseau).
// ═══════════════════════════════════════════════════════════════════
export const environment = {
  production: true,
  /** URL du projet Supabase — ex. https://abcdefgh.supabase.co */
  supabaseUrl: '',
  /** Clé publique « anon » (Settings → API dans la console Supabase) */
  supabaseAnonKey: '',
};
