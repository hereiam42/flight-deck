import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RunManagedAgent } from './RunManagedAgent'

export default async function ManagedAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: agent } = await db
    .from('managed_agents')
    .select('*')
    .eq('workspace_id', workspaceId ?? '')
    .eq('id', id)
    .single()

  if (!agent) notFound()

  const { data: sessions } = await db
    .from('agent_sessions')
    .select('id, title, trigger_type, status, output_summary, input_message, started_at, completed_at')
    .eq('agent_id', id)
    .order('started_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/managed-agents" className="text-sm text-zinc-500 hover:text-zinc-300">Managed Agents</Link>
            <span className="text-zinc-600">/</span>
            <h1 className="text-lg font-semibold text-zinc-100">{agent.name}</h1>
          </div>
          {agent.description && (
            <p className="mt-1 text-sm text-zinc-500">{agent.description}</p>
          )}
        </div>
        <span className={`rounded px-2 py-1 text-xs ${
          agent.status === 'active'
            ? 'bg-emerald-900/30 text-emerald-400'
            : 'bg-zinc-800 text-zinc-500'
        }`}>
          {agent.status}
        </span>
      </div>

      {/* Config card */}
      <div className="card space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Configuration</h2>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-500">Model</p>
            <p className="font-mono text-zinc-300">{agent.model}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Venture</p>
            <p className="text-zinc-300">{agent.venture.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Agent ID</p>
            <p className="truncate font-mono text-xs text-zinc-400">{agent.anthropic_agent_id}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Environment ID</p>
            <p className="truncate font-mono text-xs text-zinc-400">{agent.anthropic_environment_id}</p>
          </div>
        </div>
        <details className="group">
          <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
            System prompt
          </summary>
          <pre className="mt-2 max-h-60 overflow-auto rounded bg-[#0a0a0b] p-3 font-mono text-[11px] text-zinc-400">
            {agent.system_prompt}
          </pre>
        </details>
      </div>

      {/* Run agent */}
      <RunManagedAgent agentId={agent.id} agentName={agent.name} />

      {/* Sessions */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Sessions ({sessions?.length ?? 0})</h2>
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[#2e2e32]">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Input</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Result</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Trigger</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Started</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Duration</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e32]">
                {(sessions ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No sessions yet. Run the agent above.</td>
                  </tr>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (sessions ?? []).map((s: any) => {
                    const duration = s.completed_at
                      ? Math.round((new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 1000)
                      : null
                    return (
                      <tr key={s.id} className="hover:bg-[#18181b]">
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs ${
                            s.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' :
                            s.status === 'running' ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-red-900/30 text-red-400'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              s.status === 'completed' ? 'bg-emerald-400' :
                              s.status === 'running' ? 'bg-yellow-400 animate-pulse' :
                              'bg-red-400'
                            }`} />
                            {s.status}
                          </span>
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-2.5 text-xs text-zinc-400">
                          {s.input_message ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-zinc-400">
                          {s.output_summary ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-zinc-500">{s.trigger_type}</td>
                        <td className="px-4 py-2.5 text-xs text-zinc-500">
                          {new Date(s.started_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">
                          {duration != null ? `${duration}s` : '...'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Link
                            href={`/managed-agents/${id}/sessions/${s.id}`}
                            className="btn-ghost text-xs"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
