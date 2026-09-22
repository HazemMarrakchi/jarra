-- ═══════════════════════════════════════════════════════════════════
-- JARRA — Schéma Supabase (PostgreSQL 15+)
-- À exécuter dans l'éditeur SQL de votre projet Supabase (SQL Editor).
-- Ordre : extensions → tables → RLS → fonctions RPC → vues → realtime.
-- Toutes les mutations passent par des fonctions RPC `security definer`
-- : la clé anon ne peut RIEN modifier directement, seulement lire.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Tables ──────────────────────────────────────────────────────────

-- Les commerçants. `pin_hash` protège la publication (code remis à
-- l'onboarding, hashé bcrypt via pgcrypto). `owner_id` est réservé à
-- l'auth par téléphone (étape suivante) — nullable pour le pilote.
create table if not exists public.merchants (
  id           text primary key default gen_random_uuid()::text,
  name         text not null,
  kind         text not null check (kind in ('bakery', 'patisserie', 'restaurant', 'grocery')),
  lat          double precision not null,
  lon          double precision not null,
  area         text not null,
  verified     boolean not null default false,
  rating       numeric(2,1) not null default 4.5 check (rating between 0 and 5),
  rating_count integer not null default 0,
  pin_hash     text not null default crypt('1234', gen_salt('bf')),
  owner_id     uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Les paniers. Prix en MILLIMES tunisiens (1000 = 1 TND).
-- Le statut 'expired' n'est jamais stocké : il est CALCULÉ (pickup_to
-- dépassé) côté vue/frontend — l'inventaire ne peut pas mentir.
create table if not exists public.baskets (
  id             text primary key default gen_random_uuid()::text,
  merchant_id    text not null references public.merchants (id) on delete cascade,
  title          text not null,
  description    text not null default '',
  original_price integer not null check (original_price > 0),
  rescue_price   integer not null check (rescue_price > 0 and rescue_price < original_price),
  quantity_total integer not null check (quantity_total > 0),
  quantity_left  integer not null check (quantity_left >= 0),
  pickup_from    timestamptz not null default now(),
  pickup_to      timestamptz not null,
  status         text not null default 'live' check (status in ('live', 'soldout')),
  created_at     timestamptz not null default now()
);
create index if not exists baskets_merchant_idx on public.baskets (merchant_id);
create index if not exists baskets_live_idx on public.baskets (status, pickup_to);

-- Les commandes. pickup_code est le secret partagé comptoir/client.
create table if not exists public.orders (
  id            text primary key default gen_random_uuid()::text,
  basket_id     text not null references public.baskets (id) on delete cascade,
  customer_name text not null,
  pickup_code   text not null unique,
  status        text not null default 'reserved' check (status in ('reserved', 'collected', 'cancelled')),
  created_at    timestamptz not null default now()
);
create index if not exists orders_basket_idx on public.orders (basket_id);
create index if not exists orders_status_idx on public.orders (status, created_at);

-- ── Sécurité (RLS) : lecture publique, écriture interdite ──────────
-- Les mutations passent exclusivement par les RPC ci-dessous.
alter table public.merchants enable row level security;
alter table public.baskets   enable row level security;
alter table public.orders    enable row level security;

drop policy if exists merchants_read on public.merchants;
create policy merchants_read on public.merchants for select using (true);
drop policy if exists baskets_read on public.baskets;
create policy baskets_read on public.baskets for select using (true);
drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select using (true);

-- ── Code de retrait : 4 caractères, sans ambiguïté (pas de 0/O/1/I/L) ─
create or replace function public.gen_pickup_code()
returns text language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', floor(random() * 31 + 1)::int, 1), '')
  from generate_series(1, 4)
$$;

-- ── RPC : réserver un panier (atomique — pas de surréservation) ────
create or replace function public.reserve_basket(p_basket_id text, p_customer_name text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_basket baskets%rowtype;
  v_order  orders%rowtype;
begin
  -- UPDATE conditionnel = verrou de ligne : deux clients simultanés ne
  -- peuvent pas réserver la dernière unité en double.
  update baskets
     set quantity_left = quantity_left - 1,
         status = case when quantity_left - 1 <= 0 then 'soldout' else status end
   where id = p_basket_id
     and status = 'live'
     and quantity_left > 0
     and now() < pickup_to
  returning * into v_basket;

  if not found then
    return null;
  end if;

  insert into orders (basket_id, customer_name, pickup_code)
  values (p_basket_id, left(coalesce(nullif(trim(p_customer_name), ''), 'Client Jarra'), 60), gen_pickup_code())
  returning * into v_order;

  return json_build_object(
    'id', v_order.id, 'basketId', v_order.basket_id,
    'customerName', v_order.customer_name, 'pickupCode', v_order.pickup_code,
    'status', v_order.status, 'createdAt', v_order.created_at
  );
end $$;

-- ── RPC : annuler une réservation (quantité restituée) ─────────────
create or replace function public.cancel_order(p_order_id text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
begin
  update orders set status = 'cancelled'
   where id = p_order_id and status = 'reserved'
  returning * into v_order;

  if not found then
    return false;
  end if;

  -- Restitue l'unité si le créneau du panier est encore ouvert.
  update baskets
     set quantity_left = quantity_left + 1,
         status = 'live'
   where id = v_order.basket_id
     and now() < pickup_to;

  return true;
end $$;

-- ── RPC : valider un retrait au comptoir (le code est le secret) ───
create or replace function public.collect_order(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
begin
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

-- ── RPC : publier un panier (protégé par le PIN du commerçant) ─────
create or replace function public.publish_basket(
  p_merchant_id text, p_pin text, p_title text, p_description text,
  p_original integer, p_rescue integer, p_quantity integer, p_pickup_to timestamptz
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_merchant merchants%rowtype;
  v_basket   baskets%rowtype;
begin
  select * into v_merchant from merchants where id = p_merchant_id;
  if not found or crypt(coalesce(p_pin, ''), v_merchant.pin_hash) <> v_merchant.pin_hash then
    return null; -- PIN invalide : même réponse qu'un commerce inconnu.
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

-- ── Vues d'impact : calculées depuis les retraits validés ──────────
-- Jamais de compteurs bidouillés : tout découle de `orders`.

create or replace view public.v_impact as
select
  count(*) filter (where o.status = 'collected')::int                    as meals_saved,
  round(count(*) filter (where o.status = 'collected') * 2.5, 1)         as co2_kg_avoided,
  coalesce(sum(b.original_price - b.rescue_price)
           filter (where o.status = 'collected'), 0)::numeric / 1000     as tnd_saved,
  (select count(distinct merchant_id)::int from baskets
    where status = 'live' and quantity_left > 0 and now() < pickup_to)   as merchants_active
from orders o
join baskets b on b.id = o.basket_id;

create or replace view public.v_impact_by_area as
select m.area, count(*)::int as meals
from orders o
join baskets b on b.id = o.basket_id
join merchants m on m.id = b.merchant_id
where o.status = 'collected'
group by m.area
order by meals desc;

create or replace view public.v_weekly_trend as
with days as (
  select generate_series(
    date_trunc('day', now()) - interval '6 days',
    date_trunc('day', now()),
    interval '1 day'
  )::date as day
)
select d.day, count(o.id)::int as meals
from days d
left join orders o
  on o.status = 'collected' and o.created_at >= d.day
 and o.created_at < d.day + interval '1 day'
group by d.day
order by d.day;

-- ── Temps réel : pousse les changements vers les clients ───────────
alter publication supabase_realtime add table public.baskets;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.merchants;

-- ── Droits : lecture via PostgREST, mutations via RPC uniquement ───
grant execute on function public.reserve_basket(text, text) to anon, authenticated;
grant execute on function public.cancel_order(text) to anon, authenticated;
grant execute on function public.collect_order(text) to anon, authenticated;
grant execute on function public.publish_basket(text, text, text, text, integer, integer, integer, timestamptz) to anon, authenticated;
