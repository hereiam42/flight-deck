# Nexus Flight Deck

Autonomous operating system for **Nexus株式会社** — the holding company for Beyond Peaks, Pacific Atlas, and related ventures.

## Workspaces

| Workspace | Slug | Description | Phase |
|-----------|------|-------------|-------|
| **Beyond Peaks** | `beyond-peaks` | Seasonal labor infrastructure (Niseko.Jobs, Watari, Employer OS) | Phase 2 done — Phase 3 next (SEO content engine, employer outreach) |
| **Pacific Atlas** | `pacific-atlas` | Pacific-Japan trade & distribution (NAMA FIJI, Pacific Estate, Yasawa, Gov AI) | Planned |
| **Nexus** | `nexus` | CEO command layer + personal operating system (Mission Control, morning briefs, calendar, admin) | Planned (Mission Control tables exist) |
| **Finance** | `finance` | Personal wealth — crypto research, family office, portfolio tracking | Planned — Phase 3 |

## Data Access Architecture

```
Beyond Peaks ──── isolated. Agents read/write BP data only.
Pacific Atlas ──── isolated. Agents read/write PA data only.
Nexus ──────────── reads from BP + PA (cross-venture KPIs, morning brief
                   aggregation). Also manages personal ops.
Finance ─────────── FULLY ISOLATED. No cross-workspace reads in either
                    direction. Guy-only access. Personal wealth data must
                    never be visible to any other workspace or future
                    team member.
```

## Architecture

```
flight-deck/
├── apps/
│   ├── dashboard/          # Next.js 15 App Router — Flight Deck UI
│   └── boards/             # Public job board frontend (Niseko.Jobs)
├── supabase/
│   ├── migrations/         # SQL migrations (RLS, agents, workflows, missions)
│   └── functions/          # Deno edge functions (agent-runtime)
├── packages/
│   └── shared/             # Shared TypeScript types
└── turbo.json              # Turborepo config
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

## Foundation Layer

The shared foundation provides:
- Multi-tenant workspace isolation via RLS
- Agent registry (every agent is a database row)
- Workflow DAG definitions
- Universal run logging (input, output, cost, duration)
- Tool/integration registry
- Secret management via Supabase Vault
- Human-in-the-loop notification queue
- Mission Control with daily briefs and mission ranking
