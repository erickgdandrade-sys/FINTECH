-- Planejamento mensal: um plano por usuário por mês, com as linhas em JSON.
create table if not exists public.month_plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  month      date not null check (extract(day from month) = 1),
  income     numeric(14, 2) not null default 0 check (income >= 0),
  lines      jsonb not null default '[]'::jsonb check (jsonb_typeof(lines) = 'array'),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

alter table public.month_plans enable row level security;

drop policy if exists "plans: dono gerencia" on public.month_plans;
create policy "plans: dono gerencia" on public.month_plans for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
