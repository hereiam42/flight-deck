import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

interface SearchParams {
  agent?: string
  status?: string
  page?: string
}

const PAGE_SIZE = 25

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { agent, status, page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  let query = supabase
    .from('runs')
    .select('*, agents(name)', { count: 'exact' })
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (agent) query = query.eq('agent_id', agent)
  if (status) query = query.eq('status', status)

  const { data: runs, count } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const { data: agents } = await supabase
    .from('agents')
    .select('id, name')
    .eq('workspace_id', workspaceId ?? '')
    .eq('status', 'active')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Runs</h1>
        <p className="text-sm text-zinc-500">{count ?? 0} total runs</p>
      </div>

      {/* Filters */}
      <form className="flex gap-3">
        <select
          name="agent"
          defaultValue={agent ?? ''}
          className="input w-48"
        >
          <option value="">All agents</option>
          {(agents ?? []).map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ''}
          className="input w-36"
        >
          <option value="">All statuses</option>
          {['pending', 'running', 'completed', 'failed', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Filter</button>
        {(agent || status) && (
          <Link href="/runs" className="btn-ghost">Clear</Link>
        )}
      </form>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Agent</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Duration</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Tokens</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Cost</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Started</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {(runs ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No runs found</td>
              </tr>
            ) : (
              (runs ?? []).map((run) => (
                <tr key={run.id} className="hover:bg-[#18181b]">
                  <td className="px-4 py-2.5 text-zinc-300">
                    {(run.agents as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`badge-${run.status}`}>{run.status}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                    {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                    {run.token_count ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                    {run.cost_usd ? `$${Number(run.cost_usd).toFixed(4)}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-500">
                    {new Date(run.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/runs/${run.id}`} className="btn-ghost text-xs">View →</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/runs?page=${page - 1}${agent ? `&agent=${agent}` : ''}${status ? `&status=${status}` : ''}`}
                className="btn-secondary"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/runs?page=${page + 1}${agent ? `&agent=${agent}` : ''}${status ? `&status=${status}` : ''}`}
                className="btn-secondary"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
