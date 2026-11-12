-- Nivo · Open Finance (Pluggy)
-- Rode no Supabase: SQL Editor → cole este arquivo → Run.
-- Leitura: cada usuário só enxerga as próprias linhas (RLS).
-- Escrita: só o servidor (service role) grava, a partir dos dados da Pluggy.

create table if not exists public.pluggy_items (
  id               text primary key,               -- itemId da Pluggy
  user_id          uuid not null references auth.users (id) on delete cascade,
  connector_id     integer,
  connector_name   text not null,
  connector_image  text,
  primary_color    text,
  status           text not null,                  -- UPDATED | UPDATING | LOGIN_ERROR | OUTDATED | ...
  execution_status text,
  error_message    text,
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists public.accounts (
  id                     text primary key,         -- accountId da Pluggy
  item_id                text not null references public.pluggy_items (id) on delete cascade,
  user_id                uuid not null references auth.users (id) on delete cascade,
  type                   text not null,            -- BANK | CREDIT
  subtype                text,                     -- CHECKING_ACCOUNT | SAVINGS_ACCOUNT | CREDIT_CARD
  name                   text not null,
  number                 text,
  balance                numeric(14, 2) not null default 0,
  currency_code          text not null default 'BRL',
  credit_limit           numeric(14, 2),
  available_credit_limit numeric(14, 2),
  balance_due_date       date,
  balance_close_date     date,
  minimum_payment        numeric(14, 2),
  updated_at             timestamptz not null default now()
);

create table if not exists public.transactions (
  id            text primary key,                  -- transactionId da Pluggy
  account_id    text not null references public.accounts (id) on delete cascade,
  item_id       text not null references public.pluggy_items (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  date          date not null,
  description   text not null,
  amount        numeric(14, 2) not null,           -- negativo = saída, positivo = entrada
  type          text not null,                     -- DEBIT | CREDIT
  category      text,                              -- categoria da Pluggy
  category_id   text,
  status        text,                              -- PENDING | POSTED
  merchant_name text,
  installment   text,                              -- ex.: "3/10" em compras parceladas
  updated_at    timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists accounts_user_idx on public.accounts (user_id);
create index if not exists items_user_idx on public.pluggy_items (user_id);

alter table public.pluggy_items enable row level security;
alter table public.accounts     enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "items: dono lê" on public.pluggy_items;
create policy "items: dono lê" on public.pluggy_items for select using ((select auth.uid()) = user_id);

drop policy if exists "accounts: dono lê" on public.accounts;
create policy "accounts: dono lê" on public.accounts for select using ((select auth.uid()) = user_id);

drop policy if exists "transactions: dono lê" on public.transactions;
create policy "transactions: dono lê" on public.transactions for select using ((select auth.uid()) = user_id);
