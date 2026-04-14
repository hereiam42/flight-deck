#!/usr/bin/env tsx
/**
 * Standalone end-to-end test for the Lead Finder Managed Agent.
 *
 * Bypasses the Next.js dashboard entirely. Uses:
 *  - @anthropic-ai/sdk    → create agent + environment + session, stream events
 *  - @supabase/supabase-js with service-role key → write rows directly
 *
 * Run from repo root:
 *   npx tsx scripts/test-lead-finder.ts
 *
 * Requires apps/dashboard/.env.local to contain:
 *   ANTHROPIC_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import * as path from 'node:path'
import * as dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(__dirname, '../apps/dashboard/.env.local') })

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing one of: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const LEAD_FINDER_SYSTEM_PROMPT = `You are a lead research agent for Beyond Peaks, a cross-border seasonal labor mobility platform connecting international workers with resort town employers across Japan, Australia, New Zealand, and Canada.

Your job is to find employers in resort towns who are actively hiring (or likely to hire) seasonal workers.

For each lead you find, output a JSON object with:
- company_name
- location (town + country)
- website_url
- roles_hiring (array of job titles you found)
- season (winter/summer/year-round)
- contact_email (if findable)
- contact_page_url
- source_url (where you found the listing)
- confidence (high/medium/low)
- notes

IMPORTANT: At the end of your research, output ALL leads as a single JSON array wrapped in \`\`\`json code fences. Aim for 3-5 leads to keep this test run short.`

const TEST_MESSAGE =
  'Find 3-5 seasonal employers currently hiring in Niseko, Japan for winter 2026-27. Keep the search short and focused.'

interface ParsedLead {
  company_name: string
  location?: string
  website_url?: string
  roles_hiring?: string[]
  season?: string
  contact_email?: string
  contact_page_url?: string
  source_url?: string
  confidence?: 'high' | 'medium' | 'low'
  notes?: string
}

function extractLeadsFromOutput(text: string): ParsedLead[] {
  const fenceRegex = /```json\s*([\s\S]*?)```/gi
  let match: RegExpExecArray | null
  let lastParsed: ParsedLead[] = []
  while ((match = fenceRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim())
      if (Array.isArray(parsed)) lastParsed = parsed as ParsedLead[]
    } catch {
      /* ignore non-JSON fences */
    }
  }
  return lastParsed
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY }) as any
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  // Find a workspace_id to attribute rows to (first one found).
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('id, name')
    .limit(1)
    .single()
  if (wsErr || !ws) {
    console.error('Full wsErr:', JSON.stringify(wsErr, null, 2))
    console.error('wsErr cause:', (wsErr as unknown as { cause?: unknown })?.cause)
    throw new Error(`No workspace found: ${wsErr?.message}`)
  }
  console.log(`Using workspace: ${ws.name} (${ws.id})`)

  // 1. Reuse Lead Finder if it already exists, otherwise create it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let agentRow: any
  const { data: existing } = await supabase
    .from('managed_agents')
    .select('*')
    .eq('workspace_id', ws.id)
    .eq('name', 'Lead Finder')
    .maybeSingle()

  if (existing) {
    console.log(`Reusing Lead Finder agent: ${existing.anthropic_agent_id}`)
    agentRow = existing
  } else {
    console.log('Creating Lead Finder agent in Anthropic...')
    const agent = await anthropic.beta.agents.create({
      name: 'Lead Finder',
      model: 'claude-sonnet-4-6',
      system: LEAD_FINDER_SYSTEM_PROMPT,
      tools: [{ type: 'agent_toolset_20260401' }],
    })
    console.log(`  agent.id = ${agent.id}`)

    console.log('Creating environment...')
    const environment = await anthropic.beta.environments.create({
      name: 'lead-finder-env',
      config: { type: 'cloud', networking: { type: 'unrestricted' } },
    })
    console.log(`  environment.id = ${environment.id}`)

    const { data, error } = await supabase
      .from('managed_agents')
      .insert({
        workspace_id: ws.id,
        name: 'Lead Finder',
        description: 'Finds seasonal employers hiring international workers in resort towns.',
        anthropic_agent_id: agent.id,
        anthropic_environment_id: environment.id,
        venture: 'beyond_peaks',
        model: 'claude-sonnet-4-6',
        system_prompt: LEAD_FINDER_SYSTEM_PROMPT,
      })
      .select()
      .single()
    if (error) throw new Error(`Insert managed_agents failed: ${error.message}`)
    agentRow = data
  }

  // 2. Create a session.
  console.log('Creating session...')
  const session = await anthropic.beta.sessions.create({
    agent: agentRow.anthropic_agent_id,
    environment_id: agentRow.anthropic_environment_id,
    title: `Lead Finder test — ${new Date().toISOString().slice(0, 19)}`,
  })
  console.log(`  session.id = ${session.id}`)

  const { data: sessionRow, error: sessionInsertErr } = await supabase
    .from('agent_sessions')
    .insert({
      workspace_id: ws.id,
      agent_id: agentRow.id,
      anthropic_session_id: session.id,
      title: session.title,
      trigger_type: 'manual',
      input_message: TEST_MESSAGE,
      status: 'running',
    })
    .select()
    .single()
  if (sessionInsertErr) throw new Error(`Insert agent_sessions failed: ${sessionInsertErr.message}`)

  // 3. Open the stream BEFORE sending the message (per docs).
  console.log('Opening event stream and sending message...')
  const stream = await anthropic.beta.sessions.events.stream(session.id)
  await anthropic.beta.sessions.events.send(session.id, {
    events: [
      {
        type: 'user.message',
        content: [{ type: 'text', text: TEST_MESSAGE }],
      },
    ],
  })

  // 4. Collect events until session.status_idle.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events: any[] = []
  const toolUses: string[] = []
  let text = ''

  for await (const event of stream) {
    events.push(event)
    if (event.type === 'agent.message') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const block of (event.content ?? []) as any[]) {
        if (block?.type === 'text' && typeof block.text === 'string') {
          process.stdout.write(block.text)
          text += block.text
        }
      }
    } else if (event.type === 'agent.tool_use') {
      console.log(`\n[tool: ${event.name}]`)
      if (typeof event.name === 'string') toolUses.push(event.name)
    } else if (event.type === 'session.status_idle') {
      console.log('\n[idle — agent finished]')
      break
    }
  }

  // 5. Parse leads + persist results.
  const leads = extractLeadsFromOutput(text)
  console.log(`\nParsed ${leads.length} leads.`)

  await supabase
    .from('agent_sessions')
    .update({
      status: 'completed',
      output_text: text,
      output_summary: leads.length > 0 ? `${leads.length} leads parsed` : null,
      output_raw: { events, toolUses },
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionRow.id)

  if (leads.length > 0) {
    const { error: leadsErr } = await supabase.from('leads').insert(
      leads.map((l) => ({
        workspace_id: ws.id,
        session_id: sessionRow.id,
        company_name: l.company_name,
        location: l.location ?? null,
        website_url: l.website_url ?? null,
        roles_hiring: l.roles_hiring ?? null,
        season: l.season ?? null,
        contact_email: l.contact_email ?? null,
        contact_page_url: l.contact_page_url ?? null,
        source_url: l.source_url ?? null,
        confidence: l.confidence ?? null,
        notes: l.notes ?? null,
      })),
    )
    if (leadsErr) console.error('Insert leads failed:', leadsErr.message)
  }

  console.log('\nDone. Session row id:', sessionRow.id)
  console.log('Tool uses:', toolUses)
  console.log('Leads:')
  for (const l of leads) console.log(' -', l.company_name, '|', l.location, '|', l.confidence)
}

main().catch((err) => {
  console.error('FAILED:', err)
  process.exit(1)
})
