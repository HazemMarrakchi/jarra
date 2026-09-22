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

## Étapes suivantes (roadmap)

- [ ] Auth commerçant par téléphone OTP (colonne `merchants.owner_id` déjà prévue)
- [ ] Durcir `collect_order` : restreindre au commerçant propriétaire une fois l'auth en place
- [ ] Paiement intégré (D17 / Flouci)
- [ ] Notifications push (Web Push API)
