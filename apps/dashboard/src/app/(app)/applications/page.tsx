import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

interface SearchParams {
  status?: string
  page?: string
}

const PAGE_SIZE = 25

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-zinc-400'
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { status, page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  let query = supabase
    .from('applications')
    .select('*, candidates(first_name, last_name), jobs(title, employers(company_name))', { count: 'exact' })
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)

  const { data: applications, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Applications</h1>
        <p className="text-sm text-zinc-500">{count ?? 0} applications — scored by agents</p>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <select name="status" defaultValue={status ?? ''} className="input sm:w-44">
          <option value="">All statuses</option>
          {['new', 'reviewed', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Filter</button>
        {status && <Link href="/applications" className="btn-ghost">Clear</Link>}
      </form>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Candidate</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Job</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Employer</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Match</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Scoring factors</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Applied</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {(applications ?? []).length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No applications found</td></tr>
            ) : (
              (applications ?? []).map((app) => {
                const candidate = app.candidates as { first_name: string; last_name: string | null } | null
                const job = app.jobs as { title: string; employers: { company_name: string } | null } | null
                const factors = app.scoring_factors as Record<string, number> | null

                return (
                  <tr key={app.id} className="hover:bg-[#18181b]">
                    <td className="px-4 py-2.5 text-zinc-200">
                      {candidate ? `${candidate.first_name} ${candidate.last_name ?? ''}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-300">{job?.title ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{job?.employers?.company_name ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      {app.match_score != null ? (
                        <span className={`font-mono text-sm font-semibold ${scoreColor(app.match_score)}`}>
                          {app.match_score}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {factors ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(factors).map(([key, val]) => (
                            <span key={key} className={`rounded px-1 py-0.5 text-[10px] ${
                              val >= 80 ? 'bg-emerald-900/30 text-emerald-400' :
                              val >= 50 ? 'bg-yellow-900/30 text-yellow-400' :
                              'bg-zinc-800 text-zinc-500'
                            }`}>
                              {key}: {val}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`badge-${app.status}`}>{app.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/applications?page=${page - 1}${status ? `&status=${status}` : ''}`} className="btn-secondary">Previous</Link>}
            {page < totalPages && <Link href={`/applications?page=${page + 1}${status ? `&status=${status}` : ''}`} className="btn-secondary">Next</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
