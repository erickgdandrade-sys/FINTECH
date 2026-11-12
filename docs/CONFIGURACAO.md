# Configurando o Open Finance (Pluggy + Supabase)

Passo a passo para sair do modo demonstração e ver seus dados reais no Nivo.
Nenhuma chave vai para o código: tudo fica no arquivo `.env` (que não é enviado ao GitHub).

## 1. Supabase (banco de dados e login)

1. Crie uma conta em https://supabase.com e clique em **New project**.
   Escolha a região **South America (São Paulo)**, defina uma senha do banco e aguarde ~2 minutos.
2. No menu lateral, abra **SQL Editor → New query**, cole o conteúdo de
   `supabase/migrations/0001_open_finance.sql` e clique em **Run**.
   Isso cria as tabelas de bancos conectados, contas e transações, com cada usuário vendo só os próprios dados.
3. Abra **Project Settings → API** e copie para o `.env`:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role** (clique em "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`
     ⚠️ Essa chave dá acesso total ao banco. Nunca compartilhe nem coloque no app de celular.
4. (Opcional, para testes) Em **Authentication → Sign In / Providers → Email**, desligue
   **Confirm email** para poder entrar logo após criar a conta.

## 2. Pluggy (Open Finance)

1. Crie uma conta em https://meu.pluggy.ai.
2. Vá em **Applications** (ou **Aplicações**) e crie uma aplicação. Comece no ambiente de **desenvolvimento/sandbox**.
3. Copie o **Client ID** e o **Client Secret** para o `.env`:
   - `PLUGGY_CLIENT_ID`
   - `PLUGGY_CLIENT_SECRET`
4. Deixe `VITE_PLUGGY_SANDBOX=true` para aparecer o banco de teste **Pluggy Bank** no widget.
   As credenciais de teste aparecem na própria tela do widget/documentação da Pluggy.
5. Para conectar bancos reais, a Pluggy pede a ativação do plano/produção no dashboard.

## 3. Rodar

```sh
cp .env.example .env   # e preencha
npm install
npm run dev            # http://localhost:3000
```

Crie sua conta em **Entrar → Criar conta**, vá em **Contas → Conectar banco** e escolha o Pluggy Bank.
Ao terminar, o Nivo importa contas e 12 meses de transações, e o dashboard passa a mostrar seus dados.

## 4. Webhooks (atualização automática) — quando o app estiver publicado

A Pluggy avisa o Nivo quando chegam transações novas. Isso só funciona com uma URL pública HTTPS
(em `localhost` use o botão **Atualizar** na tela de Contas).

- `PUBLIC_APP_URL` → endereço do app publicado, ex.: `https://nivo.seudominio.com.br`
- `PLUGGY_WEBHOOK_SECRET` → um texto longo e aleatório (ex.: gere com `openssl rand -hex 32`)

O endereço `/api/pluggy/webhook` é registrado automaticamente em cada conexão.

## Como funciona (resumo técnico)

| Peça | Arquivo |
| --- | --- |
| Tabelas e regras de acesso (RLS) | `supabase/migrations/0001_open_finance.sql` |
| Connect token, registrar/atualizar/desconectar banco | `src/lib/open-finance.ts` (funções de servidor) |
| Sincronização Pluggy → banco | `src/server/sync.ts` |
| Webhook da Pluggy | `src/routes/api/pluggy/webhook.ts` |
| Login e leitura dos dados no app | `src/lib/supabase.ts`, `src/lib/finance.tsx` |
| Tela de Contas com o widget | `src/routes/contas.tsx` |

- O navegador nunca vê o Client Secret da Pluggy nem a service role do Supabase.
- Toda gravação vem da API da Pluggy (fonte da verdade); o webhook só dispara uma nova busca.
- Cada conexão leva `clientUserId` = id do usuário, e o servidor confere o dono antes de salvar.
