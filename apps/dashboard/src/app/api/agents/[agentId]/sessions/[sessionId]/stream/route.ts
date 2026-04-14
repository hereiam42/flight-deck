import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'

/**
 * GET /api/agents/[agentId]/sessions/[sessionId]/stream
 *
 * SSE endpoint that polls the agent_sessions row every 2s and pushes
 * progress_steps, current_step, progress_pct, and status to the client.
 * Closes when status is 'completed' or 'failed'.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agentId: string; sessionId: string }> },
) {
  const { sessionId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const workspaceId = await getCurrentWorkspaceId()
  if (!workspaceId) return new Response('No workspace', { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      let done = false
      while (!done) {
        const { data: session } = await db
          .from('agent_sessions')
          .select('status, progress_steps, current_step, progress_pct, output_summary, error')
          .eq('id', sessionId)
          .eq('workspace_id', workspaceId)
          .single()

        if (!session) {
          send({ error: 'Session not found' })
          done = true
          break
        }

        send({
          status: session.status,
          progress_steps: session.progress_steps,
          current_step: session.current_step,
          progress_pct: session.progress_pct,
          output_summary: session.output_summary,
          error: session.error,
        })

        if (session.status === 'completed' || session.status === 'failed') {
          done = true
          break
        }

        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      'connection': 'keep-alive',
    },
  })
}
