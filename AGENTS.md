# Agents.md

This file provides guidance to Agents when working with code in this repository.

## IMPORTANT

- The user really wants elegance in his code, being as lean as possible with lines
- Respect React best practices at all times
- Be modular
- Following file structure best practices.

## Project Overview

Omen is an eCommerce UX Co-Pilot built with Next.js 15, React 19, and TypeScript. The frontend is a proxy layer that forwards requests to a separate backend service (running on port 3001 by default) for authentication and chat operations.

## Development Commands

- `npm run dev` - Start development server with Turbopack (runs on port 3000). Probably already on by the user though.
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Setup

Required environment variables in `.env`:

- `BACKEND_URL` - Backend API URL (default: http://localhost:3001)
- `NEXT_PUBLIC_BACKEND_URL` - Public-facing backend URL
- `NEXT_PUBLIC_PREVIEW_URL` - Preview URL for experiments (default: http://127.0.0.1:9292)
- Auth0 credentials (legacy, being replaced by Better Auth)


## Architecture

### Frontend/Backend Split

This is a **proxy frontend** that forwards all authentication and chat requests to a backend service:

- **Authentication**: Uses Better Auth (cookie-based) via `/api/auth/*` routes that proxy to backend
- **Chat**: AI chat interactions proxy through `/api/chat` to the backend
- **API Routes**: Most `/api/*` routes are proxy routes that forward cookies and requests to the backend

### Key Architectural Patterns

1. **Assistant-UI Integration**: Uses `@assistant-ui/react` for the chat interface
   - Runtime configured in `app/assistant.tsx` with `useChatRuntime` hook
   - Custom tool UIs registered in `components/assistant-ui/tool-registry.tsx`
   - Thread rendering in `components/assistant-ui/thread.tsx`

2. **Context Providers**:
   - `AuthProvider` (`contexts/auth-context.tsx`) - Wraps entire app in `app/layout.tsx`
   - `VariantJobsProvider` (`contexts/variant-jobs-context.tsx`) - Tracks variant generation job status
   - `AssistantRuntimeProvider` - Wraps the chat interface

3. **API Client Pattern**:
   - `lib/chat-api.ts` - Client-side service for backend API calls
   - `lib/analytics-api.ts` - Analytics API client
   - All use cookie-based authentication (no bearer tokens)

### Custom AI Tools

The assistant has custom tool UIs for domain-specific operations:

- `generate_hypotheses` - Generate UX improvement hypotheses
- `generate_variants` - Generate variant implementations (HTML/CSS)
- `get_brand_analysis` - Fetch brand analysis
- `create_experiment` - Create A/B experiments
- `preview_experiment` - Preview experiments
- `check_variants` - Hidden tool for variant checking
- `get_brand_sources` - Display brand sources
- `get_project_info` - Display project information

Tool UIs are registered in `components/assistant-ui/tool-registry.tsx` and must match tool names from the backend agent.

### Type Definitions

Core types in `lib/chat-types.ts`:

- `ChatMessage` - Message structure with role (USER/AGENT/TOOL/SYSTEM)
- `Variant` - UX variant with HTML/CSS and implementation instructions
- `JobStatus` - Background job tracking
- `BrandAnalysisResponse` - Brand personality and traits

## Directory Structure

```
app/
  api/               - API proxy routes to backend
    auth/           - Better Auth proxy routes
    chat/           - Chat proxy route
    analytics/      - Analytics routes
    jobs/           - Job status routes
  analytics/        - Analytics dashboard page
  login/            - Login page
  assistant.tsx     - Main chat assistant component
  layout.tsx        - Root layout with AuthProvider
  page.tsx          - Home page

components/
  assistant-ui/     - Custom tool UIs and chat components
  analytics/        - Analytics visualization components
  branding/         - Brand-related components
  chat/             - Chat session controls
  ui/               - Reusable UI components (shadcn-based)

contexts/
  auth-context.tsx          - Better Auth session management
  variant-jobs-context.tsx  - Variant job status tracking

lib/
  chat-api.ts       - Backend API client
  analytics-api.ts  - Analytics API client
  better-auth.ts    - Better Auth client configuration
  chat-types.ts     - TypeScript type definitions
  utils.ts          - Utility functions
```

## Authentication Flow

Uses Better Auth with cookie-based sessions:

1. User authenticates via `/api/auth/*` routes (proxied to backend)
2. Backend sets HTTP-only cookies
3. Frontend forwards cookies on all API requests
4. `AuthProvider` manages session state via `lib/better-auth.ts`

## Styling

- **Tailwind CSS 4** with PostCSS
- Custom fonts: DM Sans (variable weight)
- Color scheme and variables in `app/globals.css`
- Component library: Radix UI primitives + shadcn/ui patterns

## Path Aliases

`@/*` maps to project root (configured in `tsconfig.json`)

Example: `import { chatApi } from '@/lib/chat-api'`

## Important Notes

- ESLint errors do not block production builds (configured in `next.config.ts`)
- All chat operations stream responses using AI SDK
- The frontend should never implement auth logic directly - always proxy to backend
- Variant jobs run asynchronously on the backend; frontend polls for status
- Tool UI components receive tool arguments/results as props from assistant-ui
