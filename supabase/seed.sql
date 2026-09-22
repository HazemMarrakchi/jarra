-- ═══════════════════════════════════════════════════════════════════
-- JARRA — Données de démarrage (pilote Gabès)
-- Les 14 commerçants-types de la démo, avec leurs vraies coordonnées
-- (WGS84) et les mêmes identifiants (m01…m14) que le moteur simulé.
-- PIN commerçant par défaut : 1234 — À CHANGER à l'onboarding :
--   update merchants set pin_hash = crypt('VOTRE_PIN', gen_salt('bf'))
--   where id = 'm01';
-- ═══════════════════════════════════════════════════════════════════

insert into public.merchants (id, name, kind, lat, lon, area, verified, rating, rating_count)
values
  ('m01', 'Fournil de la Médina',        'bakery',     33.8815, 10.0982, 'Médina',       true, 4.7, 132),
  ('m02', 'Boulangerie Chott Salem',     'bakery',     33.9080, 10.1140, 'Chott Salem',  true, 4.5, 88),
  ('m03', 'Le Pain de Teboulbou',        'bakery',     33.9770, 10.0570, 'Teboulbou',    true, 4.6, 74),
  ('m04', 'Le Croissant de Gabès',       'patisserie', 33.8830, 10.1010, 'Médina',       true, 4.8, 210),
  ('m05', 'Délices de l''Oasis',         'patisserie', 33.9040, 10.1060, 'Chott Salem',  true, 4.6, 96),
  ('m06', 'Sucré-Salé Menzel',           'patisserie', 33.8900, 10.0870, 'Menzel',       false, 4.3, 41),
  ('m07', 'Le Comptoir du Port',         'restaurant', 33.8760, 10.1060, 'Médina',       true, 4.4, 157),
  ('m08', 'Chez Salah — Cheniki',        'restaurant', 33.8690, 10.1130, 'Cheniki',      true, 4.7, 189),
  ('m09', 'La Table de Ghannouch',       'restaurant', 33.9270, 10.0550, 'Ghannouch',    true, 4.5, 63),
  ('m10', 'Épicerie du Souk',            'grocery',    33.9110, 10.1180, 'Chott Salem',  true, 4.2, 52),
  ('m11', 'Marché Bio de l''Oasis',      'grocery',    33.8650, 10.0820, 'Sidi Driss',   true, 4.8, 118),
  ('m12', 'Supérette El Menzel',         'grocery',    33.8930, 10.0910, 'Menzel',       false, 4.1, 37),
  ('m13', 'Fournil Sidi Driss',          'bakery',     33.8670, 10.0780, 'Sidi Driss',   true, 4.6, 91),
  ('m14', 'Couscous House Oued Akhrich', 'restaurant', 33.8730, 10.1040, 'Oued Akhrich', true, 4.5, 77)
on conflict (id) do nothing;

-- Quelques paniers ouverts pour que la carte ne soit pas vide au
-- lancement (créneaux relatifs à l'heure d'exécution du script).
insert into public.baskets
  (merchant_id, title, description, original_price, rescue_price, quantity_total, quantity_left, pickup_from, pickup_to)
values
  ('m01', 'Panier du fournil', 'Baguettes tradition, pain au seigle, croissants du jour.',
   8500, 3000, 4, 4, now() - interval '1 hour', now() + interval '3 hours'),
  ('m04', 'Douceurs du jour', 'Parts de gâteaux, éclairs et tartelettes du jour.',
   15000, 5500, 3, 3, now() - interval '30 minutes', now() + interval '2 hours 30 minutes'),
  ('m08', 'Plat du jour à emporter', 'Le plat du jour complet, préparé à midi et jamais servi en salle.',
   11000, 3800, 2, 2, now() - interval '1 hour', now() + interval '2 hours'),
  ('m11', 'Cagette primeur fraîcheur', 'Fruits et légumes de saison à consommer sous 48 heures.',
   6500, 2200, 5, 5, now() - interval '2 hours', now() + interval '4 hours');
