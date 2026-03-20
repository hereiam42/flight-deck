import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cookies } from 'next/headers'

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; agent?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('workspace_id')?.value

  if (!workspaceId) {
    return <p className="text-zinc-500">No workspace selected.</p>
  }

  const perPage = 50
  const page = parseInt(params.page ?? '1', 10)
  const offset = (page - 1) * perPage

  // Build query
  let query = supabase
    .from('activity_log')
    .select('*, agents(name)', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (params.table) query = query.eq('table_name', params.table)
  if (params.agent) query = query.eq('agent_id', params.agent)

  const [logRes, agentsRes] = await Promise.all([
    query,
    supabase.from('agents').select('id, name').eq('workspace_id', workspaceId),
  ])

  const logs = logRes.data ?? []
  const totalCount = logRes.count ?? 0
  const agents = agentsRes.data ?? []
  const totalPages = Math.ceil(totalCount / perPage)

  // Get unique table names for the filter
  const tables = [...new Set(logs.map((l) => l.table_name))].sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Activity Log</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Every database write by agents, with before/after values. {totalCount} total entries.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <form className="flex gap-3" method="GET">
          <select name="table" className="input w-40 text-xs" defaultValue={params.table ?? ''}>
            <option value="">All tables</option>
            {tables.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select name="agent" className="input w-48 text-xs" defaultValue={params.agent ?? ''}>
            <option value="">All agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <button type="submit" className="btn-ghost text-xs">Filter</button>
        </form>
      </div>

      {/* Log table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Time</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Agent</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Table</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Op</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Record</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Dry?</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Run</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                  No activity logged yet. Agent writes will appear here.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="group hover:bg-[#18181b]">
                  <td className="px-4 py-2.5 text-xs text-zinc-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-400">
                    {(log.agents as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                      {log.table_name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      log.operation === 'insert'
                        ? 'bg-emerald-900/30 text-emerald-400'
                        : log.operation === 'update'
                          ? 'bg-yellow-900/30 text-yellow-400'
                          : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {log.operation}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-500 max-w-[120px] truncate">
                    {log.record_id ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {log.dry_run
                      ? <span className="text-yellow-400 text-[10px]">DRY</span>
                      : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {log.run_id && (
                      <Link href={`/runs/${log.run_id}`} className="btn-ghost text-xs">View run</Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/activity?page=${page - 1}${params.table ? `&table=${params.table}` : ''}${params.agent ? `&agent=${params.agent}` : ''}`}
                className="btn-ghost text-xs"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/activity?page=${page + 1}${params.table ? `&table=${params.table}` : ''}${params.agent ? `&agent=${params.agent}` : ''}`}
                className="btn-ghost text-xs"
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
