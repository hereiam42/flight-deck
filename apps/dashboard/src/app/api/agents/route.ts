import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import { createAgent, createEnvironment } from '@/lib/managed-agents'

/** GET /api/agents — list agents in current workspace */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getCurrentWorkspaceId()
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('managed_agents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ agents: data })
}

/**
 * POST /api/agents — register a new agent
 *
 * Body: { name, description?, systemPrompt, model?, venture?, tools? }
 *
 * Creates the agent + environment via the Anthropic API, then persists
 * the returned IDs to managed_agents.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getCurrentWorkspaceId()
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const body = await request.json()
  const { name, description, systemPrompt, model, venture, tools } = body
  if (!name || !systemPrompt) {
    return NextResponse.json({ error: 'name and systemPrompt are required' }, { status: 400 })
  }

  try {
    const agent = await createAgent({ name, systemPrompt, model, tools })
    const environment = await createEnvironment({
      name: `${name}-env`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('managed_agents')
      .insert({
        workspace_id: workspaceId,
        name,
        description,
        anthropic_agent_id: agent.id,
        anthropic_environment_id: environment.id,
        venture: venture ?? 'beyond_peaks',
        model: model ?? 'claude-sonnet-4-6',
        system_prompt: systemPrompt,
        tools: tools ?? [{ type: 'agent_toolset_20260401' }],
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ agent: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
