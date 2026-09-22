# 🏺 Jarra — Backend Supabase

Ce dossier contient tout ce qu'il faut pour passer Jarra de la **démo
simulée** à la **production réelle** : base PostgreSQL, sécurité RLS,
fonctions RPC transactionnelles et temps réel.

## Principe d'architecture

Le front ne sait pas à quel backend il parle. `CityStore` délègue à un
`DataProvider` :

| Mode | Quand | Source |
|---|---|---|
| `demo` | `environment.ts` sans clés (défaut) | `CityEngine` — simulation in-browser, déterministe |
| `live` | `supabaseUrl` + `supabaseAnonKey` renseignés | **Supabase** — PostgreSQL + Realtime |

Brancher le backend = remplir deux valeurs, **zéro changement de code UI**.

## Mise en route (15 minutes)

### 1. Créer le projet
1. Compte sur [supabase.com](https://supabase.com) (free tier suffisant)
2. **New project** → nom `jarra`, région la plus proche (ex. Frankfurt), mot de passe DB quelconque

### 2. Créer le schéma
Dans **SQL Editor** du dashboard Supabase :
1. Coller le contenu de [`schema.sql`](./schema.sql) → **Run**
2. Coller le contenu de [`seed.sql`](./seed.sql) → **Run**

Cela crée : tables `merchants` / `baskets` / `orders`, politiques RLS
(lecture publique, écriture interdite), 4 fonctions RPC
(`reserve_basket`, `publish_basket`, `collect_order`, `cancel_order`),
3 vues d'impact, la publication Realtime, et les 14 commerçants du
pilote de Gabès.

### 3. Brancher le front
Dans **Settings → API**, récupérer `Project URL` et la clé `anon public`,
puis les écrire dans [`../src/environments/environment.ts`](../src/environments/environment.ts) :

```ts
export const environment = {
  production: true,
  supabaseUrl: 'https://VOTRE_PROJET.supabase.co',
  supabaseAnonKey: 'eyJhbGciOi...', // clé anon PUBLIQUE — sécurisée par RLS
};
```

> La clé `anon` est conçue pour être embarquée dans le front : la
> sécurité est assurée par les politiques RLS et les RPC. Ne jamais
> committer la clé `service_role`.

### 4. Déployer
`git push` → la CI reconstruit et déploie sur GitHub Pages. L'app bascule
automatiquement en mode live.

## Sécurité du pilote

- **Réservations** : ouvertes (nom suffit) — la quantité est décrémentée
  transactionnellement, impossible de sur-réserver.
- **Retraits** : le code à 4 caractères est le secret partagé comptoir/client.
- **Publications** : protégées par un **PIN commerçant** (hashé bcrypt).
  PIN par défaut du seed : `1234`. **Changez-le pour chaque commerçant** :

```sql
update merchants set pin_hash = crypt('NOUVEAU_PIN', gen_salt('bf')) where id = 'm01';
```

## Auth commerçant par OTP téléphone (étape 2)

La migration [`migration-auth.sql`](./migration-auth.sql) ajoute :

- `merchants.owner_id` — lie un commerce à un utilisateur Supabase Auth
- `claim_merchant(id, pin)` — liaison une-fois : session OTP + PIN actuel → `owner_id`
- `publish_basket` durcie : commerce lié → **session du propriétaire exigée** (le PIN est ignoré) ; non lié → PIN historique accepté (transition douce du pilote)
- `collect_order` durcie : commerce lié → le code de retrait ne suffit plus, **session du propriétaire exigée** (fin du brute-force sur 4 caractères)

### Mise en route

1. **SQL Editor** → coller `migration-auth.sql` → **Run**
2. **Authentication → Sign In / Providers → Phone** → activer
3. Pour le pilote, pas besoin de passerelle SMS payante : dans les réglages
   Phone, ajouter des **numéros de test** (ex. `+21620000000` → code fixe
   `123456`). Ces numéros ne reçoivent aucun SMS : le code est fixe.
4. Brancher ensuite un vrai fournisseur SMS (Twilio…) pour la production.

### Parcours commerçant (`/commercant`)

1. Saisir son numéro au format international (`+216…`) → **Recevoir le code**
2. Saisir le code SMS → session commerçant ouverte (persistée, restauration auto)
3. **Lier ce commerce** avec le PIN actuel (une dernière fois) → le commerce
   devient « le sien » : publication sans PIN, retraits protégés par session

## Notifications Web Push (étape 3c — 100 % gratuit)

Alerte « nouveau panier » envoyée à tous les appareils abonnés (citoyens),
via le service worker PWA déjà en place. Aucun SMS, aucun coût.

### Mise en route (dashboard Supabase uniquement)

1. **SQL Editor** → coller [`migration-push.sql`](./migration-push.sql) → **Run**
   (crée la table `push_subscriptions` : inscription/désinscription libres,
   lecture réservée au service role).
2. **Edge Functions** → **Create function** → nom : `notify-baskets` →
   coller le contenu de [`functions/notify-baskets/index.ts`](./functions/notify-baskets/index.ts) → **Deploy**.
3. **Edge Functions → Secrets** : ajouter
   - `VAPID_PUBLIC_KEY` = la clé publique (identique à celle de `environment.ts`)
   - `VAPID_PRIVATE_KEY` = la clé privée associée (**jamais dans git**)
   (`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement.)

### Fonctionnement

1. Sur `/explorer`, la carte **« 🔔 Alertes nouveaux paniers »** abonne
   l'appareil (permission navigateur → abonnement stocké en base).
2. À chaque publication, l'app appelle `notify-baskets` ; la fonction
   **revérifie le panier en base** (anti-spam) puis pousse la notif à tous.
3. Les abonnements expirés (404/410) sont purgés automatiquement.
4. Le clic sur la notif ouvre `/explorer` (géré par le service worker Angular).

> Limite honnête : iOS exige que l'app soit « installée » sur l'écran
> d'accueil (PWA) pour recevoir des notifications. Android/Chrome : direct.

## Étapes suivantes (roadmap)

- [x] Auth commerçant par téléphone OTP (colonne `merchants.owner_id`)
- [x] `collect_order` durci : propriétaire connecté exigé pour les commerces liés
- [x] PIN aléatoire unique par commerçant (`migration-pins.sql`)
- [x] Notifications push (Web Push API + Edge Function)
- [ ] Paiement intégré (D17 / Flouci) — nécessite un budget

## ✅ Checklist de lancement pilote

1. [x] `schema.sql` + `seed.sql` exécutés
2. [x] `migration-auth.sql` exécutée + Provider Phone activé
3. [x] `migration-pins.sql` exécutée — PINs uniques générés (CSV conservé hors git)
4. [ ] `migration-push.sql` exécutée (SQL Editor)
5. [ ] Edge Function `notify-baskets` déployée + secrets `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
6. [ ] Numéros de test OTP — **Authentication → Providers → Phone → Test phone numbers** :
      un numéro par commerçant, ex. `+21620000001` → code fixe `123456`
7. [ ] Chaque commerçant lie son commerce à son numéro
      (`/commercant` → Recevoir le code → « Lier ce commerce »)
8. [ ] Distribuer les PINs + former au scan QR au comptoir
