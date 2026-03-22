import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

interface SearchParams {
  status?: string
  plan?: string
  page?: string
}

const PAGE_SIZE = 25

export default async function EmployersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { status, plan, page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  let query = supabase
    .from('employers')
    .select('*, boards(name)', { count: 'exact' })
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)
  if (plan) query = query.eq('plan', plan)

  const { data: employers, count } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Employers</h1>
        <p className="text-sm text-zinc-500">{count ?? 0} total employers</p>
      </div>

      {/* Filters */}
      <form className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <select
          name="status"
          defaultValue={status ?? ''}
          className="input sm:w-40"
        >
          <option value="">All statuses</option>
          {['pending', 'active', 'inactive', 'archived'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          name="plan"
          defaultValue={plan ?? ''}
          className="input sm:w-36"
        >
          <option value="">All plans</option>
          {['free', 'basic', 'premium'].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Filter</button>
        {(status || plan) && (
          <Link href="/employers" className="btn-ghost">Clear</Link>
        )}
      </form>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Company Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Contact</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Location</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Plan</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Previous Seasons</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {(employers ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No employers found</td>
              </tr>
            ) : (
              (employers ?? []).map((employer) => (
                <tr key={employer.id} className="hover:bg-[#18181b]">
                  <td className="px-4 py-2.5">
                    <Link href={`/employers/${employer.id}`} className="font-medium text-zinc-200 hover:text-indigo-400">
                      {employer.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-zinc-300">{employer.contact_name ?? '—'}</p>
                    {employer.contact_email && (
                      <p className="text-xs text-zinc-500">{employer.contact_email}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400">{employer.location ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge-${employer.plan}`}>{employer.plan ?? '—'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400">{employer.previous_seasons ?? 0}</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge-${employer.status}`}>{employer.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/employers/${employer.id}`} className="btn-ghost text-xs">View →</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
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
                href={`/employers?page=${page - 1}${status ? `&status=${status}` : ''}${plan ? `&plan=${plan}` : ''}`}
                className="btn-secondary"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/employers?page=${page + 1}${status ? `&status=${status}` : ''}${plan ? `&plan=${plan}` : ''}`}
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
