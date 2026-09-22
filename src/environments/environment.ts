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
  supabaseUrl: 'https://arwxxhryhhlzlsafhtae.supabase.co',
  /** Clé publique « anon » (Settings → API dans la console Supabase) */
  supabaseAnonKey: 'sb_publishable_nFEB5TEghhn5rninvzCmIA_QYP6i4Ot',
  /** Clé VAPID PUBLIQUE (notifications push, étape 3c).
   *  La clé privée associée reste dans les secrets de l'Edge Function. */
  vapidPublicKey: 'BL7rdI9yXEeQNL-D3N0PWbQztFsYupTfVPd-7CykgijSJ6xe_-xmc1wtbG0J4ecBNUb8A4JSUa3EiaNg1oqLbdQ',
};
