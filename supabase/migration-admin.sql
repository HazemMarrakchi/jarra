-- ═══════════════════════════════════════════════════════════════════
-- JARRA — Migration « section admin » (pilote Gabès)
-- À exécuter APRÈS schema.sql, seed.sql, migration-auth.sql (SQL Editor → Run).
--
-- Principe :
--   · Table `admins` : numéros de téléphone (E.164) autorisés à gérer
--     la plateforme. Ils se connectent par OTP comme les commerçants.
--   · `is_admin()` : vrai si le numéro de la session est dans `admins`.
--   · Toutes les opérations d'administration passent par des RPC
--     `security definer` qui exigent is_admin() — jamais d'accès
--     direct aux tables sensibles via l'API.
--
-- APRÈS l'exécution, ajoutez votre numéro (celui du compte OTP) :
--   insert into public.admins (phone, label) values ('+21620000000', 'Hazem');
-- ═══════════════════════════════════════════════════════════════════

-- ── Liste des administrateurs (non lisible via l'API) ────────────────
create table if not exists public.admins (
  phone      text primary key,          -- format E.164, ex. +21620000000
  label      text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- Aucune policy : personne ne peut lire/modifier la liste via l'API.

-- ── Test d'appartenance : numéro de la session présent dans admins ───
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as
$$
  select coalesce(auth.jwt() ->> 'phone', '') in (select phone from public.admins)
$$;

-- ── Ajouter un commerce (onboarding pilote) ──────────────────────────
-- Retourne { id, pin } : le PIN initial n'est visible qu'ici, une fois.
create or replace function public.admin_add_merchant(
  p_name text, p_kind text, p_area text, p_lat double precision, p_lon double precision
) returns json language plpgsql security definer set search_path = public, extensions as
$$
declare
  v_id  text;
  v_pin text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_kind not in ('bakery', 'patisserie', 'restaurant', 'grocery')
     or length(trim(p_name)) < 2 or length(trim(p_area)) < 2
     or p_lat not between -90 and 90 or p_lon not between -180 and 180 then
    raise exception 'invalid input';
  end if;

  v_pin := lpad(floor(random() * 10000)::int::text, 4, '0');
  insert into public.merchants (name, kind, area, lat, lon, verified, pin_hash)
  values (left(trim(p_name), 80), p_kind, left(trim(p_area), 60), p_lat, p_lon,
          true, crypt(v_pin, gen_salt('bf')))
  returning id into v_id;

  return json_build_object('id', v_id, 'pin', v_pin);
end
$$;

-- ── Régénérer le PIN d'un commerce ───────────────────────────────────
-- Le nouveau PIN est retourné en clair UNE SEULE FOIS (à noter !).
-- Effet de bord voulu : le commerce est DÉLIÉ de l'ancien numéro
-- (owner_id = null) pour permettre une nouvelle revendication.
create or replace function public.admin_reset_pin(p_merchant_id text)
returns text language plpgsql security definer set search_path = public, extensions as
$$
declare
  v_pin text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  v_pin := lpad(floor(random() * 10000)::int::text, 4, '0');
  update public.merchants
     set pin_hash = crypt(v_pin, gen_salt('bf')), owner_id = null
   where id = p_merchant_id;
  if not found then
    raise exception 'not found';
  end if;
  return v_pin;
end
$$;

-- ── Retirer un panier de la carte (modération anti-spam) ─────────────
-- Le schéma n'a que les statuts live/soldout : retirer = soldout à 0.
create or replace function public.admin_expire_basket(p_basket_id text)
returns boolean language plpgsql security definer set search_path = public as
$$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  update public.baskets set status = 'soldout', quantity_left = 0 where id = p_basket_id;
  return found;
end
$$;

-- ── Compteur d'abonnés push (table non lisible publiquement) ─────────
create or replace function public.admin_push_count()
returns integer language sql stable security definer set search_path = public as
$$
  select case when public.is_admin()
    then (select count(*)::int from public.push_subscriptions)
    else null end
$$;

-- ── Droits d'exécution (l'autorisation est vérifiée DANS chaque RPC) ─
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.admin_add_merchant(text, text, text, double precision, double precision) to anon, authenticated;
grant execute on function public.admin_reset_pin(text) to anon, authenticated;
grant execute on function public.admin_expire_basket(text) to anon, authenticated;
grant execute on function public.admin_push_count() to anon, authenticated;
