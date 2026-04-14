import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

export default async function ManagedAgentsPage() {
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agents } = await (supabase as any)
    .from('managed_agents')
    .select('*')
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })

  // Get session counts per agent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (supabase as any)
    .from('agent_sessions')
    .select('agent_id, status, completed_at, output_summary')
    .eq('workspace_id', workspaceId ?? '')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statsMap = new Map<string, { total: number; completed: number; lastRun: string | null; lastSummary: string | null }>()
  for (const a of agents ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentSessions = (sessions ?? []).filter((s: any) => s.agent_id === a.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completed = agentSessions.filter((s: any) => s.status === 'completed')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sorted = [...completed].sort((a: any, b: any) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    )
    statsMap.set(a.id, {
      total: agentSessions.length,
      completed: completed.length,
      lastRun: sorted[0]?.completed_at ?? null,
      lastSummary: sorted[0]?.output_summary ?? null,
    })
  }

  const totalAgents = agents?.length ?? 0
  const activeAgents = (agents ?? []).filter((a: { status: string }) => a.status === 'active').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Managed Agents</h1>
          <p className="text-sm text-zinc-500">
            {activeAgents} active · {totalAgents} total — powered by Anthropic Managed Agents
          </p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[#2e2e32]">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Venture</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Model</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Sessions</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Last Run</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e32]">
              {(agents ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    No managed agents yet. Seed the Lead Finder via the API.
                  </td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (agents ?? []).map((agent: any) => {
                  const stats = statsMap.get(agent.id)
                  return (
                    <tr key={agent.id} className="hover:bg-[#18181b]">
                      <td className="px-4 py-3">
                        <Link href={`/managed-agents/${agent.id}`} className="font-medium text-zinc-200 hover:text-indigo-400">
                          {agent.name}
                        </Link>
                        {agent.description && (
                          <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{agent.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {agent.venture.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{agent.model}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-1.5 py-0.5 text-xs ${
                          agent.status === 'active'
                            ? 'bg-emerald-900/30 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                        {stats?.completed ?? 0} / {stats?.total ?? 0}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {stats?.lastRun ? (
                          <span>
                            {new Date(stats.lastRun).toLocaleDateString()}
                            {stats.lastSummary && (
                              <span className="ml-1.5 text-zinc-600">({stats.lastSummary})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-zinc-600">never</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/managed-agents/${agent.id}`} className="btn-ghost text-xs">View →</Link>
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
  )
}
