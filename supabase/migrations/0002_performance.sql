-- Otimizações sugeridas pelo Supabase Advisor.

-- Índices nas chaves estrangeiras (deletes em cascata e joins mais rápidos).
create index if not exists accounts_item_idx on public.accounts (item_id);
create index if not exists transactions_account_idx on public.transactions (account_id);
create index if not exists transactions_item_idx on public.transactions (item_id);

-- RLS: avalia auth.uid() uma vez por consulta, não uma vez por linha.
drop policy if exists "items: dono lê" on public.pluggy_items;
create policy "items: dono lê" on public.pluggy_items for select using ((select auth.uid()) = user_id);

drop policy if exists "accounts: dono lê" on public.accounts;
create policy "accounts: dono lê" on public.accounts for select using ((select auth.uid()) = user_id);

drop policy if exists "transactions: dono lê" on public.transactions;
create policy "transactions: dono lê" on public.transactions for select using ((select auth.uid()) = user_id);
