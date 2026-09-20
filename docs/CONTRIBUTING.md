# Contribuer à Jarra

Merci de l'intérêt ! Ce document décrit comment travailler sur le projet sans casser
la qualité.

## Mise en route

```bash
git clone https://github.com/HazemMarrakchi/jarra.git
cd jarra
npm ci
npm start          # http://localhost:4400
```

## Avant chaque commit

```bash
npm run test       # 39 tests — doivent tous passer
npm run build      # le build de production doit réussir
```

La CI rejoue les deux et déploie uniquement si tout est vert.

## Règles d'architecture

1. **Le UI ne parle jamais directement aux données.** Toute lecture/écriture passe par
   `CityStore`. Brancher Supabase plus tard = implémenter les mêmes méthodes, rien d'autre.
2. **Le moteur reste pur.** `CityEngine` ne dépend d'aucune API navigateur (`Math.random`,
   `Date.now`, DOM). C'est ce qui rend la démo déterministe et testable.
3. **Aucune donnée réelle.** Les commerçants, adresses et prix sont simulés et fictifs.
   Un commerçant réel ne peut être ajouté qu'avec son accord écrit.
4. **Mobile-first.** Toute nouvelle vue est vérifiée à 375 px de large, cibles tactiles ≥ 44 px.
5. **Design tokens uniquement.** Couleurs, rayons, ombres et animations viennent des
   variables CSS de `src/styles.css` — pas de valeurs en dur.

## Conventions

- Commits : `feat:`, `fix:`, `docs:`, `ui:`, `test:` (type puis portée courte).
- Un composant = un fichier, `standalone: true`, template et styles inline.
- Les specs vivent à côté du code qu'elles couvrent (`*.spec.ts`).
- Commentaires en français, orientés « pourquoi » et non « quoi ».

## Idées de contribution

- Provider Supabase (auth par téléphone OTP, RLS)
- Notifications push (Web Push API) pour les paniers proches
- Accessibilité : navigation clavier complète sur la carte
- Internationalisation (arabe tunisien / anglais)
