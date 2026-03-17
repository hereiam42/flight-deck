# Pacific Atlas Flight Deck

Autonomous business operating system with four engines:
- **Seasonal Labor OS** — Niseko.Jobs workforce management
- **Pacific Atlas** — Hospitality operations intelligence
- **Personal** — Personal productivity and scheduling
- **Finance** — Financial monitoring and reporting

## Architecture

```
flight-deck/
├── apps/
│   └── dashboard/          # Next.js 14 App Router — flight deck UI
├── supabase/
│   ├── migrations/         # SQL migrations
│   └── functions/          # Deno edge functions
├── packages/
│   └── shared/             # Shared TypeScript types
└── docs/                   # Architecture documentation
```

## Getting Started

### Prerequisites
- Node.js >= 20
- Supabase CLI
- Docker (for local Supabase)

### Setup

```bash
# Install dependencies
npm install

# Copy env template
cp .env.local.example apps/dashboard/.env.local
# Fill in your Supabase + Anthropic credentials

# Start local Supabase
npm run db:start

# Apply migrations
supabase db reset

# Generate TypeScript types
npm run db:gen-types

# Start dev server
npm run dev
```

### Deploy edge functions

```bash
supabase functions deploy agent-runtime
```

## Phase 0 — Foundation

The shared foundation layer provides:
- Multi-tenant workspace isolation via RLS
- Agent registry (every agent is a database row)
- Workflow DAG definitions
- Universal run logging (input, output, cost, duration)
- Tool/integration registry
- Secret management via Supabase Vault
- Human-in-the-loop notification queue
