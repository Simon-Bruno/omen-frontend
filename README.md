# Omen — eCommerce UX Co-Pilot

Omen is a conversational A/B testing platform for Shopify and general eCommerce stores. You talk to an AI assistant, it analyses your brand, generates UX hypotheses, produces HTML/CSS variants, previews them live on your store, and launches the experiment — all from a single chat thread.

Pairs with [omen-backend](https://github.com/Simon-Bruno/omen-backend). The frontend is a thin proxy: all AI inference, auth logic, and data operations run on the backend.

---

## What it looks like

The main view is a two-panel layout: a chat thread on the left and a **Copilot Console** on the right. The console shows a 2×2 checkpoint grid (Brand Analysis / Hypotheses / Variants / Launch), a collapsible experiment timeline, and a live visitor sparkline — all derived from the thread state via MutationObserver, with no additional API calls.

The funnel from first message to live experiment:

1. **Brand analysis** — on first login, a background job scrapes the store and builds a brand profile (personality words, trait scores, palette). A loading screen with a polling loop blocks the UI until the job completes, then `refetchUser` refreshes the session so `user.project.brandAnalysis` is populated and the chat unlocks.

2. **Hypotheses** — the assistant calls `generate_hypotheses`; the tool UI renders an expandable card with a progressive reveal animation (5 stages, 100ms apart), showing primary outcome, current performance baseline (3.2%), and expected lift range from the backend schema.

3. **Variants** — the assistant calls `generate_variants`, which returns `jobIds` for background generation jobs. The `VariantsDisplay` component immediately renders skeleton cards with spinning progress bars and polls `/api/jobs/:id` every 10 s until each job completes, then replaces the placeholder with the real variant card. Per-variant actions: preview (opens store with `?preview=true&jobId=...`), accept, decline, regenerate (fires `POST /api/jobs/:id/variants/0/improve`), or open a feedback modal for guided iteration.

4. **Experiment preview** — `ExperimentPreviewDisplay` shows hypothesis, expected lift, variant traffic allocations (90% split evenly across variants, 10% to control), and configuration status.

5. **Experiment launch** — `ExperimentCreationDisplay` fires canvas-confetti on completion, shows a live badge, and links directly to the analytics page pre-filtered to that experiment.

6. **Analytics** — a separate `/analytics` route with four tabs: Overview (KPI grid, traffic split chart, purchase analytics, goals breakdown), Experiments, User Journey (per-session event timeline), and Raw Events.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) + React 19 |
| Language | TypeScript 5 |
| AI chat | `@assistant-ui/react` + `@assistant-ui/react-ai-sdk` + Vercel AI SDK v5 |
| Styling | Tailwind CSS 4 + Radix UI primitives + shadcn/ui patterns |
| Animations | Framer Motion 12 |
| Charts | Recharts 3 |
| Auth | Better Auth (cookie-based, proxied to backend) |
| Real-time | Socket.io client |
| Font | DM Sans variable font (local, self-hosted) |

---

## Interesting implementation details

### Proxy architecture

Every API route in `app/api/` is a thin forwarder. The chat route (`app/api/chat/route.ts`) reads the request body once, forwards it to `BACKEND_URL/api/chat` with the original cookies attached, then streams the response back using a manually constructed `ReadableStream` — preserving the AI SDK's chunked transfer and preventing proxy buffering.

```
Browser → /api/chat (Next.js) → backend:3001/api/chat (AI agent)
                           ← streaming SSE ←
```

### Custom tool UIs with `makeAssistantToolUI`

Each AI tool has a dedicated React component registered via `makeAssistantToolUI`. They receive `{ toolName, argsText, result, status }` and render different JSX for `running` / `complete` / `incomplete` states. The registry (`components/assistant-ui/tool-registry.tsx`) maps tool names to components; `Thread` mounts all of them at the root of `ThreadPrimitive.Root` so they intercept tool calls globally.

