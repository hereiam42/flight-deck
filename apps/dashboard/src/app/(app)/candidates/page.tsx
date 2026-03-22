import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

interface SearchParams {
  status?: string
  page?: string
}

const PAGE_SIZE = 25

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { status, page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  let query = supabase
    .from('candidates')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)

  const { data: candidates, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Candidates</h1>
        <p className="text-sm text-zinc-500">{count ?? 0} candidates — processed by agents</p>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <select name="status" defaultValue={status ?? ''} className="input sm:w-36">
          <option value="">All statuses</option>
          {['active', 'placed', 'inactive', 'archived'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Filter</button>
        {status && <Link href="/candidates" className="btn-ghost">Clear</Link>}
      </form>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Nationality</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-zinc-500 sm:table-cell">Languages</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Visa</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-zinc-500 sm:table-cell">Available</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-zinc-500 sm:table-cell">Source</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {(candidates ?? []).length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No candidates found</td></tr>
            ) : (
              (candidates ?? []).map((c) => (
                <tr key={c.id} className="hover:bg-[#18181b]">
                  <td className="px-4 py-2.5">
                    <Link href={`/candidates/${c.id}`} className="text-zinc-200 hover:text-indigo-400">
                      {c.first_name} {c.last_name ?? ''}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400">{c.nationality ?? '—'}</td>
                  <td className="hidden px-4 py-2.5 text-xs text-zinc-400 sm:table-cell">
                    {c.languages?.join(', ') || '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    {c.visa_status ? (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                        {c.visa_status.replace(/_/g, ' ')}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="hidden px-4 py-2.5 text-xs text-zinc-400 sm:table-cell">
                    {c.available_from && c.available_to
                      ? `${new Date(c.available_from).toLocaleDateString()} – ${new Date(c.available_to).toLocaleDateString()}`
                      : '—'}
                  </td>
                  <td className="hidden px-4 py-2.5 text-xs text-zinc-500 sm:table-cell">{c.source_channel ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-zinc-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/candidates?page=${page - 1}${status ? `&status=${status}` : ''}`} className="btn-secondary">Previous</Link>}
            {page < totalPages && <Link href={`/candidates?page=${page + 1}${status ? `&status=${status}` : ''}`} className="btn-secondary">Next</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
