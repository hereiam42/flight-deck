import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { boardId, workspaceId, applicationText } = body

    if (!boardId || !workspaceId || !applicationText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    // Validate the board exists and is active in this workspace
    const { data: board } = await supabase
      .from('boards')
      .select('id')
      .eq('id', boardId)
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .single()

    if (!board) {
      return NextResponse.json(
        { error: 'Invalid board' },
        { status: 400 },
      )
    }

    // Look up the inbound_application_processor agent server-side
    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('name', 'inbound_application_processor')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .limit(1)

    if (!agents?.[0]?.id) {
      return NextResponse.json(
        { error: 'Application processor not configured' },
        { status: 500 },
      )
    }

    // Trigger the agent using the agent secret (internal invocation)
    const agentSecret = process.env.AGENT_SECRET
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!agentSecret || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      )
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/agent-runtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-agent-secret': agentSecret,
      },
      body: JSON.stringify({
        agent_id: agents[0].id,
        input: applicationText,
        triggered_by: 'website_form',
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Agent execution failed' }))
      return NextResponse.json(
        { error: err.error ?? 'Failed to process application' },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}
