<div align="center">

# 🏺 JARRA

### La plateforme anti-gaspillage alimentaire — née à Gabès 🇹🇳

**Chaque jour, des tonnes de nourriture parfaitement consommable finissent à la poubelle pendant que des familles comptent chaque dinar.**
**Jarra connecte les invendus des commerçants aux citoyens — en temps réel, sur la carte de votre ville.**

[![Live Demo](https://img.shields.io/badge/🚀_Démo_live-hazemmarrakchi.github.io%2Fjarra-e8814f?style=for-the-badge)](https://hazemmarrakchi.github.io/jarra/)
[![License](https://img.shields.io/badge/license-MIT-d4a24a?style=for-the-badge)](LICENSE)
[![Made in Tunisia](https://img.shields.io/badge/made_in-Tunisia_🇹🇳-12100d?style=for-the-badge)](#)

</div>

---

## 🌍 Le problème

| | |
|---|---|
| 🥖 | **~900 000 tonnes** de nourriture gaspillées chaque année en Tunisie (estimations PAM/FBNI) |
| 🏪 | Les commerçants jettent leurs invendus faute de canal de revente rapide |
| 💸 | Les familles et étudiants cherchent à manger bien sans se ruiner |
| 🌱 | La nourriture jetée = eau, énergie, transport et CO₂ jetés avec elle |

### Pourquoi commencer par Gabès ?

> Gabès est la seule ville du monde où une **oasis date de la mer** — ici, la nourriture
> est une fierté : le **croissant de Gabès**, les dattes de l'oasis, le poisson du port,
> le souk de Chott Salem… Ce patrimoine mérite mieux que la poubelle. Jarra naît donc
> dans **ses** quartiers : la Médina, Chott Salem, Teboulbou, Cheniki, Menzel,
> Sidi Driss, Oued Akhrich, Ghannouch — avant de conquérir le reste du pays.

## 💡 La solution

Jarra est une **marketplace de sauvetage alimentaire en temps réel** :

- 🏪 **Les commerçants** publient leurs invendus du jour en 30 secondes (panier surprise, prix −50 à −70 %, créneau de retrait)
- 🧑 **Les citoyens** voient les paniers disponibles **en direct sur la carte**, réservent en 2 clics et récupèrent avec un code
- 🌍 **Tout le monde** suit l'impact collectif : repas sauvés, dinars économisés, CO₂ évité — quartier par quartier

> **Pourquoi « Jarra » ?** La jarra (جرّة) est la jarre en terre cuite tunisienne qui, depuis des siècles, **conserve et protège** la nourriture. C'est exactement notre mission : préserver au lieu de jeter.

---

## 🚀 Démo live

👉 **[hazemmarrakchi.github.io/jarra](https://hazemmarrakchi.github.io/jarra/)**

La démo tourne **100 % dans le navigateur** sur un moteur de simulation déterministe (ville de Gabès modélisée : commerçants, paniers, réservations et expirations en direct) — aucun backend requis pour l'explorer. La couche de données est **interchangeable** : le même front-end peut pointer vers l'API Supabase de production via une variable d'environnement. Le backend complet (schéma PostgreSQL, RLS, RPC transactionnelles, temps réel) est livré dans [`supabase/`](supabase/README.md) — 15 minutes suffisent pour passer en production.

> 📱 **Mobile-first** : Jarra s'utilise dans la rue, sur un téléphone. Testez la démo sur mobile.

---

## ✨ Fonctionnalités

### 🧑 Côté citoyen
- 🗺️ **Carte live** de la ville avec les commerçants actifs, filtrable par type et par rayon
- 🧺 **Paniers surprise** : contenu, prix d'origine vs prix Jarra, créneau de retrait, quantité restante en temps réel
- 🎫 **Réservation instantanée** avec code de retrait unique à présenter au commerçant
- 🔔 Alertes de proximité : « un panier à 3 TND vient d'apparaître à 400 m »
- ⭐ Notation après retrait — la confiance est la monnaie de la plateforme

### 🏪 Côté commerçant
- ⚡ **Publication en 30 secondes** : photo, prix, créneau — pensé pour être utilisé entre deux clients
- 📊 **Dashboard** : invendus publiés, taux de sauvetage, revenus récupérés, historique
- 🤖 **Prédiction IA** : « vendredi prochain, ~12 viennoiseries invendues probables » (moyennes glissantes saisonnières)
- 📈 Suggestions de **prix dynamiques** selon l'heure et la demande du quartier

### 🌍 Côté ville
- 📉 **Page Impact publique** : compteurs live (repas sauvés, kg de CO₂ évités, TND réinjectés), classement des quartiers, tendances hebdomadaires
- 🏆 Programme **« Quartier Zéro Gaspillage »** : objectifs collectifs et badges
---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         JARRA PLATFORM                         │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────────────────────────┐       │
│  │   Web / PWA  │   │        Front-end Angular 19      │       │
│  │ mobile-first │──▶│  carto live · réservation · PWA  │       │
│  └──────────────┘   └───────────────┬──────────────────┘       │
│                                     │ DataProvider (interface) │
│                    ┌────────────────┴────────────────┐          │
│                    ▼                                 ▼          │
│         ┌────────────────────┐          ┌────────────────────┐  │
│         │  Moteur simulé     │          │  Supabase Provider │  │
│         │  (démo, offline,   │          │  (production)      │  │
│         │   déterministe)    │          │  Postgres+Realtime │  │
│         └────────────────────┘          └─────────┬──────────┘  │
│                                                   │             │
│                          ┌────────────────────────┼───────────┐ │
│                          ▼                        ▼           │ │
│                  ┌───────────────┐        ┌──────────────┐    │ │
│                  │ Auth (OTP tél)│        │   Storage    │    │ │
│                  └───────────────┘        │  (photos)    │    │ │
│                                           └──────────────┘    │ │
│  ┌────────────────────────────────────────────────────────┐   │ │
│  │  Service prédictif (Python) — moyennes glissantes      │   │ │
│  │  saisonnières + suggestions de prix dynamiques         │   │ │
│  └────────────────────────────────────────────────────────┘   │ │
└────────────────────────────────────────────────────────────────┘
```

**Principes de conception :**

1. **Interface `DataProvider` unique** — le front ne sait pas s'il parle au moteur de démo ou à Supabase. Brancher le backend de production = une variable d'environnement, zéro refactor.
2. **Temps réel d'abord** — la disponibilité des paniers change en direct (Supabase Realtime / moteur simulé), pas de refresh.
3. **Offline-tolerant (PWA)** — la carte et les réservations déjà chargées restent consultables sans réseau.
4. **Déterminisme de la démo** — même seed ⇒ même ville : visiteurs et tests voient un comportement reproductible.

---

## 🧱 Stack technique

| Couche | Technologie | Justification |
|---|---|---|
| Front-end | **Angular 19** (standalone, signals) | Réactivité fine, écosystème robuste, PWA native |
| Carte | **Carte vectorielle custom (SVG)** | Zéro dépendance externe, rendu parfait sur mobile, stylisée à l'identité Jarra |
| Backend | **Supabase** (PostgreSQL + Auth + Realtime + Storage) | Temps réel natif, RLS pour la sécurité, free tier généreux |
| IA prédictive | **Python** — moyennes glissantes saisonnières | Honnête, explicable, pas de magie noire |
| PWA | Service worker, manifest, installable | Jarra s'utilise dans la rue, souvent en 4G instable |
| CI/CD | **GitHub Actions → GitHub Pages** | Chaque push sur `main` = démo redéployée, tests en gate |
| Qualité | Jasmine/Karma (Chrome headless) | Tests unitaires du moteur et des composants |

---

## 🔀 Modèle de données (cœur)

```sql
merchants  (id, name, kind, lat, lon, area, verified, rating, created_at)
baskets    (id, merchant_id, title, description, photo_url,
            original_price_tnd, rescue_price_tnd, quantity_total,
            quantity_left, pickup_from, pickup_to, status)
orders     (id, basket_id, customer_name, customer_phone,
            pickup_code, status, rating, created_at)
```

**Règles métier clés :**
- Un panier passe automatiquement en `expired` à la fin de son créneau → l'inventaire ne ment jamais
- `quantity_left` est décrémenté transactionnellement (pas de surréservation)
- Le code de retrait est un code court à 4 caractères, affiché côté citoyen, saisi côté commerçant
- Les métriques d'impact sont des **vues calculées depuis `orders` validées** — jamais des compteurs bidouillés

---

## 🧪 Qualité & tests

```bash
cd jarra
npm ci
npm run test    # Jasmine + Chrome headless
npm run build   # build de production
```

La CI exécute les tests à chaque push avant tout déploiement.

---

## 🛣️ Roadmap

- [x] Design system complet (terracotta · sable · olive — l'argile de la jarra)
- [x] Carte live vectorielle de Gabès, mobile-first
- [x] Cycle complet : publication → réservation → code de retrait → validation
- [x] Dashboard commerçant + prédiction des invendus
- [x] Page Impact publique avec compteurs live
- [x] Provider Supabase : schéma SQL, RLS, RPC transactionnelles, temps réel — voir [supabase/README.md](supabase/README.md)
- [x] Auth par téléphone OTP (commerçants) — étape 2
- [x] PIN unique par commerçant, QR de retrait, notifications push (Web Push) — étape 3
- [x] Open-data de l'impact (export CSV public sur la page Impact)
- [ ] Paiement intégré (D17 / Flouci) — nécessite un budget (comptes marchands)
- [ ] Programme « Quartier Zéro Gaspillage » (animation quartier, partenaires)
- [ ] Extension : Sfax, Sousse, Tunis — puis tout le Maghreb

---

## 📄 Licence

MIT — voir [LICENSE](LICENSE).

---

<div align="center">

**Sauvez un repas. Sauvez la planète. Une jarra à la fois.** 🏺

*Conçu et développé par [Hazem Marrakchi](https://github.com/HazemMarrakchi) — Tunisie 🇹🇳*

</div>