`check_variants` is registered with `render: () => null` — a deliberate no-op to suppress the raw function call bubble from appearing in the thread.

### Stage-aware composer suggestions

`ComposerSuggestions` uses a `MutationObserver` on the thread viewport to detect which `data-stage` attributes are present in the DOM, then surfaces context-appropriate quick-reply chips above the input. Chips are disabled while variant generation jobs are running (`hasRunningVariantJobs` from `VariantJobsContext`), preventing the user from sending a new message mid-job.

### Variant job lifecycle

`VariantJobsContext` tracks in-flight generation jobs. When `generate_variants` completes, `VariantsDisplay` extracts `jobIds` from the result, registers each with the context, and starts polling. The context's `hasRunningVariantJobs` boolean gates the send button and suggestion chips across the whole chat interface. After a job completes or fails, it stays in the context for 2 s (to show the terminal state) before being removed.

### Copilot Console timeline

The right-hand panel derives its timeline state entirely from DOM queries — `document.querySelector('[data-stage="..."]')` — rather than shared state. A `MutationObserver` on the thread viewport re-runs the check on any DOM change. Clicking a completed checkpoint calls `chatViewport.scrollTo(...)` to center the corresponding card in the thread.

---

## Setup

**Requirements:** Node 20+, a running [omen-backend](https://github.com/Simon-Bruno/omen-backend) instance.

```bash
git clone https://github.com/Simon-Bruno/omen-frontend
cd omen-frontend
npm install
```

Create `.env`:

```env
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_PREVIEW_URL=http://127.0.0.1:9292
```

```bash
npm run dev   # http://localhost:3000
```

The backend defaults to port 3001. Start it first — the frontend will 401 on every request until there is a session cookie from the backend auth layer.

### Registration flow

- **Shopify stores**: enter your `.myshopify.com` domain; the backend initiates Shopify OAuth and redirects back.
- **Other stores**: enter any `https://` URL; no OAuth step required.

After registration, the brand analysis job runs automatically. The UI shows a loading screen until the job completes, then transitions to the main chat.

---

## Directory structure

```
app/
  api/
    auth/         # Better Auth proxy → backend
    chat/         # Streaming chat proxy → backend
    analytics/    # Analytics API proxy
    jobs/         # Job status + variant improvement proxy
    brand-summary/ # Brand analysis job proxy
    welcome/      # Welcome message endpoint
  analytics/      # Analytics dashboard page
  login/          # Auth page (login + register)
  assistant.tsx   # AssistantRuntimeProvider + welcome message loader
  page.tsx        # Root: redirects to login, shows brand analysis gate, or chat

components/
  assistant-ui/
    thread.tsx           # Full thread implementation (messages, composer, suggestions)
    tool-registry.tsx    # makeAssistantToolUI registrations
    hypotheses-display.tsx
    variants-display.tsx
    experiment-preview-display.tsx
    experiment-creation-display.tsx
    brand-analysis-display.tsx
    brand-sources-display.tsx
    project-info-display.tsx
    copilot-console.tsx  # Right-hand panel
    stuck-suggestions.tsx
  analytics/             # Chart + table components for analytics page
  brandAnalysis/         # Brand analysis loading gate
  branding/              # InteractiveGradient (login page bg), BrandAnalysisLoading

contexts/
  auth-context.tsx          # Better Auth session → User + Project
  variant-jobs-context.tsx  # In-flight variant generation job tracking
  analytics-context.tsx     # Selected experiment ID for analytics page

lib/
  chat-api.ts        # ChatApiService: sessions, messages, job polling, variant improvement
  analytics-api.ts   # Experiment summary, sessions, events, reset
  better-auth.ts     # Better Auth client config
  chat-types.ts      # ChatMessage, Variant, JobStatus, BrandAnalysisResponse, ...
  utils.ts           # cn(), getPreviewBaseUrl()
```

See [AGENTS.md](./AGENTS.md) for notes on code style and architecture conventions used during development.
