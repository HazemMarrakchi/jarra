-- ═══════════════════════════════════════════════════════════════════
-- JARRA — Migration étape 2 : authentification commerçant (OTP téléphone)
-- À exécuter APRÈS schema.sql et seed.sql (SQL Editor → Run).
--
-- Principe :
--   · Le commerçant se connecte avec son numéro de téléphone
--     (Supabase Auth, OTP par SMS — voir README section « Auth »).
--   · Une fois connecté, il « revendique » son commerce UNE FOIS avec
--     l'ancien PIN (claim_merchant) → merchants.owner_id = son user id.
--   · Dès qu'un commerce est revendiqué, le PIN ne suffit plus :
--     publish_basket et collect_order exigent la session du propriétaire.
--   · Un commerce non revendiqué continue de fonctionner au PIN
--     (transition en douceur pendant le pilote).
-- ═══════════════════════════════════════════════════════════════════

-- ── Revendication : lie le commerce au numéro connecté ─────────────
create or replace function public.claim_merchant(p_merchant_id text, p_pin text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare
  v_merchant merchants%rowtype;
begin
  -- Il faut être connecté (session OTP) pour revendiquer.
  if auth.uid() is null then
    return false;
  end if;

  select * into v_merchant from merchants where id = p_merchant_id;
  if not found then
    return false;
  end if;

  -- Déjà lié à un AUTRE numéro : refusé (il faudrait un support admin).
  if v_merchant.owner_id is not null and v_merchant.owner_id <> auth.uid() then
    return false;
  end if;

  -- Le PIN actuel fait office de preuve de possession du comptoir.
  if crypt(coalesce(p_pin, ''), v_merchant.pin_hash) <> v_merchant.pin_hash then
    return false;
  end if;

  update merchants set owner_id = auth.uid() where id = p_merchant_id;
  return true;
end $$;

-- ── Publication : session propriétaire si revendiqué, sinon PIN ────
create or replace function public.publish_basket(
  p_merchant_id text, p_pin text, p_title text, p_description text,
  p_original integer, p_rescue integer, p_quantity integer, p_pickup_to timestamptz
) returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_merchant merchants%rowtype;
  v_basket   baskets%rowtype;
begin
  select * into v_merchant from merchants where id = p_merchant_id;
  if not found then
    return null;
  end if;

  if v_merchant.owner_id is not null then
    -- Commerce revendiqué : seule la session du propriétaire peut publier.
    if auth.uid() is distinct from v_merchant.owner_id then
      return null; -- même réponse qu'un PIN invalide : rien à deviner.
    end if;
  elsif crypt(coalesce(p_pin, ''), v_merchant.pin_hash) <> v_merchant.pin_hash then
    return null; -- pas encore revendiqué : PIN obligatoire (bootstrap).
  end if;

  if p_original <= 0 or p_rescue <= 0 or p_rescue >= p_original
     or p_quantity < 1 or p_quantity > 50
     or p_pickup_to <= now() or p_pickup_to > now() + interval '36 hours'
     or length(trim(p_title)) < 2 then
    return null;
  end if;

  insert into baskets (merchant_id, title, description, original_price, rescue_price,
                       quantity_total, quantity_left, pickup_from, pickup_to)
  values (p_merchant_id, left(trim(p_title), 80), left(trim(p_description), 500),
          p_original, p_rescue, p_quantity, p_quantity, now(), p_pickup_to)
  returning * into v_basket;

  return json_build_object('id', v_basket.id);
end $$;

-- ── Validation d'un retrait : session propriétaire si revendiqué ────
create or replace function public.collect_order(p_code text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_order  orders%rowtype;
  v_owner  uuid;
begin
  -- Le code reste un secret porteur (remis au client), MAIS si le
  -- commerce est revendiqué on exige en plus la session du propriétaire
  -- : fini le brute-force du code à 4 caractères via l'API.
  select m.owner_id into v_owner
  from orders o
  join baskets b on b.id = o.basket_id
  join merchants m on m.id = b.merchant_id
  where o.pickup_code = upper(trim(p_code)) and o.status = 'reserved';

  if found and v_owner is not null and auth.uid() is distinct from v_owner then
    return null; -- même réponse qu'un code inconnu.
  end if;

  update orders set status = 'collected'
   where pickup_code = upper(trim(p_code)) and status = 'reserved'
  returning * into v_order;

  if not found then
    return null;
  end if;

  return json_build_object(
    'id', v_order.id, 'basketId', v_order.basket_id,
    'customerName', v_order.customer_name, 'pickupCode', v_order.pickup_code,
    'status', v_order.status, 'createdAt', v_order.created_at
  );
end $$;

-- ── Droits : claim accessible aux rôles API (l'auth est vérifiée ────
-- ── DANS la fonction, via auth.uid()). Les grants existants sur ─────
-- ── publish/collect couvrent déjà anon + authenticated. ─────────────
grant execute on function public.claim_merchant(text, text) to anon, authenticated;
