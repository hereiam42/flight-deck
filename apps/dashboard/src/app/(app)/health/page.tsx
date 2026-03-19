import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

export default async function HealthPage() {
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const today = new Date().toISOString().slice(0, 10)

  // Parallel queries
  const [agentsRes, runsWeekRes, runsTodayRes, notifsRes] = await Promise.all([
    supabase.from('agents').select('id, name, status, schedule').eq('workspace_id', workspaceId ?? ''),
    supabase.from('runs').select('agent_id, status, cost_usd, created_at, duration_ms').eq('workspace_id', workspaceId ?? '').gte('created_at', weekAgo),
    supabase.from('runs').select('id, cost_usd', { count: 'exact' }).eq('workspace_id', workspaceId ?? '').gte('created_at', `${today}T00:00:00`),
    supabase.from('notifications').select('id', { count: 'exact' }).eq('workspace_id', workspaceId ?? '').eq('read', false),
  ])

  const agents = agentsRes.data ?? []
  const runsWeek = runsWeekRes.data ?? []
  const runsToday = runsTodayRes.count ?? 0
  const costToday = (runsTodayRes.data ?? []).reduce((sum, r) => sum + (Number(r.cost_usd) || 0), 0)
  const costWeek = runsWeek.reduce((sum, r) => sum + (Number(r.cost_usd) || 0), 0)
  const pendingNotifs = notifsRes.count ?? 0

  const activeAgents = agents.filter((a) => a.status === 'active').length
  const pausedAgents = agents.filter((a) => a.status === 'paused').length

  // Per-agent health
  const agentHealth = agents.map((agent) => {
    const runs = runsWeek.filter((r) => r.agent_id === agent.id)
    const completed = runs.filter((r) => r.status === 'completed').length
    const failed = runs.filter((r) => r.status === 'failed').length
    const total = completed + failed
    const successRate = total > 0 ? Math.round((completed / total) * 100) : -1
    const sorted = [...runs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const avgDuration = runs.length > 0
      ? Math.round(runs.reduce((s, r) => s + (r.duration_ms || 0), 0) / runs.length)
      : null
    const cost = runs.reduce((s, r) => s + (Number(r.cost_usd) || 0), 0)

    return {
      ...agent,
      runsThisWeek: runs.length,
      successRate,
      failed,
      lastRun: sorted[0]?.created_at ?? null,
      lastStatus: sorted[0]?.status ?? null,
      avgDuration,
      cost,
    }
  }).sort((a, b) => b.runsThisWeek - a.runsThisWeek)

  function healthLight(rate: number): string {
    if (rate === -1) return 'bg-zinc-600'
    if (rate >= 80) return 'bg-emerald-500'
    if (rate >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">System Health</h1>
        <p className="text-sm text-zinc-500">Fleet overview and agent performance</p>
      </div>

      {/* Fleet overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Total agents</p>
          <p className="font-mono text-2xl text-zinc-200">{agents.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Active</p>
          <p className="font-mono text-2xl text-emerald-400">{activeAgents}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Paused</p>
          <p className="font-mono text-2xl text-yellow-400">{pausedAgents}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Runs today</p>
          <p className="font-mono text-2xl text-zinc-200">{runsToday}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Cost today</p>
          <p className="font-mono text-2xl text-zinc-200">${costToday.toFixed(4)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Pending actions</p>
          <p className={`font-mono text-2xl ${pendingNotifs > 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
            {pendingNotifs}
          </p>
        </div>
      </div>

      {/* Cost summary */}
      <div className="card">
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Cost (7 days)</h2>
        <p className="font-mono text-2xl text-zinc-200">${costWeek.toFixed(4)}</p>
        <p className="mt-1 text-xs text-zinc-500">{runsWeek.length} runs this week</p>
      </div>

      {/* Agent health table */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Agent health</h2>
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e32]">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Health</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Agent</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Runs (7d)</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Success</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Failures</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Avg duration</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Cost (7d)</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Last run</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e32]">
              {agentHealth.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">No agents configured</td>
                </tr>
              ) : (
                agentHealth.map((a) => (
                  <tr key={a.id} className="hover:bg-[#18181b]">
                    <td className="px-4 py-3">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${healthLight(a.successRate)}`} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/agents/${a.id}`} className="font-medium text-zinc-200 hover:text-indigo-400">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-${a.status}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{a.runsThisWeek}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {a.successRate >= 0 ? `${a.successRate}%` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {a.failed > 0 ? <span className="text-red-400">{a.failed}</span> : '0'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {a.avgDuration ? `${(a.avgDuration / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {a.cost > 0 ? `$${a.cost.toFixed(4)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {a.lastRun ? (
                        <span className="flex items-center gap-1.5">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                            a.lastStatus === 'completed' ? 'bg-emerald-500' :
                            a.lastStatus === 'failed' ? 'bg-red-500' : 'bg-zinc-500'
                          }`} />
                          {new Date(a.lastRun).toLocaleString()}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
