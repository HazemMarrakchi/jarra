-- ═══════════════════════════════════════════════════════════════════
-- JARRA — Migration étape 3a : PIN unique par commerçant
-- ═══════════════════════════════════════════════════════════════════
--
-- POURQUOI : tous les commerces partagent le PIN « 1234 » du seed.
-- Tant que claim_merchant est public, quiconque connaît 1234 peut
-- revendiquer n'importe quel commerce depuis /commercant. Ce script
-- donne un PIN aléatoire distinct à chaque commerçant.
--
-- ⚠️  IMPORTANT — CONFIDENTIALITÉ :
--   · Les PIN générés s'affichent dans l'onglet « Messages » du SQL
--     Editor (RAISE NOTICE). COPIEZ-LES et gardez-les hors du dépôt
--     Git (le dépôt est public !). Remettez à chaque commerçant SON
--     code à l'onboarding, en main propre ou par message privé.
--   · Ce script NE contient aucun secret : il peut être commité,
--     les PIN sont tirés au sort à l'exécution.
--   · Les commerces déjà liés (owner_id non null) ne sont pas
--     concernés au quotidien : la session OTP remplace le PIN.
--     Leur nouveau PIN ne sert qu'en secours (support admin).
--
-- Exécution : SQL Editor → coller → Run → onglet « Messages ».
-- ═══════════════════════════════════════════════════════════════════

do $$
declare
  m     record;
  v_pin text;
begin
  for m in select id, name from public.merchants order by id loop
    -- PIN à 4 chiffres, tiré au sort (collisions entre commerces sans
    -- importance : le PIN n'est jamais testé que pour SON commerce).
    v_pin := lpad(floor(random() * 10000)::text, 4, '0');
    update public.merchants
       set pin_hash = extensions.crypt(v_pin, extensions.gen_salt('bf'))
     where id = m.id;
    raise notice '% | % | PIN : %', m.id, m.name, v_pin;
  end loop;
  raise notice '→ % commerçants mis à jour. Copiez ce tableau MAINTENANT (il ne sera plus jamais affiché).',
    (select count(*) from public.merchants);
end $$;

-- Vérification (ne révèle rien : seulement que les hash diffèrent) :
-- select id, left(pin_hash, 7) as empreinte from merchants order by id;
