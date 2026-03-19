import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

interface SearchParams {
  status?: string
  q?: string
  page?: string
}

const PAGE_SIZE = 25

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { status, q, page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  let query = supabase
    .from('candidates')
    .select('*, boards:source_board_id(name)', { count: 'exact' })
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)
  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: candidates, count } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Candidates</h1>
        <p className="text-sm text-zinc-500">{count ?? 0} total candidates</p>
      </div>

      {/* Filters */}
      <form className="flex gap-3">
        <input
          name="q"
          type="text"
          placeholder="Search name or email…"
          defaultValue={q ?? ''}
          className="input w-64"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="input w-40"
        >
          <option value="">All statuses</option>
          {['active', 'placed', 'inactive', 'archived'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Filter</button>
        {(status || q) && (
          <Link href="/candidates" className="btn-ghost">Clear</Link>
        )}
      </form>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Email</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Nationality</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Visa Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Languages</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Source Board</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {(candidates ?? []).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  No candidates found
                </td>
              </tr>
            ) : (
              (candidates ?? []).map((candidate) => {
                const board = candidate.boards as { name: string } | null
                const languages = Array.isArray(candidate.languages)
                  ? candidate.languages.join(', ')
                  : candidate.languages ?? '—'
                return (
                  <tr key={candidate.id} className="hover:bg-[#18181b]">
                    <td className="px-4 py-2.5">
                      <Link href={`/candidates/${candidate.id}`} className="font-medium text-zinc-200 hover:text-indigo-400">
                        {candidate.first_name} {candidate.last_name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400">
                      {candidate.email ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400">
                      {candidate.nationality ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400">
                      {candidate.visa_status ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-400">
                      {languages}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`badge-${candidate.status}`}>{candidate.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-400">
                      {board?.name ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/candidates/${candidate.id}`} className="btn-ghost text-xs">View →</Link>
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
                href={`/candidates?page=${page - 1}${q ? `&q=${q}` : ''}${status ? `&status=${status}` : ''}`}
                className="btn-secondary"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/candidates?page=${page + 1}${q ? `&q=${q}` : ''}${status ? `&status=${status}` : ''}`}
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
