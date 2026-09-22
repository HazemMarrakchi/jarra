-- ═══════════════════════════════════════════════════════════════════
-- JARRA — Étape 3c : notifications Web Push (100 % gratuit)
-- Table des abonnements push des appareils citoyens.
-- À exécuter UNE FOIS dans le SQL Editor du dashboard Supabase.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.push_subscriptions (
  endpoint   text primary key,          -- URL unique de l'appareil abonné
  p256dh     text not null,             -- clé de chiffrement du navigateur
  auth       text not null,             -- secret de chiffrement du navigateur
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Inscription / désinscription libres depuis l'app (clé anon).
drop policy if exists push_insert on public.push_subscriptions;
create policy push_insert on public.push_subscriptions
  for insert to anon, authenticated with check (true);

drop policy if exists push_delete on public.push_subscriptions;
create policy push_delete on public.push_subscriptions
  for delete to anon, authenticated using (true);

-- Lecture RÉSERVÉE à l'Edge Function (service role, qui contourne la RLS) :
-- les endpoints sont des données sensibles, jamais lisibles publiquement.
revoke select, update on public.push_subscriptions from anon, authenticated;
