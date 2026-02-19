# Omen Frontend

eCommerce UX co-pilot — a Next.js dashboard for managing AI-generated A/B experiments on Shopify stores.

Pairs with [omen-backend](https://github.com/Simon-Bruno/omen-backend). The frontend is a thin proxy layer: all AI, auth, and data operations live in the backend.

## What it does

- **AI chat interface** — Conversational assistant (powered by `@assistant-ui/react`) for experiment planning. Ask it to analyse your brand, generate variants, or create experiments.
- **Custom tool UIs** — The assistant renders rich in-line UI for each tool: variant previews, brand analysis cards, experiment creation flows, live job status
- **A/B experiment management** — Create, activate, pause, and conclude experiments; track status in real time via Socket.io
- **Analytics dashboard** — Recharts-based visualisations of experiment performance
- **Animated variant preview** — Framer Motion transitions for comparing variant implementations

## Stack

| | |
|---|---|
| Framework | Next.js 15 (Turbopack) + React 19 |
| AI chat | `@assistant-ui/react` + Vercel AI SDK |
| Styling | Tailwind CSS 4 + Radix UI + shadcn patterns |
| Animations | Framer Motion |
| Charts | Recharts |
| Auth | Better Auth (cookie-based, proxied to backend) |
| Real-time | Socket.io |

## Getting started

```bash
npm install
cp .env.example .env
# set BACKEND_URL and NEXT_PUBLIC_BACKEND_URL to your omen-backend instance

npm run dev   # http://localhost:3000
```

Requires a running [omen-backend](https://github.com/Simon-Bruno/omen-backend) instance (default: `http://localhost:3001`).

## Architecture

All auth and AI calls are proxied through Next.js API routes to the backend — the frontend never holds credentials directly.

```
app/
  api/          # Proxy routes → backend (auth, chat, analytics, jobs)
  analytics/    # Analytics dashboard
  login/        # Auth page
  assistant.tsx # Main chat component

components/
  assistant-ui/ # Custom tool UIs + chat thread
  analytics/    # Chart components
  ui/           # Reusable primitives

contexts/       # AuthProvider, VariantJobsProvider
lib/            # API clients, Better Auth config, types
```

See [AGENTS.md](./AGENTS.md) for full architecture details and custom tool documentation.
