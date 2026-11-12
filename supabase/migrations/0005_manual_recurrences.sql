-- Assinaturas e compras parceladas cadastradas pelo usuário.
create table if not exists public.manual_recurrences (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind         text not null check (kind in ('assinatura', 'parcelado')),
  name         text not null check (char_length(name) between 1 and 80),
  amount       numeric(14, 2) not null check (amount > 0),        -- valor de cada cobrança/parcela
  category     text not null default 'assinaturas',
  day          smallint not null check (day between 1 and 31),     -- dia da cobrança
  start_date   date not null,                                       -- primeira cobrança
  end_date     date,                                                -- última cobrança (obrigatória em parcelado)
  installments smallint check (installments is null or installments between 1 and 120),
  created_at   timestamptz not null default now(),
  check (kind = 'assinatura' or end_date is not null),
  check (end_date is null or end_date >= start_date)
);
create index if not exists manual_recurrences_user_idx on public.manual_recurrences (user_id);

alter table public.manual_recurrences enable row level security;
drop policy if exists "manual_recurrences: dono gerencia" on public.manual_recurrences;
create policy "manual_recurrences: dono gerencia" on public.manual_recurrences for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
