import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  if (!workspaceId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">No workspace found.</p>
          <Link href="/settings" className="btn-primary mt-4 inline-flex">
            Create workspace
          </Link>
        </div>
      </div>
    )
  }

  // Fetch stats
  const [agentsResult, runsResult, notificationsResult] = await Promise.all([
    supabase
      .from('agents')
      .select('id, status', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('status', 'active'),
    supabase
      .from('runs')
      .select('id, status, cost_usd', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('read', false),
  ])

  const totalActiveAgents = agentsResult.count ?? 0
  const totalRunsToday = runsResult.count ?? 0
  const pendingNotifications = notificationsResult.count ?? 0
  const totalCostToday = (runsResult.data ?? []).reduce(
    (sum, r) => sum + (Number(r.cost_usd) || 0),
    0,
  )

  // Recent runs
  const { data: recentRuns } = await supabase
    .from('runs')
    .select('id, status, created_at, duration_ms, cost_usd, agents(name)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Overview</h1>
        <p className="text-sm text-zinc-500">Flight deck status at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Active agents</p>
          <p className="text-2xl font-semibold text-zinc-100">{totalActiveAgents}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Runs today</p>
          <p className="text-2xl font-semibold text-zinc-100">{totalRunsToday}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Pending review</p>
          <p className="text-2xl font-semibold text-zinc-100">{pendingNotifications}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Cost today (USD)</p>
          <p className="text-2xl font-semibold text-zinc-100">${totalCostToday.toFixed(4)}</p>
        </div>
      </div>

      {/* Recent runs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-300">Recent runs</h2>
          <Link href="/runs" className="text-xs text-indigo-400 hover:text-indigo-300">
            View all →
          </Link>
        </div>
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e32]">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Agent</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Duration</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Cost</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e32]">
              {(recentRuns ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                    No runs yet
                  </td>
                </tr>
              ) : (
                (recentRuns ?? []).map((run) => (
                  <tr key={run.id} className="hover:bg-[#18181b]">
                    <td className="px-4 py-2.5 text-zinc-300">
                      <Link href={`/runs/${run.id}`} className="hover:text-indigo-400">
                        {(run.agents as { name: string } | null)?.name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`badge-${run.status}`}>{run.status}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                      {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                      {run.cost_usd ? `$${Number(run.cost_usd).toFixed(4)}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {new Date(run.created_at).toLocaleTimeString()}
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
