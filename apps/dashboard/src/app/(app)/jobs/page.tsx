import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

interface SearchParams {
  status?: string
  board_id?: string
  page?: string
}

const PAGE_SIZE = 25

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { status, board_id, page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  let query = supabase
    .from('jobs')
    .select('*, employers(company_name), boards(name)', { count: 'exact' })
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)
  if (board_id) query = query.eq('board_id', board_id)

  const { data: jobs, count } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const { data: boards } = await supabase
    .from('boards')
    .select('id, name')
    .eq('workspace_id', workspaceId ?? '')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Jobs</h1>
        <p className="text-sm text-zinc-500">{count ?? 0} total jobs</p>
      </div>

      {/* Filters */}
      <form className="flex gap-3">
        <select
          name="status"
          defaultValue={status ?? ''}
          className="input w-36"
        >
          <option value="">All statuses</option>
          {['draft', 'open', 'filled', 'closed', 'expired'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          name="board_id"
          defaultValue={board_id ?? ''}
          className="input w-48"
        >
          <option value="">All boards</option>
          {(boards ?? []).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Filter</button>
        {(status || board_id) && (
          <Link href="/jobs" className="btn-ghost">Clear</Link>
        )}
      </form>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Title</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Employer</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Board</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Location</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Season</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Slots</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {(jobs ?? []).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">No jobs found</td>
              </tr>
            ) : (
              (jobs ?? []).map((job) => {
                const employer = job.employers as { company_name: string } | null
                const board = job.boards as { name: string } | null
                return (
                  <tr key={job.id} className="hover:bg-[#18181b]">
                    <td className="px-4 py-2.5">
                      <Link href={`/jobs/${job.id}`} className="font-medium text-zinc-200 hover:text-indigo-400">
                        {job.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-300">{employer?.company_name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{board?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{job.location ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{job.season ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-400">
                      {job.slots_filled ?? 0}/{job.slots_total ?? 0}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`badge-${job.status}`}>{job.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/jobs/${job.id}`} className="btn-ghost text-xs">View →</Link>
                    </td>
                  </tr>
                )
              })
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
                href={`/jobs?page=${page - 1}${status ? `&status=${status}` : ''}${board_id ? `&board_id=${board_id}` : ''}`}
                className="btn-secondary"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/jobs?page=${page + 1}${status ? `&status=${status}` : ''}${board_id ? `&board_id=${board_id}` : ''}`}
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
