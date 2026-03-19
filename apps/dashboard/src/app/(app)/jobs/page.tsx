import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

interface SearchParams {
  status?: string
  page?: string
}

const PAGE_SIZE = 25

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { status, page: pageStr } = await searchParams
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

  const { data: jobs, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Jobs</h1>
        <p className="text-sm text-zinc-500">{count ?? 0} jobs</p>
      </div>

      <form className="flex gap-3">
        <select name="status" defaultValue={status ?? ''} className="input w-36">
          <option value="">All statuses</option>
          {['draft', 'open', 'filled', 'closed', 'expired'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Filter</button>
        {status && <Link href="/jobs" className="btn-ghost">Clear</Link>}
      </form>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Title</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Employer</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Board</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Slots</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Season</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {(jobs ?? []).length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No jobs found</td></tr>
            ) : (
              (jobs ?? []).map((job) => (
                <tr key={job.id} className="hover:bg-[#18181b]">
                  <td className="px-4 py-2.5">
                    <Link href={`/jobs/${job.id}`} className="text-zinc-200 hover:text-indigo-400">
                      {job.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400">
                    {(job.employers as { company_name: string } | null)?.company_name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400">
                    {(job.boards as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                    {job.slots_filled}/{job.slots_total}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`badge-${job.status}`}>{job.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-400">{job.season ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/jobs?page=${page - 1}${status ? `&status=${status}` : ''}`} className="btn-secondary">Previous</Link>}
            {page < totalPages && <Link href={`/jobs?page=${page + 1}${status ? `&status=${status}` : ''}`} className="btn-secondary">Next</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
