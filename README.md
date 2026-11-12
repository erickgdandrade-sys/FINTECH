# Nivo — Sua vida financeira em outro nível

Plataforma de finanças pessoais com o **Nivi**, assistente financeiro com IA.

## Rodando localmente

Requer Node.js 20+.

```sh
npm i
npm run dev      # http://localhost:3000
npm run build    # build de produção
npm run preview  # serve o build
```

## Estrutura

- `src/styles.css` — tokens da identidade visual (paleta Nivo, Inter, raios, sombras)
- `src/components/brand.tsx` — logo N, ícone do app e mascote Nivi (SVG)
- `src/components/app-shell.tsx` — sidebar, topbar mobile, cabeçalho de página e modo privacidade (ocultar valores)
- `src/components/dashboard.tsx` — cards da Visão Geral
- `src/components/nivi-chat.tsx` — chat flutuante do Nivi (respostas locais de demonstração)
- `src/lib/data.ts` — dados de demonstração (troque pela sua API)
- `src/routes/` — páginas (Visão geral, Transações, Metas e demais seções)

## Stack

- TanStack Start
- React + TypeScript
- Tailwind CSS v4
- Recharts e Lucide
