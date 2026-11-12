-- Metas e orçamentos do usuário. O próprio usuário cria/edita/apaga os seus (RLS).

create table if not exists public.goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  target     numeric(14, 2) not null check (target > 0),
  current    numeric(14, 2) not null default 0 check (current >= 0),
  due_date   date,
  icon       text not null default 'sonho',
  color      text not null default '#6a00ff' check (color ~ '^#[0-9a-fA-F]{6}$'),
  priority   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists goals_user_idx on public.goals (user_id);

create table if not exists public.budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category      text not null check (char_length(category) between 1 and 40),
  monthly_limit numeric(14, 2) not null check (monthly_limit > 0),
  created_at    timestamptz not null default now(),
  unique (user_id, category)
);

alter table public.goals   enable row level security;
alter table public.budgets enable row level security;

drop policy if exists "goals: dono gerencia" on public.goals;
create policy "goals: dono gerencia" on public.goals for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "budgets: dono gerencia" on public.budgets;
create policy "budgets: dono gerencia" on public.budgets for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
