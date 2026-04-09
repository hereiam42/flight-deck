import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import {
  createSession,
  runAgentToCompletion,
  extractLeadsFromOutput,
} from '@/lib/managed-agents'

/**
 * POST /api/agents/[agentId]/run
 *
 * Body: { message: string, title?: string, triggerType?: 'manual'|'cron'|'event' }
 *
 * Looks up the agent (by managed_agents.id OR by name — to support
 * `/api/agents/lead-finder/run`), creates a session, runs it to
 * completion, persists the result, and (for Lead Finder) parses leads
 * into the leads table.
 *
 * NOTE: this is synchronous and will block until the agent emits
 * `session.status_idle`. Fine for the manual milestone test; later we
 * should split into start + stream endpoints.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId: agentIdOrName } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getCurrentWorkspaceId()
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  // Look up by UUID first, then by slugified name.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(agentIdOrName)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const query = db
    .from('managed_agents')
    .select('*')
    .eq('workspace_id', workspaceId)
  const { data: agentRow, error: lookupErr } = isUuid
    ? await query.eq('id', agentIdOrName).single()
    : await query.ilike('name', agentIdOrName.replace(/-/g, ' ')).single()

  if (lookupErr || !agentRow) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const { message, title, triggerType } = body as {
    message?: string
    title?: string
    triggerType?: 'manual' | 'cron' | 'event'
  }
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  try {
    const session = await createSession({
      agentId: agentRow.anthropic_agent_id,
      environmentId: agentRow.anthropic_environment_id,
      title: title ?? `${agentRow.name} — ${new Date().toISOString().slice(0, 10)}`,
    })

    // Insert running session row up-front so we have an ID even if it crashes.
    const { data: sessionRow, error: insertErr } = await db
      .from('agent_sessions')
      .insert({
        workspace_id: workspaceId,
        agent_id: agentRow.id,
        anthropic_session_id: session.id,
        title: session.title ?? null,
        trigger_type: triggerType ?? 'manual',
        input_message: message,
        status: 'running',
      })
      .select()
      .single()
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    // Run to completion (blocking).
    const result = await runAgentToCompletion(session.id, message)

    // Parse leads if this is a lead-finder-style agent.
    const leads = extractLeadsFromOutput(result.text)

    await db
      .from('agent_sessions')
      .update({
        status: 'completed',
        output_text: result.text,
        output_summary: leads.length > 0 ? `${leads.length} leads parsed` : null,
        output_raw: { events: result.events, toolUses: result.toolUses },
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionRow.id)

    if (leads.length > 0) {
      await db.from('leads').insert(
        leads.map((l) => ({
          workspace_id: workspaceId,
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
    }

    return NextResponse.json({
      session_id: sessionRow.id,
      anthropic_session_id: session.id,
      status: 'completed',
      tool_uses: result.toolUses,
      leads_parsed: leads.length,
      output_text: result.text,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
