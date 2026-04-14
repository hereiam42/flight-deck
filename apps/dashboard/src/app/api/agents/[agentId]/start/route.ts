import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import { createSession, sendUserMessage, streamSessionEvents, extractLeadsFromOutput } from '@/lib/managed-agents'

/**
 * POST /api/agents/[agentId]/start
 *
 * Non-blocking agent start. Creates a session, returns immediately with
 * the session ID, then runs the agent in the background. Progress is
 * written to the agent_sessions row so the frontend can poll or stream.
 *
 * Body: { message: string }
 * Returns: { session_id: string, anthropic_session_id: string }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(agentIdOrName)
  const { data: agentRow, error: lookupErr } = isUuid
    ? await db.from('managed_agents').select('*').eq('workspace_id', workspaceId).eq('id', agentIdOrName).single()
    : await db.from('managed_agents').select('*').eq('workspace_id', workspaceId).ilike('name', agentIdOrName.replace(/-/g, ' ')).single()

  if (lookupErr || !agentRow) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const { message } = body as { message?: string }
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  try {
    const session = await createSession({
      agentId: agentRow.anthropic_agent_id,
      environmentId: agentRow.anthropic_environment_id,
      title: `${agentRow.name} — ${new Date().toISOString().slice(0, 19)}`,
    })

    const { data: sessionRow, error: insertErr } = await db
      .from('agent_sessions')
      .insert({
        workspace_id: workspaceId,
        agent_id: agentRow.id,
        anthropic_session_id: session.id,
        title: session.title ?? null,
        trigger_type: 'manual',
        input_message: message,
        status: 'running',
        progress_steps: [{ step: 'init', status: 'completed', detail: 'Session created', ts: new Date().toISOString() }],
        current_step: 'Starting agent…',
        progress_pct: 5,
      })
      .select()
      .single()
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    // Fire-and-forget: run in background. We don't await this.
    // The edge runtime keeps it alive until the promise resolves.
    runInBackground(db, session.id, sessionRow.id, workspaceId, message)

    return NextResponse.json({
      session_id: sessionRow.id,
      anthropic_session_id: session.id,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * Background execution — streams events and writes progress to Supabase.
 * This runs after the HTTP response is sent.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runInBackground(db: any, anthropicSessionId: string, sessionRowId: string, workspaceId: string, message: string) {
  try {
    const stream = await streamSessionEvents(anthropicSessionId)
    await sendUserMessage(anthropicSessionId, message)

    await updateProgress(db, sessionRowId, 'stream', 'running', 'Agent is working…', 10)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: any[] = []
    const toolUses: string[] = []
    let text = ''
    let toolCount = 0

    for await (const event of stream) {
      events.push(event)

      if (event.type === 'agent.message') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const block of (event.content ?? []) as any[]) {
          if (block?.type === 'text' && typeof block.text === 'string') {
            text += block.text
          }
        }
        // Update with partial text length as a rough progress signal
        const pct = Math.min(85, 10 + Math.floor(text.length / 100))
        await updateProgress(db, sessionRowId, 'thinking', 'running', `Agent responding (${text.length} chars)…`, pct)
      } else if (event.type === 'agent.tool_use') {
        toolCount++
        const toolName = typeof event.name === 'string' ? event.name : 'tool'
        toolUses.push(toolName)
        const pct = Math.min(80, 10 + toolCount * 8)
        await updateProgress(db, sessionRowId, toolName, 'running', `Using ${toolName} (${toolCount} calls)…`, pct)
      } else if (event.type === 'session.status_idle') {
        break
      }
    }

    // Parse leads
    const leads = extractLeadsFromOutput(text)

    await updateProgress(db, sessionRowId, 'parsing', 'running', `Parsing results… ${leads.length} leads found`, 90)

    // Persist results
    await db
      .from('agent_sessions')
      .update({
        status: 'completed',
        output_text: text,
        output_summary: leads.length > 0 ? `${leads.length} leads parsed` : 'Completed',
        output_raw: { events, toolUses },
        completed_at: new Date().toISOString(),
        progress_pct: 100,
        current_step: 'Done',
        progress_steps: await getSteps(db, sessionRowId).then(steps => [
          ...steps,
          { step: 'complete', status: 'completed', detail: `Done — ${leads.length} leads, ${toolUses.length} tool calls`, ts: new Date().toISOString() },
        ]),
      })
      .eq('id', sessionRowId)

    if (leads.length > 0) {
      await db.from('leads').insert(
        leads.map((l) => ({
          workspace_id: workspaceId,
          session_id: sessionRowId,
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await db
      .from('agent_sessions')
      .update({
        status: 'failed',
        error: msg,
        current_step: 'Failed',
        progress_pct: 0,
      })
      .eq('id', sessionRowId)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSteps(db: any, sessionRowId: string) {
  const { data } = await db
    .from('agent_sessions')
    .select('progress_steps')
    .eq('id', sessionRowId)
    .single()
  return (data?.progress_steps ?? []) as Array<{ step: string; status: string; detail: string; ts: string }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateProgress(db: any, sessionRowId: string, step: string, status: string, detail: string, pct: number) {
  const steps = await getSteps(db, sessionRowId)
  // Replace running step with same name, or append
  const idx = steps.findIndex(s => s.step === step && s.status === 'running')
  const entry = { step, status, detail, ts: new Date().toISOString() }
  if (idx >= 0) {
    steps[idx] = entry
  } else {
    steps.push(entry)
  }
  await db
    .from('agent_sessions')
    .update({ progress_steps: steps, current_step: detail, progress_pct: pct })
    .eq('id', sessionRowId)
}
