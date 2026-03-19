import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

export default async function AgentsPage() {
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })

  // Get run stats for each agent (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: recentRuns } = await supabase
    .from('runs')
    .select('agent_id, status, cost_usd, created_at')
    .eq('workspace_id', workspaceId ?? '')
    .gte('created_at', weekAgo)

  // Build stats per agent
  const agentStats = new Map<string, {
    runsThisWeek: number
    successRate: number
    lastRun: string | null
    lastStatus: string | null
    costThisWeek: number
  }>()

  for (const agent of agents ?? []) {
    const runs = (recentRuns ?? []).filter((r) => r.agent_id === agent.id)
    const completed = runs.filter((r) => r.status === 'completed').length
    const failed = runs.filter((r) => r.status === 'failed').length
    const total = completed + failed
    const sorted = [...runs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    agentStats.set(agent.id, {
      runsThisWeek: runs.length,
      successRate: total > 0 ? Math.round((completed / total) * 100) : -1,
      lastRun: sorted[0]?.created_at ?? null,
      lastStatus: sorted[0]?.status ?? null,
      costThisWeek: runs.reduce((sum, r) => sum + (Number(r.cost_usd) || 0), 0),
    })
  }

  function healthColor(rate: number): string {
    if (rate === -1) return 'bg-zinc-600'
    if (rate >= 80) return 'bg-emerald-500'
    if (rate >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const totalAgents = agents?.length ?? 0
  const activeAgents = (agents ?? []).filter((a) => a.status === 'active').length
  const pausedAgents = (agents ?? []).filter((a) => a.status === 'paused').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Agents</h1>
          <p className="text-sm text-zinc-500">
            {activeAgents} active · {pausedAgents} paused · {totalAgents} total
          </p>
        </div>
        <Link href="/agents/new" className="btn-primary">
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z" />
          </svg>
          New agent
        </Link>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Health</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Schedule</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Runs (7d)</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Success</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Cost (7d)</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Last run</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {(agents ?? []).length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                  No agents yet.{' '}
                  <Link href="/agents/new" className="text-indigo-400 hover:text-indigo-300">
                    Create your first agent →
                  </Link>
                </td>
              </tr>
            ) : (
              (agents ?? []).map((agent) => {
                const stats = agentStats.get(agent.id)!
                return (
                  <tr key={agent.id} className="hover:bg-[#18181b]">
                    <td className="px-4 py-3">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${healthColor(stats.successRate)}`} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/agents/${agent.id}`} className="font-medium text-zinc-200 hover:text-indigo-400">
                        {agent.name}
                      </Link>
                      {agent.description && (
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{agent.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-${agent.status}`}>{agent.status}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {agent.schedule ?? <span className="text-zinc-600">manual</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {stats.runsThisWeek}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {stats.successRate >= 0 ? `${stats.successRate}%` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {stats.costThisWeek > 0 ? `$${stats.costThisWeek.toFixed(4)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {stats.lastRun ? (
                        <span className="flex items-center gap-1.5">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                            stats.lastStatus === 'completed' ? 'bg-emerald-500' :
                            stats.lastStatus === 'failed' ? 'bg-red-500' :
                            stats.lastStatus === 'running' ? 'bg-yellow-500' : 'bg-zinc-500'
                          }`} />
                          {new Date(stats.lastRun).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-zinc-600">never</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/agents/${agent.id}`} className="btn-ghost text-xs">View →</Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
